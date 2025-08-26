import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto } from './dto/update-vacation.dto';
import { VacationFilterDto } from './dto/vacation-filter.dto';
import { UpdateVacationStatusDto } from './dto/update-vacation-status.dto';

@Injectable()
export class VacationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) { }

  async create(createVacationDto: CreateVacationDto, userId: number) {
    // Получаем информацию о пользователе
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, что пользователь может создавать заявки на отпуск
    const allowedRoles = ['TEACHER', 'HR', 'ADMIN', 'FINANCIST'];
    if (!allowedRoles.includes(user.role)) {
      throw new BadRequestException('Данная роль не может создавать заявки на отпуск');
    }

    // Определяем ID преподавателя для заявки
    let teacherId: number;

    if (createVacationDto.teacherId && (user.role === 'HR' || user.role === 'ADMIN')) {
      // Администраторы и HR могут создавать заявки от имени других преподавателей
      teacherId = createVacationDto.teacherId;

      // Проверяем, что указанный преподаватель существует
      const targetTeacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId }
      });

      if (!targetTeacher) {
        throw new BadRequestException('Указанный преподаватель не найден');
      }
    } else if (user.role === 'TEACHER') {
      // Для преподавателей ищем их teacher record
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!teacher) {
        throw new NotFoundException('Запись преподавателя не найдена');
      }
      teacherId = teacher.id;
    } else {
      // Для других ролей (HR, ADMIN, FINANCIST) требуется указание teacherId
      if (!createVacationDto.teacherId) {
        throw new BadRequestException('Необходимо указать преподавателя для создания заявки');
      }
      teacherId = createVacationDto.teacherId;

      // Проверяем, что указанный преподаватель существует
      const targetTeacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId }
      });

      if (!targetTeacher) {
        throw new BadRequestException('Указанный преподаватель не найден');
      }
    }

    // Проверяем замещающего, если указан
    if (createVacationDto.substituteId) {
      const substitute = await this.prisma.teacher.findUnique({
        where: { id: createVacationDto.substituteId }
      });

      if (!substitute) {
        throw new BadRequestException('Замещающий сотрудник не найден');
      }
    }

    // Проверяем пересечения с существующими отпусками
    const overlappingVacations = await this.prisma.vacation.findMany({
      where: {
        teacherId,
        status: {
          in: ['pending', 'approved']
        },
        OR: [
          {
            startDate: {
              lte: new Date(createVacationDto.endDate)
            },
            endDate: {
              gte: new Date(createVacationDto.startDate)
            }
          }
        ]
      }
    });

    if (overlappingVacations.length > 0) {
      throw new BadRequestException('Период отпуска пересекается с существующими заявками');
    }

    // Создаем отпуск
    const vacation = await this.prisma.vacation.create({
      data: {
        type: createVacationDto.type,
        startDate: new Date(createVacationDto.startDate),
        endDate: new Date(createVacationDto.endDate),
        days: createVacationDto.days,
        teacherId,
        substituteId: createVacationDto.substituteId,
        comment: createVacationDto.comment,
        workTasks: createVacationDto.workTasks
      },
      include: {
        teacher: {
          include: { user: true }
        },
        substitute: {
          include: { user: true }
        },
        documents: {
          include: { file: true }
        },
      }
    });

    // Если указаны уроки для замещения, создаем связи
    if (createVacationDto.lessonIds && createVacationDto.lessonIds.length > 0) {
      await Promise.all(
        createVacationDto.lessonIds.map(lessonId =>
          this.prisma.vacationLesson.create({
            data: {
              vacationId: vacation.id,
              lessonId,
              notes: createVacationDto.lectureTopics // Используем lectureTopics как общие заметки
            }
          })
        )
      );
    }

    // Отправляем уведомления
    await this.sendVacationCreatedNotifications(vacation);

    // Возвращаем обновленный отпуск с уроками через findOne для корректной трансформации
    return this.findOne(vacation.id);
  }

  async findAll(filterDto: VacationFilterDto & { page?: number; limit?: number }, userId: number) {
    const { page = 1, limit = 10, search, type, status, period, startDate, endDate, substituteId } = filterDto;
    const skip = (page - 1) * limit;

    // Получаем информацию о пользователе для RBAC
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true }
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Строим условия фильтрации
    const where: any = {
      deletedAt: null // Исключаем удаленные записи
    };

    // RBAC: Если пользователь - преподаватель, показываем только его заявки
    if (user.role === 'TEACHER' && user.teacher) {
      where.teacherId = user.teacher.id;
    }

    if (search) {
      where.OR = [
        {
          teacher: {
            user: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { surname: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    if (type) {
      where.type = type as any;
    }

    if (status) {
      where.status = status as any;
    }

    if (substituteId) {
      where.substituteId = parseInt(substituteId);
    }

    // Фильтр по периоду
    if (period) {
      const currentYear = new Date().getFullYear();
      let yearToFilter = currentYear;

      switch (period) {
        case 'current-year':
          yearToFilter = currentYear;
          break;
        case 'next-year':
          yearToFilter = currentYear + 1;
          break;
        case 'previous-year':
          yearToFilter = currentYear - 1;
          break;
      }

      where.startDate = {
        gte: new Date(`${yearToFilter}-01-01`),
        lte: new Date(`${yearToFilter}-12-31`)
      };
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [vacations, total] = await Promise.all([
      this.prisma.vacation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            include: { user: true }
          },
          substitute: {
            include: { user: true }
          },
          documents: {
            include: { file: true }
          },
          lessons: {
            include: {
              lesson: {
                include: {
                  studyPlan: {
                    include: {
                      group: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      this.prisma.vacation.count({ where })
    ]);

    // Трансформируем уроки для всех отпусков
    const vacationsWithLessons = vacations.map(vacation => ({
      ...vacation,
      affectedLessons: vacation.lessons.map(vacationLesson => ({
        id: vacationLesson.lesson.id,
        name: vacationLesson.lesson.name,
        date: vacationLesson.lesson.date,
        studyPlan: {
          id: vacationLesson.lesson.studyPlan.id,
          name: vacationLesson.lesson.studyPlan.name
        },
        group: vacationLesson.lesson.studyPlan.group?.[0] ? {
          id: vacationLesson.lesson.studyPlan.group[0].id,
          name: vacationLesson.lesson.studyPlan.group[0].name
        } : null
      }))
    }));

    // Получаем статистику
    const summary = await this.getVacationsSummary();

    return {
      vacations: vacationsWithLessons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary
    };
  }

  async findOne(id: number) {
    const vacation = await this.prisma.vacation.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        teacher: {
          include: { user: true }
        },
        substitute: {
          include: { user: true }
        },
        documents: {
          include: { file: true }
        },
        lessons: {
          include: {
            lesson: {
              include: {
                studyPlan: {
                  include: {
                    group: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!vacation) {
      throw new NotFoundException('Отпуск не найден');
    }

    // Трансформируем уроки для фронтенда
    const affectedLessons = vacation.lessons.map(vacationLesson => ({
      id: vacationLesson.lesson.id,
      name: vacationLesson.lesson.name,
      date: vacationLesson.lesson.date,
      studyPlan: {
        id: vacationLesson.lesson.studyPlan.id,
        name: vacationLesson.lesson.studyPlan.name
      },
      group: vacationLesson.lesson.studyPlan.group?.[0] ? {
        id: vacationLesson.lesson.studyPlan.group[0].id,
        name: vacationLesson.lesson.studyPlan.group[0].name
      } : null
    }));

    return {
      ...vacation,
      affectedLessons
    };
  }

  async update(id: number, updateVacationDto: UpdateVacationDto, currentUserId: number) {
    const vacation = await this.findOne(id);

    // Проверяем права доступа
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { teacher: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Только создатель заявки или HR может редактировать
    if (currentUser.teacher?.id !== vacation.teacherId && currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Недостаточно прав для редактирования');
    }

    // Нельзя редактировать утвержденные или завершенные отпуска
    if (vacation.status === 'approved' || vacation.status === 'completed') {
      throw new BadRequestException('Нельзя редактировать утвержденные или завершенные отпуска');
    }

    return this.prisma.vacation.update({
      where: { id },
      data: {
        ...updateVacationDto,
        startDate: updateVacationDto.startDate ? new Date(updateVacationDto.startDate) : undefined,
        endDate: updateVacationDto.endDate ? new Date(updateVacationDto.endDate) : undefined
      },
      include: {
        teacher: {
          include: { user: true }
        },
        substitute: {
          include: { user: true }
        },
        documents: {
          include: { file: true }
        }
      }
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateVacationStatusDto, currentUserId: number) {
    const vacation = await this.findOne(id);

    // Проверяем права доступа - только HR и администраторы могут изменять статус
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser || (currentUser.role !== 'HR' && currentUser.role !== 'ADMIN')) {
      throw new ForbiddenException('Недостаточно прав для изменения статуса');
    }

    const updatedVacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        status: updateStatusDto.status as any,
        comment: updateStatusDto.comment || vacation.comment
      },
      include: {
        teacher: {
          include: { user: true }
        },
        substitute: {
          include: { user: true }
        }
      }
    });

    // Отправляем уведомление, если требуется
    if (updateStatusDto.notifyEmployee) {
      await this.createNotification(updatedVacation, updateStatusDto.status);
    }

    return updatedVacation;
  }

  async remove(id: number, currentUserId: number): Promise<void> {
    const vacation = await this.findOne(id);

    // Проверяем права доступа
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { teacher: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Только создатель заявки или HR/ADMIN может удалять
    if (currentUser.teacher?.id !== vacation.teacherId && currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Недостаточно прав для удаления');
    }

    // Нельзя удалять завершенные отпуска. Одобренные можно удалять только HR или ADMIN
    if (vacation.status === 'completed') {
      throw new BadRequestException('Нельзя удалять завершенные отпуска');
    }
    if (vacation.status === 'approved' && currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
      throw new BadRequestException('Удалять одобренные отпуска могут только HR или ADMIN');
    }

    // Сначала удаляем связанные уроки
    await this.prisma.vacationLesson.deleteMany({
      where: { vacationId: id }
    });

    // Затем делаем soft delete отпуска
    await this.prisma.vacation.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async getVacationsSummary() {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear}-12-31`);
    const now = new Date();

    const [byType, byStatus, currentMonth, totalEmployees, currentlyOnVacation] = await Promise.all([
      this.prisma.vacation.groupBy({
        by: ['type'],
        where: {
          startDate: {
            gte: startOfYear,
            lte: endOfYear
          },
          deletedAt: null
        },
        _count: { type: true }
      }),
      this.prisma.vacation.groupBy({
        by: ['status'],
        where: {
          startDate: {
            gte: startOfYear,
            lte: endOfYear
          },
          deletedAt: null
        },
        _count: { status: true }
      }),
      this.getCurrentMonthSummary(),
      this.prisma.teacher.count({
        where: { deletedAt: null }
      }),
      this.prisma.vacation.count({
        where: {
          status: 'approved',
          startDate: { lte: now },
          endDate: { gte: now },
          deletedAt: null
        }
      })
    ]);

    // Подсчитываем общие дни отпуска
    const totalVacationDays = await this.prisma.vacation.aggregate({
      where: {
        type: 'vacation',
        status: { in: ['approved', 'completed'] },
        startDate: {
          gte: startOfYear,
          lte: endOfYear
        },
        deletedAt: null
      },
      _sum: { days: true }
    });

    return {
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      currentMonth,
      overview: {
        totalEmployees,
        currentlyOnVacation,
        totalVacationDays: totalVacationDays._sum.days || 0,
        averageDaysPerEmployee: totalEmployees > 0 ? Math.round((totalVacationDays._sum.days || 0) / totalEmployees) : 0
      }
    };
  }

  private async getCurrentMonthSummary() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Начало дня
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); // Конец дня
    const futureDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 дней вперед

    console.log('Checking vacations for date:', today.toISOString());

    const [onVacation, onSickLeave, planned] = await Promise.all([
      this.prisma.vacation.count({
        where: {
          type: 'vacation',
          status: 'approved',
          startDate: { lte: endOfToday },
          endDate: { gte: today },
          deletedAt: null
        }
      }),
      this.prisma.vacation.count({
        where: {
          type: 'sick_leave',
          status: 'approved',
          startDate: { lte: endOfToday },
          endDate: { gte: today },
          deletedAt: null
        }
      }),
      this.prisma.vacation.count({
        where: {
          status: { in: ['approved', 'pending'] },
          startDate: {
            gte: today,
            lte: futureDate
          },
          deletedAt: null
        }
      })
    ]);

    // Для отладки - найдем все одобренные отпуска
    const debugVacations = await this.prisma.vacation.findMany({
      where: {
        status: 'approved',
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        teacher: {
          select: {
            user: {
              select: {
                name: true,
                surname: true
              }
            }
          }
        }
      }
    });

    console.log('All approved vacations:', debugVacations.map(v => ({
      id: v.id,
      name: `${v.teacher.user.name} ${v.teacher.user.surname}`,
      type: v.type,
      start: v.startDate,
      end: v.endDate,
      isActive: v.startDate <= endOfToday && v.endDate >= today
    })));

    return {
      onVacation,
      onSickLeave,
      planned
    };
  }

  private async createNotification(vacation: any, status: string) {
    const statusMessages = {
      approved: 'Ваша заявка на отпуск была одобрена',
      rejected: 'Ваша заявка на отпуск была отклонена',
      completed: 'Ваш отпуск завершен'
    };

    await this.notificationsService.create({
      userId: vacation.teacher.userId,
      type: 'vacation_status_update',
      message: statusMessages[status] || 'Статус вашей заявки на отпуск изменен',
      url: `/vacations/${vacation.id}`
    });
  }

  async getTeacherVacationSummary(teacherId: number) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear}-12-31`);

    const [usedDays, sickLeaveDays] = await Promise.all([
      this.prisma.vacation.aggregate({
        where: {
          teacherId,
          type: 'vacation',
          status: { in: ['approved', 'completed'] },
          startDate: {
            gte: startOfYear,
            lte: endOfYear
          },
          deletedAt: null
        },
        _sum: { days: true }
      }),
      this.prisma.vacation.aggregate({
        where: {
          teacherId,
          type: 'sick_leave',
          status: { in: ['approved', 'completed'] },
          startDate: {
            gte: startOfYear,
            lte: endOfYear
          },
          deletedAt: null
        },
        _sum: { days: true }
      })
    ]);

    const totalDays = 28; // Стандартный отпуск в Казахстане
    const usedVacationDays = usedDays._sum.days || 0;
    const usedSickDays = sickLeaveDays._sum.days || 0;

    return {
      totalDays,
      usedDays: usedVacationDays,
      remainingDays: totalDays - usedVacationDays,
      sickLeaveDays: usedSickDays
    };
  }

  async getSubstitutions(date?: string, department?: string, substituteId?: string) {
    const targetDate = date ? new Date(date) : new Date();

    const where: any = {
      status: 'approved',
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
      substituteId: { not: null },
      deletedAt: null
    };

    if (substituteId) {
      where.substituteId = parseInt(substituteId);
    }

    const substitutions = await this.prisma.vacation.findMany({
      where,
      include: {
        teacher: {
          include: { user: true }
        },
        substitute: {
          include: { user: true }
        }
      }
    });

    return {
      substitutions: substitutions.map(vacation => ({
        vacationId: vacation.id,
        originalEmployee: {
          id: vacation.teacher.id,
          name: `${vacation.teacher.user.name} ${vacation.teacher.user.surname}`,
          subjects: [] // TODO: получить предметы из учебных планов
        },
        substituteEmployee: {
          id: vacation.substitute?.id,
          name: vacation.substitute ? `${vacation.substitute.user.name} ${vacation.substitute.user.surname}` : null,
          subjects: [] // TODO: получить предметы из учебных планов
        },
        period: {
          start: vacation.startDate.toISOString(),
          end: vacation.endDate.toISOString()
        },
        topics: [], // TODO: добавить поле lectureTopics в схему Prisma или получить из комментария
        status: vacation.status
      }))
    };
  }

  async getTeacherLessons(teacherId: number) {
    // Получаем преподавателя
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    // Получаем учебные планы преподавателя с уроками
    const studyPlans = await this.prisma.studyPlan.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        lessons: true,
        group: true
      }
    });

    const lessons = [];
    for (const plan of studyPlans) {
      for (const lesson of plan.lessons) {
        lessons.push({
          id: lesson.id,
          name: lesson.name,
          description: lesson.description,
          date: lesson.date,
          studyPlan: {
            id: plan.id,
            name: plan.name,
            description: plan.description
          },
          groups: plan.group.map(group => ({
            id: group.id,
            name: group.name
          }))
        });
      }
    }

    return {
      teacher: {
        id: teacher.id,
        name: `${teacher.user.name} ${teacher.user.surname}`
      },
      lessons
    };
  }

  // Получение расписания преподавателя на период отпуска
  async getTeacherScheduleForVacation(teacherId: number, startDate: Date, endDate: Date) {
    // Получаем все расписания преподавателя (по аналогии с teacher-worked-hours.service.ts)
    const allSchedules = await this.prisma.schedule.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      include: {
        studyPlan: {
          include: {
            group: true
          }
        },
        lesson: true,
        classroom: true
      }
    });

    // Разворачиваем периодические занятия в конкретные даты для указанного периода
    const expandedSchedules = this.expandSchedulesForPeriod(allSchedules, startDate, endDate);

    // Трансформируем в нужный формат
    const affectedItems = expandedSchedules.map(schedule => ({
      id: schedule.date ? schedule.id : `schedule-${schedule.id}-${schedule.actualDate.toISOString().split('T')[0]}`,
      type: schedule.date ? 'lesson' : 'schedule',
      name: schedule.studyPlan?.name || schedule.lesson?.name || 'Занятие',
      date: schedule.actualDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      studyPlan: schedule.studyPlan ? {
        id: schedule.studyPlan.id,
        name: schedule.studyPlan.name
      } : null,
      groups: schedule.studyPlan?.group?.map((group: any) => ({
        id: group.id,
        name: group.name
      })) || [],
      classroom: schedule.classroom ? {
        id: schedule.classroom.id,
        name: schedule.classroom.name
      } : null
    }));

    // Сортируем по дате и времени
    affectedItems.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.startTime?.localeCompare(b.startTime || '') || 0;
    });

    return affectedItems;
  }

  /**
   * Разворачивает расписания (периодические и разовые) в конкретные даты для указанного периода
   * Адаптировано из teacher-worked-hours.service.ts
   */
  private expandSchedulesForPeriod(schedules: any[], startDate: Date, endDate: Date): any[] {
    const expandedSchedules = [];

    for (const schedule of schedules) {
      // Если у занятия есть конкретная дата проведения
      if (schedule.date) {
        const scheduleDate = new Date(schedule.date);

        // Проверяем, попадает ли дата в наш период
        if (scheduleDate >= startDate && scheduleDate <= endDate) {
          expandedSchedules.push({
            ...schedule,
            actualDate: scheduleDate,
          });
        }
      }
      // Если это периодическое занятие (есть день недели и периодичность)
      else if (schedule.dayOfWeek && schedule.repeat) {
        const instances = this.generatePeriodicInstances(
          schedule,
          startDate,
          endDate,
          schedule.excludedDates || []
        );

        for (const instance of instances) {
          expandedSchedules.push({
            ...schedule,
            actualDate: instance.date,
          });
        }
      }
    }

    return expandedSchedules;
  }

  /**
   * Генерирует экземпляры периодического занятия
   * Адаптировано из teacher-worked-hours.service.ts
   */
  private generatePeriodicInstances(
    schedule: any,
    startDate: Date,
    endDate: Date,
    excludedDates: Date[] = []
  ): Array<{ date: Date }> {
    const instances = [];
    const current = new Date(startDate);

    // Преобразуем день недели (1=понедельник в нашем формате, 0=воскресенье в JS)
    const targetDay = schedule.dayOfWeek === 7 ? 0 : schedule.dayOfWeek; // 7 (воскресенье) -> 0

    // Найти первое вхождение нужного дня недели в периоде
    while (current.getDay() !== targetDay && current <= endDate) {
      current.setDate(current.getDate() + 1);
    }

    // Определяем интервал в зависимости от периодичности
    let intervalDays = 7; // по умолчанию еженедельно

    switch (schedule.repeat) {
      case 'weekly':
        intervalDays = 7;
        break;
      case 'biweekly':
        intervalDays = 14; // раз в две недели
        break;
      case 'once':
        // Для разовых занятий добавляем только первое вхождение
        if (current <= endDate) {
          const dateToCheck = new Date(current);
          const isExcluded = excludedDates.some(excludedDate =>
            new Date(excludedDate).toDateString() === dateToCheck.toDateString()
          );

          if (!isExcluded) {
            instances.push({
              date: new Date(dateToCheck),
            });
          }
        }
        return instances;
      default:
        intervalDays = 7; // по умолчанию еженедельно
    }

    // Генерируем даты с учетом интервала
    while (current <= endDate) {
      const dateToCheck = new Date(current);

      // Проверяем, не исключена ли эта дата
      const isExcluded = excludedDates.some(excludedDate =>
        new Date(excludedDate).toDateString() === dateToCheck.toDateString()
      );

      if (!isExcluded) {
        instances.push({
          date: new Date(dateToCheck),
        });
      }

      current.setDate(current.getDate() + intervalDays);
    }

    return instances;
  }

  // Отправка уведомлений при создании заявки на отпуск
  private async sendVacationCreatedNotifications(vacation: any) {
    try {
      const teacherName = `${vacation.teacher.user.name} ${vacation.teacher.user.surname}`;

      // Получаем пользователей с ролями HR и ADMIN
      const [hrUsers, adminUsers] = await Promise.all([
        this.prisma.user.findMany({
          where: { role: 'HR', deletedAt: null },
          select: { id: true }
        }),
        this.prisma.user.findMany({
          where: { role: 'ADMIN', deletedAt: null },
          select: { id: true }
        })
      ]);

      const hrUserIds = hrUsers.map(user => user.id);
      const adminUserIds = adminUsers.map(user => user.id);

      // Отправляем уведомления HR и админам
      await this.notificationsService.notifyVacationCreated(
        teacherName,
        hrUserIds,
        adminUserIds,
        vacation.id,
        vacation.startDate,
        vacation.endDate
      );

      // Если указан замещающий, отправляем ему уведомление
      if (vacation.substitute && vacation.substitute.user) {
        await this.notificationsService.notifySubstituteAssigned(
          vacation.substitute.user.id,
          teacherName,
          vacation.id,
          vacation.startDate,
          vacation.endDate
        );
      }
    } catch (error) {
      console.error('Ошибка при отправке уведомлений о создании отпуска:', error);
      // Не прерываем выполнение, если уведомления не отправились
    }
  }
}
