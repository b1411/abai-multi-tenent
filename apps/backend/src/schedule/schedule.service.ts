import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantConfigService } from '../common/tenant-config.service';

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private tenantConfig: TenantConfigService
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    // Проверяем существование связанных сущностей
    await this.validateRelatedEntities(createScheduleDto);

    // Конфликты: либо мягкое удаление при overwrite, либо проверка
    if (createScheduleDto.overwrite) {
      await this.softDeleteConflicts(createScheduleDto);
    } else {
      await this.checkScheduleConflicts(createScheduleDto);
    }

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
    if (createScheduleDto.classroomId) data.classroomId = createScheduleDto.classroomId;
    if (createScheduleDto.lessonId) data.lessonId = createScheduleDto.lessonId;
    if (createScheduleDto.date) data.date = new Date(createScheduleDto.date);
    if (createScheduleDto.type) data.type = createScheduleDto.type;
    if (createScheduleDto.status) data.status = createScheduleDto.status;
    if (createScheduleDto.repeat) data.repeat = createScheduleDto.repeat;

    // Период повторения
    if (createScheduleDto.periodPreset) {
      const { startDate, endDate } = this.resolvePeriodPreset(createScheduleDto.periodPreset);
      data.startDate = startDate;
      data.endDate = endDate;
      data.periodPreset = createScheduleDto.periodPreset;
    } else {
      if (createScheduleDto.startDate) data.startDate = new Date(createScheduleDto.startDate);
      if (createScheduleDto.endDate) data.endDate = new Date(createScheduleDto.endDate);
      if (createScheduleDto.periodPreset) data.periodPreset = createScheduleDto.periodPreset;
    }

    // Валидации для повторяющихся занятий
    if (createScheduleDto.repeat && createScheduleDto.repeat !== 'once') {
      if (!data.startDate || !data.endDate) {
        throw new BadRequestException('Для repeat weekly/biweekly требуется startDate и endDate или periodPreset');
      }
      if (data.startDate > data.endDate) {
        throw new BadRequestException('startDate не может быть позже endDate');
      }
    }

    return this.prisma.schedule.create({
      data,
      include: {
        studyPlan: true,
        group: true,
        teacher: { include: { user: true } },
        classroom: true,
      },
    });
  }

  async findAll() {
    // Сначала обновляем статусы прошедших занятий
    await this.updatePastScheduleStatuses();
    
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
    if (updateScheduleDto.date !== undefined) data.date = updateScheduleDto.date ? new Date(updateScheduleDto.date) : null;
    if (updateScheduleDto.dayOfWeek !== undefined) data.dayOfWeek = updateScheduleDto.dayOfWeek;
    if (updateScheduleDto.startTime !== undefined) data.startTime = updateScheduleDto.startTime;
    if (updateScheduleDto.endTime !== undefined) data.endTime = updateScheduleDto.endTime;
    if (updateScheduleDto.type !== undefined) data.type = updateScheduleDto.type;
    if (updateScheduleDto.status !== undefined) data.status = updateScheduleDto.status;
    if (updateScheduleDto.repeat !== undefined) data.repeat = updateScheduleDto.repeat;

    // Период
    if (updateScheduleDto.periodPreset) {
      const { startDate, endDate } = this.resolvePeriodPreset(updateScheduleDto.periodPreset);
      data.startDate = startDate;
      data.endDate = endDate;
      data.periodPreset = updateScheduleDto.periodPreset;
    } else {
      if (updateScheduleDto.startDate !== undefined) {
        data.startDate = updateScheduleDto.startDate ? new Date(updateScheduleDto.startDate as any) : null;
      }
      if (updateScheduleDto.endDate !== undefined) {
        data.endDate = updateScheduleDto.endDate ? new Date(updateScheduleDto.endDate as any) : null;
      }
      if (updateScheduleDto.periodPreset === null) {
        data.periodPreset = null;
      }
    }

    if (data.repeat && data.repeat !== 'once') {
      if (!data.startDate || !data.endDate) {
        throw new BadRequestException('Для repeat weekly/biweekly требуется startDate и endDate или periodPreset');
      }
      if (data.startDate > data.endDate) {
        throw new BadRequestException('startDate не может быть позже endDate');
      }
    }

    return this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        studyPlan: true,
        group: true,
        teacher: { include: { user: true } },
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
        date: scheduleItem.date,
        dayOfWeek: dayMapping[dayOfWeek],
        startTime: scheduleItem.startTime,
        endTime: scheduleItem.endTime,
        type: 'REGULAR',
        status: 'SCHEDULED',
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

  private resolvePeriodPreset(preset: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const schoolYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
    const d = (y: number, m: number, day: number) => new Date(y, m, day);

    if (this.tenantConfig.periodType === 'semester') {
      switch (preset) {
        case 'semester1':
        case 'fall_semester':
          return { startDate: d(schoolYear, 8, 1), endDate: d(schoolYear, 11, 31) }; // Sep 1 - Dec 31
        case 'semester2':
        case 'spring_semester':
          return { startDate: d(schoolYear + 1, 0, 9), endDate: d(schoolYear + 1, 4, 31) }; // Jan 9 - May 31
        case 'year':
          return { startDate: d(schoolYear, 8, 1), endDate: d(schoolYear + 1, 4, 31) }; // Sep 1 - May 31
        default:
          throw new BadRequestException('Неизвестный periodPreset для семестра');
      }
    } else {
      switch (preset) {
        case 'quarter1':
          return { startDate: d(schoolYear, 8, 1), endDate: d(schoolYear, 9, 31) }; // Sep 1 - Oct 31
        case 'quarter2':
          return { startDate: d(schoolYear, 10 - 1, 1), endDate: d(schoolYear, 11, 31) }; // Nov 1 - Dec 31
        case 'quarter3':
          return { startDate: d(schoolYear + 1, 0, 9), endDate: d(schoolYear + 1, 2, 31) }; // Jan 9 - Mar 31
        case 'quarter4':
          return { startDate: d(schoolYear + 1, 3, 1), endDate: d(schoolYear + 1, 4, 31) }; // Apr 1 - May 31
        case 'half_year_1':
          return { startDate: d(schoolYear, 8, 1), endDate: d(schoolYear, 11, 31) }; // Sep 1 - Dec 31
        case 'half_year_2':
          return { startDate: d(schoolYear + 1, 0, 9), endDate: d(schoolYear + 1, 4, 31) }; // Jan 9 - May 31
        case 'year':
          return { startDate: d(schoolYear, 8, 1), endDate: d(schoolYear + 1, 4, 31) }; // Sep 1 - May 31
        default:
          throw new BadRequestException('Неизвестный periodPreset');
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

  // Мягкое удаление конфликтующих записей при overwrite
  private async softDeleteConflicts(dto: CreateScheduleDto): Promise<number> {
    // Вычисляем границы периода
    let startBound: Date | null = null;
    let endBound: Date | null = null;

    if (dto.periodPreset) {
      const { startDate, endDate } = this.resolvePeriodPreset(dto.periodPreset);
      startBound = startDate;
      endBound = endDate;
    } else if (dto.startDate && dto.endDate) {
      startBound = new Date(dto.startDate);
      endBound = new Date(dto.endDate);
    } else if (dto.date) {
      const d = new Date(dto.date);
      startBound = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      endBound = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // Условие пересечения по времени
    const timeOverlap = {
      OR: [
        { AND: [{ startTime: { lte: dto.startTime } }, { endTime: { gt: dto.startTime } }] },
        { AND: [{ startTime: { lt: dto.endTime } }, { endTime: { gte: dto.endTime } }] },
        { AND: [{ startTime: { gte: dto.startTime } }, { endTime: { lte: dto.endTime } }] },
      ],
    } as any;

    // Условие по участникам (учитель/группа/аудитория)
    const participantOverlap = {
      OR: [
        { teacherId: dto.teacherId },
        { groupId: dto.groupId },
        ...(dto.classroomId ? [{ classroomId: dto.classroomId }] : []),
      ],
    } as any;

    // Условие по периоду
    let periodOverlap: any = {};
    if (startBound && endBound) {
      periodOverlap = {
        OR: [
          { date: { gte: startBound, lte: endBound } },
          {
            AND: [
              { date: null },
              { OR: [{ startDate: null }, { startDate: { lte: endBound } }] },
              { OR: [{ endDate: null }, { endDate: { gte: startBound } }] },
            ],
          },
        ],
      };
    }

    const where: any = {
      deletedAt: null,
      dayOfWeek: dto.dayOfWeek,
      ...timeOverlap,
      AND: [
        participantOverlap,
        ...(startBound && endBound ? [periodOverlap] : []),
      ],
    };

    const result = await this.prisma.schedule.updateMany({
      where,
      data: { deletedAt: new Date() },
    });

    return result.count;
  }
  
  // Метод для автоматического обновления статусов прошедших занятий
  async updatePastScheduleStatuses(): Promise<{ updated: number }> {
    // Используем часовой пояс Алматы (UTC+5)
    const now = new Date();
    const almaty_now = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // Добавляем 5 часов для UTC+5
    const today = new Date(almaty_now.getFullYear(), almaty_now.getMonth(), almaty_now.getDate());
    
    console.log(`[ScheduleService] Текущее время UTC: ${now.toISOString()}`);
    console.log(`[ScheduleService] Текущее время Алматы: ${almaty_now.toISOString()}`);
    console.log(`[ScheduleService] Сегодняшняя дата Алматы: ${today.toISOString().split('T')[0]}`);
    console.log(`[ScheduleService] День недели: ${almaty_now.getDay() === 0 ? 7 : almaty_now.getDay()} (четверг = 4)`);
    
    // 1. Обновляем занятия с датами из прошлых дней (вчера и раньше)
    const updatedPastDates = await this.prisma.schedule.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['SCHEDULED'] },
        date: {
          lt: today, // Дата меньше сегодняшней (вчера и раньше)
        },
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // 2. Обновляем занятия с сегодняшней датой, где время окончания уже прошло
    const todaySchedules = await this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        status: { in: ['SCHEDULED'] },
        date: today, // Сегодняшняя дата
      },
    });

    let updatedTodayCount = 0;
    
    for (const schedule of todaySchedules) {
      // Создаем объект Date для времени окончания занятия сегодня в часовом поясе Алматы
      const endDateTime = new Date(today);
      const [hours, minutes] = schedule.endTime.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      console.log(`[ScheduleService] Проверяем занятие с датой: ${schedule.startTime}-${schedule.endTime}, окончание: ${endDateTime.toISOString()}, текущее время: ${almaty_now.toISOString()}`);
      
      // Сравниваем с временем Алматы
      if (endDateTime <= almaty_now) {
        await this.prisma.schedule.update({
          where: { id: schedule.id },
          data: { status: 'COMPLETED' },
        });
        updatedTodayCount++;
        console.log(`[ScheduleService] Обновлено занятие с конкретной датой: ${schedule.startTime}-${schedule.endTime}`);
      }
    }

    // 3. Обновляем периодические занятия без конкретной даты на основе дня недели и времени
    const currentDayOfWeek = almaty_now.getDay() === 0 ? 7 : almaty_now.getDay(); // Используем время Алматы
    
    console.log(`[ScheduleService] Ищем периодические занятия для дня недели: ${currentDayOfWeek} (четверг = 4)`);
    
    // Находим периодические занятия сегодняшнего дня недели без конкретной даты
    const periodicTodaySchedules = await this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        status: { in: ['SCHEDULED'] },
        date: null, // Без конкретной даты (периодические)
        dayOfWeek: currentDayOfWeek, // Сегодняшний день недели
      },
    });

    console.log(`[ScheduleService] Найдено ${periodicTodaySchedules.length} периодических занятий на день ${currentDayOfWeek}`);
    
    let updatedPeriodicCount = 0;
    
    for (const schedule of periodicTodaySchedules) {
      // Создаем объект Date для времени окончания занятия сегодня в часовом поясе Алматы
      const endDateTime = new Date(today);
      const [hours, minutes] = schedule.endTime.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      console.log(`[ScheduleService] Проверяем периодическое занятие: ${schedule.startTime}-${schedule.endTime}, окончание: ${endDateTime.toISOString()}, текущее время: ${almaty_now.toISOString()}`);
      
      // Сравниваем с временем Алматы
      if (endDateTime <= almaty_now) {
        // Проверяем, что экземпляр для сегодня еще не создан
        const existingInstance = await this.prisma.schedule.findFirst({
          where: {
            teacherId: schedule.teacherId,
            groupId: schedule.groupId,
            studyPlanId: schedule.studyPlanId,
            date: today,
            startTime: schedule.startTime,
            deletedAt: null,
          }
        });
        
        if (!existingInstance) {
          // Создаем завершенный экземпляр для сегодня
          await this.prisma.schedule.create({
            data: {
              studyPlanId: schedule.studyPlanId,
              groupId: schedule.groupId,
              teacherId: schedule.teacherId,
              classroomId: schedule.classroomId,
              lessonId: schedule.lessonId,
              dayOfWeek: schedule.dayOfWeek,
              date: today,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              type: schedule.type || 'REGULAR',
              status: 'COMPLETED',
              repeat: 'once', // Экземпляр не повторяется
            },
          });
          updatedPeriodicCount++;
          console.log(`[ScheduleService] Создан завершенный экземпляр для периодического занятия: ${schedule.startTime}-${schedule.endTime}`);
        } else {
          console.log(`[ScheduleService] Экземпляр уже существует для занятия: ${schedule.startTime}-${schedule.endTime}`);
        }
      } else {
        console.log(`[ScheduleService] Занятие ${schedule.startTime}-${schedule.endTime} еще не завершилось`);
      }
    }
    
    const totalUpdated = updatedPastDates.count + updatedTodayCount + updatedPeriodicCount;
    
    if (totalUpdated > 0) {
      console.log(`[ScheduleService] Автоматически обновлено ${totalUpdated} занятий на COMPLETED (${updatedPastDates.count} из прошлых дней, ${updatedTodayCount} из сегодняшних с датой, ${updatedPeriodicCount} периодических сегодняшних)`);
    }

    return { updated: totalUpdated };
  }

  // Метод для генерации конкретных занятий из периодических записей
  async generateScheduleInstances(
    startDate: Date, 
    endDate: Date, 
    scheduleId?: string
  ): Promise<{ generated: number }> {
    // Находим периодические записи расписания
    const periodicSchedules = await this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        repeat: { in: ['weekly', 'biweekly'] },
        ...(scheduleId && { id: scheduleId }),
      },
      include: {
        studyPlan: true,
        group: true,
        teacher: { include: { user: true } },
        classroom: true,
      },
    });

    let generatedCount = 0;

    for (const schedule of periodicSchedules) {
      const instances = this.generateInstancesForSchedule(schedule, startDate, endDate);
      
      for (const instance of instances) {
        try {
          // Проверяем, что такой экземпляр еще не существует
          const existing = await this.prisma.schedule.findFirst({
            where: {
              teacherId: schedule.teacherId,
              groupId: schedule.groupId,
              date: instance.date,
              startTime: schedule.startTime,
              deletedAt: null,
            },
          });

          if (!existing) {
            await this.prisma.schedule.create({
              data: {
                studyPlanId: schedule.studyPlanId,
                groupId: schedule.groupId,
                teacherId: schedule.teacherId,
                classroomId: schedule.classroomId,
                lessonId: schedule.lessonId,
                dayOfWeek: schedule.dayOfWeek,
                date: instance.date,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                type: schedule.type || 'REGULAR',
                status: instance.status,
                repeat: 'once', // Экземпляры не повторяются
              },
            });
            generatedCount++;
          }
        } catch (error) {
          console.error(`Ошибка при создании экземпляра расписания:`, error);
        }
      }
    }

    if (generatedCount > 0) {
      console.log(`[ScheduleService] Сгенерировано ${generatedCount} экземпляров расписания`);
    }

    return { generated: generatedCount };
  }

  // Генерация экземпляров для одной записи расписания
  private generateInstancesForSchedule(
    schedule: any,
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'POSTPONED' | 'MOVED' | 'RESCHEDULED' }> {
    const instances: Array<{ date: Date; status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'POSTPONED' | 'MOVED' | 'RESCHEDULED' }> = [];
    const now = new Date();

    // Учитываем границы самой записи расписания (schedule.startDate / schedule.endDate)
    let effectiveStart = new Date(startDate);
    let effectiveEnd = new Date(endDate);
    if (schedule.startDate) {
      const sd = new Date(schedule.startDate);
      if (sd > effectiveStart) effectiveStart = sd;
    }
    if (schedule.endDate) {
      const ed = new Date(schedule.endDate);
      if (ed < effectiveEnd) effectiveEnd = ed;
    }
    // Нет пересечения
    if (effectiveStart > effectiveEnd) {
      return instances;
    }

    // Опорная дата для biweekly (чтобы соблюдать 14-дневный шаг от начала периода расписания)
    let biweeklyAnchor: Date | null = null;
    if (schedule.repeat === 'biweekly' && schedule.startDate) {
      const anchorCandidate = new Date(schedule.startDate);
      // Сдвигаем вперед до нужного дня недели
      while ((anchorCandidate.getDay() === 0 ? 7 : anchorCandidate.getDay()) !== schedule.dayOfWeek) {
        anchorCandidate.setDate(anchorCandidate.getDate() + 1);
      }
      biweeklyAnchor = anchorCandidate;
    }

    // Старт курсора
    const current = new Date(effectiveStart);

    // Найти первое вхождение дня недели в пределах периода
    while ((current.getDay() === 0 ? 7 : current.getDay()) !== schedule.dayOfWeek && current <= effectiveEnd) {
      current.setDate(current.getDate() + 1);
    }

    // Выравнивание для biweekly относительно anchor
    if (schedule.repeat === 'biweekly' && biweeklyAnchor) {
      if (biweeklyAnchor > current && biweeklyAnchor <= effectiveEnd) {
        current.setTime(biweeklyAnchor.getTime());
      } else if (biweeklyAnchor <= current) {
        const diffDays = Math.floor((current.getTime() - biweeklyAnchor.getTime()) / 86400000);
        const remainder = diffDays % 14;
        if (remainder !== 0) {
          current.setDate(current.getDate() + (14 - remainder));
        }
      }
    }

    const intervalDays = schedule.repeat === 'biweekly' ? 14 : 7;

    while (current <= effectiveEnd) {
      // Проверка что день совпадает (безопасно)
      const day = current.getDay() === 0 ? 7 : current.getDay();
      if (day !== schedule.dayOfWeek) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const instanceDateTime = new Date(current);
      const [hours, minutes] = schedule.endTime.split(':');
      instanceDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const status: 'COMPLETED' | 'SCHEDULED' = instanceDateTime < now ? 'COMPLETED' : 'SCHEDULED';

      instances.push({
        date: new Date(current),
        status,
      });

      // Инкремент по интервалу
      current.setDate(current.getDate() + intervalDays);
    }

    return instances;
  }
}
