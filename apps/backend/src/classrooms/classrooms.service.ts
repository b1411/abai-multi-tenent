import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

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
}
