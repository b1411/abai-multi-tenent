import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CalculateWorkedHoursParams {
  teacherId: number;
  month: number;
  year: number;
}

@Injectable()
export class TeacherWorkedHoursService {
  constructor(private prisma: PrismaService) {}

  async calculateAndSaveWorkedHours(params: CalculateWorkedHoursParams) {
    const { teacherId, month, year } = params;

    // Проверяем существование преподавателя
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    // Получаем даты начала и конца месяца
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Получаем все расписания за указанный период
    const schedules = await this.prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: teacherId }, // основные занятия преподавателя
          { substituteId: teacherId }, // замещения
        ],
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        teacher: true,
        substitute: true,
        lesson: true,
      },
    });

    // Рассчитываем часы
    let scheduledHours = 0;
    let workedHours = 0;
    let substitutedHours = 0;
    let substitutedByOthers = 0;

    for (const schedule of schedules) {
      const duration = this.calculateDuration(schedule.startTime, schedule.endTime);

      if (schedule.teacherId === teacherId) {
        // Основные занятия преподавателя
        
        // Всегда учитываем в запланированных часах (кроме отмененных)
        if (schedule.status !== 'CANCELLED') {
          scheduledHours += duration;
        }

        // Засчитываем в отработанные только завершенные занятия
        if (schedule.status === 'COMPLETED') {
          if (schedule.substituteId) {
            // Занятие было замещено другим преподавателем
            substitutedByOthers += duration;
          } else {
            // Преподаватель провел занятие сам
            workedHours += duration;
          }
        }
      } else if (schedule.substituteId === teacherId) {
        // Преподаватель замещал другого
        if (schedule.status === 'COMPLETED') {
          substitutedHours += duration;
          workedHours += duration;
        }
      }
    }

    // Сохраняем или обновляем запись
    return await this.prisma.teacherWorkedHours.upsert({
      where: {
        teacherId_month_year: {
          teacherId,
          month,
          year,
        },
      },
      update: {
        scheduledHours,
        workedHours,
        substitutedHours,
        substitutedByOthers,
      },
      create: {
        teacherId,
        month,
        year,
        scheduledHours,
        workedHours,
        substitutedHours,
        substitutedByOthers,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  private expandRegularSchedules(schedules: any[], startDate: Date, endDate: Date): any[] {
    const expandedSchedules = [];

    for (const schedule of schedules) {
      if (schedule.date) {
        // Уже конкретная дата
        expandedSchedules.push({
          ...schedule,
          actualDate: schedule.date,
        });
      } else if (schedule.repeat && schedule.dayOfWeek) {
        // Регулярное занятие - разворачиваем в конкретные даты
        const dates = this.generateDatesForRegularSchedule(
          schedule.dayOfWeek,
          startDate,
          endDate,
          schedule.excludedDates || []
        );

        for (const date of dates) {
          expandedSchedules.push({
            ...schedule,
            actualDate: date,
          });
        }
      }
    }

    return expandedSchedules;
  }

  private generateDatesForRegularSchedule(
    dayOfWeek: number,
    startDate: Date,
    endDate: Date,
    excludedDates: Date[]
  ): Date[] {
    const dates = [];
    const current = new Date(startDate);

    // Найти первое вхождение дня недели
    while (current.getDay() !== (dayOfWeek % 7)) {
      current.setDate(current.getDate() + 1);
    }

    // Генерировать даты до конца периода
    while (current <= endDate) {
      const dateToCheck = new Date(current);
      
      // Проверяем, не исключена ли эта дата
      const isExcluded = excludedDates.some(excludedDate => 
        new Date(excludedDate).toDateString() === dateToCheck.toDateString()
      );

      if (!isExcluded) {
        dates.push(new Date(dateToCheck));
      }

      current.setDate(current.getDate() + 7); // следующая неделя
    }

    return dates;
  }

  private calculateHoursFromSchedules(schedules: any[], teacherId: number) {
    const totals = {
      scheduledHours: 0,
      workedHours: 0,
      substitutedHours: 0,
      substitutedByOthers: 0,
    };

    // Группируем по дате для обработки переносов и отмен
    const schedulesByDate = new Map<string, any[]>();
    
    for (const schedule of schedules) {
      const dateKey = schedule.actualDate.toDateString();
      if (!schedulesByDate.has(dateKey)) {
        schedulesByDate.set(dateKey, []);
      }
      schedulesByDate.get(dateKey)?.push(schedule);
    }

    // Обрабатываем каждую дату
    for (const daySchedules of schedulesByDate.values()) {
      for (const schedule of daySchedules) {
        const duration = this.calculateDuration(schedule.startTime, schedule.endTime);

        if (schedule.teacherId === teacherId) {
          // Основное занятие преподавателя
          this.processMainTeacherSchedule(schedule, duration, totals);
        } else if (schedule.substituteId === teacherId) {
          // Преподаватель замещает другого
          this.processSubstituteSchedule(schedule, duration, totals);
        }
      }
    }

    return totals;
  }

  private processMainTeacherSchedule(
    schedule: any,
    duration: number,
    totals: { scheduledHours: number; workedHours: number; substitutedByOthers: number }
  ) {
    // Всегда учитываем в запланированных часах (кроме отмененных)
    if (schedule.status !== 'CANCELLED') {
      totals.scheduledHours += duration;
    }

    switch (schedule.status) {
      case 'COMPLETED':
        if (schedule.substituteId) {
          // Занятие было замещено
          totals.substitutedByOthers += duration;
        } else {
          // Преподаватель провел занятие сам
          totals.workedHours += duration;
        }
        break;

      case 'SCHEDULED':
        // Занятие запланировано, но еще не проведено
        // Не засчитываем в отработанные часы
        break;

      case 'RESCHEDULED':
      case 'MOVED':
        // Занятие перенесено - ищем новую дату
        if (schedule.rescheduledTo) {
          // Это будет обработано при обработке нового расписания
        }
        break;

      case 'POSTPONED':
        // Занятие отложено - пока не засчитываем
        break;

      case 'CANCELLED':
        // Занятие отменено - не засчитываем вообще
        break;

      default:
        // Неизвестный статус - считаем как незавершенное
        break;
    }
  }

  private processSubstituteSchedule(
    schedule: any,
    duration: number,
    totals: { substitutedHours: number; workedHours: number }
  ) {
    switch (schedule.status) {
      case 'COMPLETED':
        // Преподаватель успешно замещал
        totals.substitutedHours += duration;
        totals.workedHours += duration;
        break;

      case 'SCHEDULED':
        // Замещение запланировано, но еще не проведено
        break;

      case 'CANCELLED':
        // Замещение отменено
        break;

      default:
        // Другие статусы пока не засчитываем
        break;
    }
  }

  async getWorkedHours(teacherId: number, month: number, year: number) {
    return await this.prisma.teacherWorkedHours.findUnique({
      where: {
        teacherId_month_year: {
          teacherId,
          month,
          year,
        },
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getWorkedHoursByYear(teacherId: number, year: number) {
    return await this.prisma.teacherWorkedHours.findMany({
      where: {
        teacherId,
        year,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        month: 'asc',
      },
    });
  }

  async getAllTeachersWorkedHours(month: number, year: number) {
    return await this.prisma.teacherWorkedHours.findMany({
      where: {
        month,
        year,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { teacher: { user: { surname: 'asc' } } },
        { teacher: { user: { name: 'asc' } } },
      ],
    });
  }

  async recalculateAllForMonth(month: number, year: number) {
    // Получаем всех преподавателей
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
    });

    const results = [];
    for (const teacher of teachers) {
      try {
        const result = await this.calculateAndSaveWorkedHours({
          teacherId: teacher.id,
          month,
          year,
        });
        results.push(result);
      } catch (error) {
        console.error(`Ошибка при расчете часов для преподавателя ${teacher.id}:`, error);
      }
    }

    return {
      processed: results.length,
      total: teachers.length,
      results,
    };
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // часы
  }

  async getTeacherWorkedHoursStats(teacherId: number, year: number) {
    const workedHours = await this.getWorkedHoursByYear(teacherId, year);
    
    const totalScheduled = workedHours.reduce((sum, h) => sum + h.scheduledHours, 0);
    const totalWorked = workedHours.reduce((sum, h) => sum + h.workedHours, 0);
    const totalSubstituted = workedHours.reduce((sum, h) => sum + h.substitutedHours, 0);
    const totalSubstitutedByOthers = workedHours.reduce((sum, h) => sum + h.substitutedByOthers, 0);

    return {
      year,
      totalScheduled,
      totalWorked,
      totalSubstituted,
      totalSubstitutedByOthers,
      efficiency: totalScheduled > 0 ? (totalWorked / totalScheduled) * 100 : 0,
      monthlyData: workedHours,
    };
  }

  async getTeacherWorkedHoursDetails(teacherId: number, month: number, year: number) {
    // Получаем базовую информацию об отработанных часах
    const workedHours = await this.getWorkedHours(teacherId, month, year);
    
    // Получаем детальное расписание за период
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: teacherId }, // основные занятия
          { substituteId: teacherId }, // замещения
        ],
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        substitute: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        lesson: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Группируем занятия по типам
    const scheduleDetails = {
      regular: [], // обычные занятия
      substitutions: [], // замещения
      cancelled: [], // отмененные
      rescheduled: [], // перенесенные
    };

    for (const schedule of schedules) {
      const item = {
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: this.calculateDuration(schedule.startTime, schedule.endTime),
        status: schedule.status,
        type: schedule.type,
        lesson: schedule.lesson,
        group: schedule.group,
        classroom: schedule.classroom,
        teacher: schedule.teacher,
        substitute: schedule.substitute,
        cancelReason: schedule.cancelReason,
        moveReason: schedule.moveReason,
        substituteReason: schedule.substituteReason,
        notes: schedule.notes,
      };

      if (schedule.status === 'CANCELLED') {
        scheduleDetails.cancelled.push(item);
      } else if (schedule.status === 'RESCHEDULED' || schedule.status === 'MOVED') {
        scheduleDetails.rescheduled.push(item);
      } else if (schedule.substituteId === teacherId) {
        scheduleDetails.substitutions.push(item);
      } else {
        scheduleDetails.regular.push(item);
      }
    }

    return {
      summary: workedHours,
      details: scheduleDetails,
      statistics: {
        totalSchedules: schedules.length,
        completedSchedules: schedules.filter(s => s.status === 'COMPLETED').length,
        cancelledSchedules: schedules.filter(s => s.status === 'CANCELLED').length,
        rescheduledSchedules: schedules.filter(s => 
          s.status === 'RESCHEDULED' || s.status === 'MOVED'
        ).length,
        substitutionSchedules: schedules.filter(s => s.substituteId === teacherId).length,
      },
    };
  }
}
