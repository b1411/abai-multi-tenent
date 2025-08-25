import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async create(createClassroomDto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: createClassroomDto,
    });
  }

  async findAll() {
    return this.prisma.classroom.findMany({
      where: { deletedAt: null },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: number) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id, deletedAt: null },
      include: {
        responsible: {
          select: { id: true, name: true, surname: true },
        },
        schedules: {
            where: { deletedAt: null },
            include: {
              studyPlan: true,
              group: true,
              teacher: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' },
            ],
        },
        bookings: {
          where: { deletedAt: null },
          orderBy: [
            { date: 'desc' },
            { startTime: 'asc' },
          ],
          take: 50,
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    return classroom;
  }

  async update(id: number, updateClassroomDto: UpdateClassroomDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.classroom.update({
      where: { id },
      data: updateClassroomDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.classroom.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для аудиторий
  async findByBuilding(building: string) {
    return this.prisma.classroom.findMany({
      where: { 
        building,
        deletedAt: null 
      },
      orderBy: [
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findByType(type: string) {
    return this.prisma.classroom.findMany({
      where: { 
        type,
        deletedAt: null 
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findByCapacity(minCapacity: number, maxCapacity?: number) {
    return this.prisma.classroom.findMany({
      where: {
        capacity: {
          gte: minCapacity,
          ...(maxCapacity && { lte: maxCapacity }),
        },
        deletedAt: null,
      },
      orderBy: [
        { capacity: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findAvailableClassrooms(dayOfWeek: number, startTime: string, endTime: string) {
    // Находим аудитории, которые НЕ заняты в указанное время
    const occupiedClassroomIds = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        deletedAt: null,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      select: { classroomId: true },
    });

    const occupiedIds = occupiedClassroomIds
      .map(schedule => schedule.classroomId)
      .filter(id => id !== null);

    return this.prisma.classroom.findMany({
      where: {
        id: { notIn: occupiedIds },
        deletedAt: null,
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findByEquipment(equipment: string[]) {
    return this.prisma.classroom.findMany({
      where: {
        equipment: {
          hasEvery: equipment, // Аудитория должна иметь ВСЕ указанное оборудование
        },
        deletedAt: null,
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async getClassroomStatistics() {
    const totalClassrooms = await this.prisma.classroom.count({
      where: { deletedAt: null },
    });

    const classroomsByType = await this.prisma.classroom.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _count: true,
    });

    const classroomsByBuilding = await this.prisma.classroom.groupBy({
      by: ['building'],
      where: { deletedAt: null },
      _count: true,
    });

    const capacityStats = await this.prisma.classroom.aggregate({
      where: { deletedAt: null },
      _avg: { capacity: true },
      _min: { capacity: true },
      _max: { capacity: true },
      _sum: { capacity: true },
    });

    return {
      totalClassrooms,
      classroomsByType,
      classroomsByBuilding,
      capacityStats,
    };
  }

  // ----------------- Bookings -----------------

  private timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
    return (
      (aStart <= bStart && aEnd > bStart) ||
      (aStart < bEnd && aEnd >= bEnd) ||
      (aStart >= bStart && aEnd <= bEnd)
    );
  }

  async createBooking(dto: {
    classroomId: number;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    responsiblePerson: string;
    contactInfo: string;
    description?: string;
  }, userId: number) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, deletedAt: null },
      select: { id: true, name: true, building: true, floor: true },
    });
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }

    // Проверка пересечений по бронированиям (учитываем только активные / ожидающие)
    const existing = await this.prisma.classroomBooking.findMany({
      where: {
        classroomId: dto.classroomId,
        deletedAt: null,
        date: new Date(dto.date),
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { id: true, startTime: true, endTime: true },
    });

    const conflict = existing.some(b =>
      this.timesOverlap(dto.startTime, dto.endTime, b.startTime, b.endTime)
    );

    if (conflict) {
      throw new BadRequestException('Время занято');
    }

    const booking = await this.prisma.classroomBooking.create({
      data: {
        classroomId: dto.classroomId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        purpose: dto.purpose,
        responsiblePerson: dto.responsiblePerson,
        contactInfo: dto.contactInfo,
        description: dto.description,
        status: 'PENDING',
        createdById: userId,
      },
    });

    // Уведомляем админов
    this.notifications.notifyClassroomBookingCreated({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        building: classroom.building,
        floor: classroom.floor,
      },
      booking: {
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        responsiblePerson: booking.responsiblePerson,
        contactInfo: booking.contactInfo,
      },
      createdBy: userId,
    }).catch(err => {
      // Логируем, но не прерываем создание бронирования
      // eslint-disable-next-line no-console
      console.error('Failed to send booking notification', err);
    });

    return booking;
  }

  async listBookings(classroomId: number, date?: string) {
    const where: any = {
      classroomId,
      deletedAt: null,
    };
    if (date) {
      where.date = new Date(date);
    }

    return this.prisma.classroomBooking.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { startTime: 'asc' },
      ],
    });
  }

  async updateBookingStatus(
    bookingId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  ) {
    const booking = await this.prisma.classroomBooking.findFirst({
      where: { id: bookingId, deletedAt: null },
      select: { id: true }
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.classroomBooking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  // ----------------- Documents -----------------

  async attachDocument(classroomId: number, fileId: number) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, deletedAt: null },
      select: { id: true, fileIds: true },
    });
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    if (classroom.fileIds.includes(fileId)) {
      return classroom; // уже прикреплен
    }

    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: {
        fileIds: {
          set: [...classroom.fileIds, fileId],
        },
      },
      select: { id: true, fileIds: true },
    });
  }

  async detachDocument(classroomId: number, fileId: number) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, deletedAt: null },
      select: { id: true, fileIds: true },
    });
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    if (!classroom.fileIds.includes(fileId)) {
      return classroom;
    }

    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: {
        fileIds: {
          set: classroom.fileIds.filter(id => id !== fileId),
        },
      },
      select: { id: true, fileIds: true },
    });
  }
}
