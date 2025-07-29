import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(createScheduleDto: CreateScheduleDto) {
    // Проверяем существование связанных сущностей
    await this.validateRelatedEntities(createScheduleDto);

    // Проверяем конфликты расписания
    await this.checkScheduleConflicts(createScheduleDto);

    // Преобразуем DTO в правильный формат для Prisma
    const data: any = {
      studyPlanId: createScheduleDto.studyPlanId,
      groupId: createScheduleDto.groupId,
      teacherId: createScheduleDto.teacherId,
      dayOfWeek: createScheduleDto.dayOfWeek,
      startTime: createScheduleDto.startTime,
      endTime: createScheduleDto.endTime,
    };

    // Добавляем опциональные поля если они есть
    if (createScheduleDto.classroomId) {
      data.classroomId = createScheduleDto.classroomId;
    }
    if (createScheduleDto.lessonId) {
      data.lessonId = createScheduleDto.lessonId;
    }
    if (createScheduleDto.date) {
      data.date = createScheduleDto.date;
    }
    if (createScheduleDto.type) {
      data.type = createScheduleDto.type;
    }
    if (createScheduleDto.status) {
      data.status = createScheduleDto.status;
    }
    if (createScheduleDto.repeat) {
      data.repeat = createScheduleDto.repeat;
    }

    return this.prisma.schedule.create({
      data,
      include: {
        studyPlan: true,
        group: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
    });
  }

  async findAll() {
    return this.prisma.schedule.findMany({
      where: { deletedAt: null },
      include: {
        studyPlan: true,
        group: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, deletedAt: null },
      include: {
        studyPlan: true,
        group: {
          include: {
            students: {
              include: {
                user: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    await this.findOne(id); // Проверяем существование

    // Проверяем связанные сущности если они изменяются
    if (updateScheduleDto.studyPlanId || updateScheduleDto.groupId || 
        updateScheduleDto.teacherId || updateScheduleDto.classroomId) {
      await this.validateRelatedEntities(updateScheduleDto as CreateScheduleDto);
    }

    // Проверяем конфликты если изменяется время или день
    if (updateScheduleDto.dayOfWeek || updateScheduleDto.startTime || 
        updateScheduleDto.endTime || updateScheduleDto.teacherId || 
        updateScheduleDto.classroomId) {
      await this.checkScheduleConflicts(updateScheduleDto as CreateScheduleDto, id);
    }

    // Преобразуем DTO в правильный формат для Prisma
    const data: any = {};
    
    // Добавляем только переданные поля
    if (updateScheduleDto.studyPlanId !== undefined) data.studyPlanId = updateScheduleDto.studyPlanId;
    if (updateScheduleDto.groupId !== undefined) data.groupId = updateScheduleDto.groupId;
    if (updateScheduleDto.teacherId !== undefined) data.teacherId = updateScheduleDto.teacherId;
    if (updateScheduleDto.classroomId !== undefined) data.classroomId = updateScheduleDto.classroomId;
    if (updateScheduleDto.lessonId !== undefined) data.lessonId = updateScheduleDto.lessonId;
    if (updateScheduleDto.date !== undefined) data.date = updateScheduleDto.date;
    if (updateScheduleDto.dayOfWeek !== undefined) data.dayOfWeek = updateScheduleDto.dayOfWeek;
    if (updateScheduleDto.startTime !== undefined) data.startTime = updateScheduleDto.startTime;
    if (updateScheduleDto.endTime !== undefined) data.endTime = updateScheduleDto.endTime;
    if (updateScheduleDto.type !== undefined) data.type = updateScheduleDto.type;
    if (updateScheduleDto.status !== undefined) data.status = updateScheduleDto.status;
    if (updateScheduleDto.repeat !== undefined) data.repeat = updateScheduleDto.repeat;

    return this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        studyPlan: true,
        group: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.schedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для работы с расписанием
  async findByGroup(groupId: number) {
    return this.prisma.schedule.findMany({
      where: { 
        groupId,
        deletedAt: null 
      },
      include: {
        studyPlan: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findByTeacher(teacherId: number) {
    return this.prisma.schedule.findMany({
      where: { 
        teacherId,
        deletedAt: null 
      },
      include: {
        studyPlan: true,
        group: true,
        classroom: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findByClassroom(classroomId: number) {
    return this.prisma.schedule.findMany({
      where: { 
        classroomId,
        deletedAt: null 
      },
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
    });
  }

  async findByDayOfWeek(dayOfWeek: number) {
    return this.prisma.schedule.findMany({
      where: { 
        dayOfWeek,
        deletedAt: null 
      },
      include: {
        studyPlan: true,
        group: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findStudyPlansForScheduling(params: { studyPlanIds?: number[], groupIds?: number[], teacherIds?: number[] }) {
    const whereClause: any = { deletedAt: null };

    if (params.studyPlanIds && params.studyPlanIds.length > 0) {
      whereClause.id = { in: params.studyPlanIds };
    }
    if (params.groupIds && params.groupIds.length > 0) {
      whereClause.group = { some: { id: { in: params.groupIds } } };
    }
    if (params.teacherIds && params.teacherIds.length > 0) {
      whereClause.teacherId = { in: params.teacherIds };
    }

    return this.prisma.studyPlan.findMany({
      where: whereClause,
      include: {
        teacher: { include: { user: true } },
        group: true,
      },
    });
  }

  async findAllClassrooms() {
    return this.prisma.classroom.findMany({
      where: { deletedAt: null },
    });
  }

  async findSchedulesByDateRange(startDate: string, endDate: string) {
    return this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
  }

  async processAiSchedulerResponse(aiResult: any, studyPlans: any[], classrooms: any[]) {
    const createSchedulePromises = [];

    for (const scheduleItem of aiResult.schedules) {
      const studyPlan = studyPlans.find(sp => sp.id === scheduleItem.studyPlanId);
      if (!studyPlan) continue;

      const group = studyPlan.group[0];
      if (!group) continue;

      const classroom = classrooms.find(c => c.id === scheduleItem.classroomId);
      
      const dayOfWeek = new Date(scheduleItem.date).getDay();
      const dayMapping = [7, 1, 2, 3, 4, 5, 6]; // JS getDay() is Sun-Sat (0-6), we need Mon-Sun (1-7)

      const createDto: CreateScheduleDto = {
        studyPlanId: scheduleItem.studyPlanId,
        groupId: group.id,
        teacherId: studyPlan.teacherId,
        classroomId: classroom?.id,
        date: new Date(scheduleItem.date),
        dayOfWeek: dayMapping[dayOfWeek],
        startTime: scheduleItem.startTime,
        endTime: scheduleItem.endTime,
        type: 'lesson',
        status: 'upcoming',
        repeat: 'once',
      };
      
      // Добавляем промис создания в массив
      createSchedulePromises.push(this.create(createDto));
    }

    // Ожидаем выполнения всех промисов создания
    const savedSchedules = await Promise.all(createSchedulePromises);

    // Формируем ответ с уже сохраненными данными
    const processedSchedules = savedSchedules.map(s => ({
      ...s,
      studyPlanName: s.studyPlan.name,
      groupName: s.group.name,
      teacherName: `${s.teacher.user.name} ${s.teacher.user.surname}`,
      classroomName: s.classroom?.name || 'Не указана',
    }));

    return {
      generatedSchedules: processedSchedules,
      conflicts: aiResult.conflicts || [],
      recommendations: aiResult.recommendations || [],
    };
  }

  // Приватные методы для валидации
  private async validateRelatedEntities(dto: CreateScheduleDto) {
    // Проверяем учебный план
    const studyPlan = await this.prisma.studyPlan.findFirst({
      where: { id: dto.studyPlanId, deletedAt: null },
    });
    if (!studyPlan) {
      throw new NotFoundException(`StudyPlan with ID ${dto.studyPlanId} not found`);
    }

    // Проверяем группу
    const group = await this.prisma.group.findFirst({
      where: { id: dto.groupId, deletedAt: null },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${dto.groupId} not found`);
    }

    // Проверяем преподавателя
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: dto.teacherId, deletedAt: null },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${dto.teacherId} not found`);
    }

    // Проверяем аудиторию (если указана)
    if (dto.classroomId) {
      const classroom = await this.prisma.classroom.findFirst({
        where: { id: dto.classroomId, deletedAt: null },
      });
      if (!classroom) {
        throw new NotFoundException(`Classroom with ID ${dto.classroomId} not found`);
      }
    }
  }

  private async checkScheduleConflicts(dto: CreateScheduleDto, excludeId?: string) {
    const whereClause = {
      dayOfWeek: dto.dayOfWeek,
      deletedAt: null,
      ...(excludeId && { id: { not: excludeId } }),
    };

    // Проверяем конфликт преподавателя
    const teacherConflict = await this.prisma.schedule.findFirst({
      where: {
        ...whereClause,
        teacherId: dto.teacherId,
        OR: [
          {
            AND: [
              { startTime: { lte: dto.startTime } },
              { endTime: { gt: dto.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: dto.endTime } },
              { endTime: { gte: dto.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: dto.startTime } },
              { endTime: { lte: dto.endTime } },
            ],
          },
        ],
      },
    });

    if (teacherConflict) {
      throw new BadRequestException(
        `Teacher has a schedule conflict on this day and time`
      );
    }

    // Проверяем конфликт аудитории (если указана)
    if (dto.classroomId) {
      const classroomConflict = await this.prisma.schedule.findFirst({
        where: {
          ...whereClause,
          classroomId: dto.classroomId,
          OR: [
            {
              AND: [
                { startTime: { lte: dto.startTime } },
                { endTime: { gt: dto.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: dto.endTime } },
                { endTime: { gte: dto.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: dto.startTime } },
                { endTime: { lte: dto.endTime } },
              ],
            },
          ],
        },
      });

      if (classroomConflict) {
        throw new BadRequestException(
          `Classroom has a schedule conflict on this day and time`
        );
      }
    }

    // Проверяем конфликт группы
    const groupConflict = await this.prisma.schedule.findFirst({
      where: {
        ...whereClause,
        groupId: dto.groupId,
        OR: [
          {
            AND: [
              { startTime: { lte: dto.startTime } },
              { endTime: { gt: dto.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: dto.endTime } },
              { endTime: { gte: dto.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: dto.startTime } },
              { endTime: { lte: dto.endTime } },
            ],
          },
        ],
      },
    });

    if (groupConflict) {
      throw new BadRequestException(
        `Group has a schedule conflict on this day and time`
      );
    }
  }
}
