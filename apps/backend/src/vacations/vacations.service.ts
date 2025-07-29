import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto } from './dto/update-vacation.dto';
import { VacationFilterDto } from './dto/vacation-filter.dto';
import { UpdateVacationStatusDto } from './dto/update-vacation-status.dto';

@Injectable()
export class VacationsService {
  constructor(private prisma: PrismaService) {}

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

    // Для преподавателей ищем teacher record, для остальных временно используем teacherId = userId
    let teacherId = userId;
    if (user.role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!teacher) {
        throw new NotFoundException('Запись преподавателя не найдена');
      }
      teacherId = teacher.id;
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

    // Только создатель заявки или HR может удалять
    if (currentUser.teacher?.id !== vacation.teacherId && currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Недостаточно прав для удаления');
    }

    // Нельзя удалять утвержденные отпуска
    if (vacation.status === 'approved' || vacation.status === 'completed') {
      throw new BadRequestException('Нельзя удалять утвержденные или завершенные отпуска');
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

  async getVacationsSummary(userId?: number) {
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

    await this.prisma.notification.create({
      data: {
        userId: vacation.teacher.userId,
        type: 'vacation_status_update',
        message: statusMessages[status] || 'Статус вашей заявки на отпуск изменен',
        url: `/vacations/${vacation.id}`
      }
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
}
