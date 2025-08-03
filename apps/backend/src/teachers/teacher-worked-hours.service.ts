import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { SystemService } from '../system/system.service';

interface CalculateWorkedHoursParams {
  teacherId: number;
  month: number;
  year: number;
}

@Injectable()
export class TeacherWorkedHoursService {
  // Константа для продолжительности академического часа (по умолчанию 45 минут)
  private readonly ACADEMIC_HOUR_MINUTES = 45;

  constructor(
    private prisma: PrismaService,
    private scheduleService: ScheduleService,
    private systemService: SystemService
  ) { }

  async calculateAndSaveWorkedHours(params: CalculateWorkedHoursParams) {
    const { teacherId, month, year } = params;

    // Сначала обновляем статусы прошедших занятий
    console.log(`[TeacherWorkedHours] Обновляем статусы прошедших занятий...`);
    const statusUpdate = await this.scheduleService.updatePastScheduleStatuses();
    console.log(`[TeacherWorkedHours] Обновлено статусов: ${statusUpdate.updated}`);

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

    console.log(`[TeacherWorkedHours] Расчет для преподавателя ${teacherId}, период: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

    // Получаем все расписания преподавателя (включая периодические и разовые)
    const allSchedules = await this.prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: teacherId },
          { substituteId: teacherId },
        ],
        deletedAt: null,
      },
      include: {
        teacher: true,
        substitute: true,
        lesson: true,
      },
    });

    console.log(`[TeacherWorkedHours] Всего расписаний у преподавателя ${teacherId}: ${allSchedules.length}`);

    // Разворачиваем периодические занятия в конкретные даты для указанного месяца
    const expandedSchedules = this.expandSchedulesForPeriod(allSchedules, startDate, endDate);

    console.log(`[TeacherWorkedHours] После развертывания периодических занятий: ${expandedSchedules.length} занятий`);

    // Получаем утвержденные заявки на отпуск за период
    const approvedVacations = await this.prisma.vacation.findMany({
      where: {
        OR: [
          { teacherId }, // заявки преподавателя
          { substituteId: teacherId }, // где он замещает
        ],
        status: 'approved',
        // Проверяем пересечение с нашим периодом
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
        ],
      },
      include: {
        teacher: { include: { user: true } },
        substitute: { include: { user: true } },
      },
    });

    console.log(`[TeacherWorkedHours] Найдено ${approvedVacations.length} утвержденных заявок на отпуск за период`);
    
    // Логируем все найденные заявки на отпуск
    approvedVacations.forEach((vacation, index) => {
      console.log(`[TeacherWorkedHours] Заявка ${index + 1}:`);
      console.log(`  - ID: ${vacation.id}`);
      console.log(`  - Тип: ${vacation.type}`);
      console.log(`  - Период: ${new Date(vacation.startDate).toLocaleDateString()} - ${new Date(vacation.endDate).toLocaleDateString()}`);
      console.log(`  - Преподаватель в отпуске: ${vacation.teacher.user.name} ${vacation.teacher.user.surname} (ID: ${vacation.teacherId})`);
      console.log(`  - Замещающий: ${vacation.substitute ? `${vacation.substitute.user.name} ${vacation.substitute.user.surname} (ID: ${vacation.substituteId})` : 'НЕТ'}`);
      console.log(`  - Статус: ${vacation.status}`);
    });

    // Рассчитываем часы
    let scheduledHours = 0;
    let workedHours = 0;
    let substitutedHours = 0;
    let substitutedByOthers = 0;

    console.log(`[TeacherWorkedHours] ========== НАЧИНАЕМ ПОДСЧЕТ ЧАСОВ ДЛЯ ПРЕПОДАВАТЕЛЯ ID: ${teacherId} ==========`);

    for (const schedule of expandedSchedules) {
      const duration = await this.calculateDuration(schedule.startTime, schedule.endTime);
      const scheduleDate = schedule.actualDate;

      console.log(`\n[TeacherWorkedHours] ========== ЗАНЯТИЕ #${expandedSchedules.indexOf(schedule) + 1} ==========`);
      console.log(`[TeacherWorkedHours] Дата: ${scheduleDate.toLocaleDateString()}, ${schedule.startTime}-${schedule.endTime}`);
      console.log(`[TeacherWorkedHours] Статус: ${schedule.status}, Продолжительность: ${duration}ч`);
      console.log(`[TeacherWorkedHours] teacherId в расписании: ${schedule.teacherId}, наш teacherId: ${teacherId}`);
      console.log(`[TeacherWorkedHours] substituteId в расписании: ${schedule.substituteId}`);

      // Проверяем, есть ли отпуск в эту дату
      const teacherVacation = approvedVacations.find(v => 
        v.teacherId === teacherId &&
        scheduleDate >= new Date(v.startDate) && 
        scheduleDate <= new Date(v.endDate)
      );

      const substitutionVacation = approvedVacations.find(v => 
        v.substituteId === teacherId &&
        scheduleDate >= new Date(v.startDate) && 
        scheduleDate <= new Date(v.endDate)
      );

      console.log(`[TeacherWorkedHours] teacherVacation найден: ${!!teacherVacation} (отпуск преподавателя ${teacherId})`);
      console.log(`[TeacherWorkedHours] substitutionVacation найден: ${!!substitutionVacation} (замещение преподавателем ${teacherId})`);

      if (schedule.teacherId === teacherId) {
        console.log(`[TeacherWorkedHours] >>> ЭТО ОСНОВНОЕ ЗАНЯТИЕ ПРЕПОДАВАТЕЛЯ ${teacherId}`);
        
        // Всегда учитываем в запланированных часах (кроме отмененных)
        if (schedule.status !== 'CANCELLED') {
          scheduledHours += duration;
          console.log(`[TeacherWorkedHours] + Добавляем ${duration}ч к запланированным. Итого запланированных: ${scheduledHours}ч`);
        } else {
          console.log(`[TeacherWorkedHours] - Занятие отменено, не добавляем к запланированным`);
        }

        // Если преподаватель в отпуске в этот день
        if (teacherVacation) {
          console.log(`[TeacherWorkedHours] !!! ПРЕПОДАВАТЕЛЬ В ОТПУСКЕ (${teacherVacation.type}) с ${new Date(teacherVacation.startDate).toLocaleDateString()} по ${new Date(teacherVacation.endDate).toLocaleDateString()}`);
          
          // Отнимаем запланированные часы, так как преподаватель в отпуске
          scheduledHours -= duration;
          console.log(`[TeacherWorkedHours] - Отнимаем ${duration}ч от запланированных (отпуск). Итого запланированных: ${scheduledHours}ч`);
          
          // Если есть замещающий преподаватель и занятие проведено
          if (teacherVacation.substituteId && schedule.status === 'COMPLETED') {
            // Часы замещены другим, но для этого преподавателя они не засчитываются
            substitutedByOthers += duration;
            console.log(`[TeacherWorkedHours] + Занятие замещено преподавателем ID: ${teacherVacation.substituteId}. Добавляем ${duration}ч к замещенным другими. Итого: ${substitutedByOthers}ч`);
          } else {
            console.log(`[TeacherWorkedHours] - Занятие пропущено из-за отпуска (нет замещения или не завершено)`);
          }
        } else {
          console.log(`[TeacherWorkedHours] >>> Преподаватель НЕ в отпуске в эту дату`);
          
          // Преподаватель не в отпуске, засчитываем в отработанные только завершенные занятия
          if (schedule.status === 'COMPLETED') {
            if (schedule.substituteId) {
              // Занятие было замещено другим преподавателем
              substitutedByOthers += duration;
              console.log(`[TeacherWorkedHours] + Занятие замещено преподавателем ID: ${schedule.substituteId}. Добавляем ${duration}ч к замещенным другими. Итого: ${substitutedByOthers}ч`);
            } else {
              // Преподаватель провел занятие сам
              workedHours += duration;
              console.log(`[TeacherWorkedHours] + Занятие проведено самим преподавателем. Добавляем ${duration}ч к отработанным. Итого: ${workedHours}ч`);
            }
          } else {
            console.log(`[TeacherWorkedHours] - Занятие НЕ завершено (статус: ${schedule.status}), не добавляем к отработанным`);
          }
        }
      } else if (schedule.substituteId === teacherId) {
        console.log(`[TeacherWorkedHours] >>> ЭТО ЗАМЕЩЕНИЕ ПРЕПОДАВАТЕЛЕМ ${teacherId} (основной преподаватель: ${schedule.teacherId})`);
        
        // Преподаватель замещал другого
        if (substitutionVacation) {
          console.log(`[TeacherWorkedHours] !!! НАЙДЕНА ЗАЯВКА НА ОТПУСК: преподаватель ${teacherId} замещает ${substitutionVacation.teacher.user.name} ${substitutionVacation.teacher.user.surname} (отпуск: ${substitutionVacation.type})`);
          
          if (schedule.status === 'COMPLETED') {
            substitutedHours += duration;
            workedHours += duration;
            console.log(`[TeacherWorkedHours] + Замещение засчитано: ${duration}ч. Итого замещений: ${substitutedHours}ч, итого отработанных: ${workedHours}ч`);
          } else {
            console.log(`[TeacherWorkedHours] - Замещение НЕ завершено (статус: ${schedule.status}), не засчитываем`);
          }
        } else {
          console.log(`[TeacherWorkedHours] - Замещение НЕ связано с найденными заявками на отпуск`);
          // Возможно, это замещение по другим причинам (болезнь и т.д.)
          // Пока не засчитываем, но можно добавить логику для других типов замещений
        }
      } else {
        console.log(`[TeacherWorkedHours] >>> Это занятие НЕ относится к преподавателю ${teacherId} (teacherId: ${schedule.teacherId}, substituteId: ${schedule.substituteId})`);
      }

      console.log(`[TeacherWorkedHours] Промежуточные итоги: запланировано=${scheduledHours}ч, отработано=${workedHours}ч, замещений=${substitutedHours}ч, замещено другими=${substitutedByOthers}ч`);
    }

    console.log(`[TeacherWorkedHours] Итоговые часы - Запланировано: ${scheduledHours}, Отработано: ${workedHours}, Замещений: ${substitutedHours}, Замещено другими: ${substitutedByOthers}`);

    // Проверяем, есть ли хоть какие-то занятия в этом месяце
    const hasAnyActivity = scheduledHours > 0 || workedHours > 0 || substitutedHours > 0 || substitutedByOthers > 0;

    if (!hasAnyActivity) {
      console.log(`[TeacherWorkedHours] В месяце ${month}/${year} у преподавателя ${teacherId} нет занятий. Удаляем запись если она существует.`);
      
      // Удаляем запись, если она существует (чтобы не засорять базу пустыми записями)
      await this.prisma.teacherWorkedHours.deleteMany({
        where: {
          teacherId,
          month,
          year,
        },
      });

      // Возвращаем null или объект с нулевыми значениями
      return {
        id: null,
        teacherId,
        month,
        year,
        scheduledHours: 0,
        workedHours: 0,
        substitutedHours: 0,
        substitutedByOthers: 0,
        teacher: await this.prisma.teacher.findUnique({
          where: { id: teacherId },
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
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Проверяем типы данных перед сохранением
    console.log(`[TeacherWorkedHours] Типы данных:`);
    console.log(`  scheduledHours: ${typeof scheduledHours} = ${scheduledHours}`);
    console.log(`  workedHours: ${typeof workedHours} = ${workedHours}`);
    console.log(`  substitutedHours: ${typeof substitutedHours} = ${substitutedHours}`);
    console.log(`  substitutedByOthers: ${typeof substitutedByOthers} = ${substitutedByOthers}`);

    // Убеждаемся, что значения являются числами
    const dataToSave = {
      scheduledHours: Number(scheduledHours),
      workedHours: Number(workedHours),
      substitutedHours: Number(substitutedHours),
      substitutedByOthers: Number(substitutedByOthers),
    };

    console.log(`[TeacherWorkedHours] Данные для сохранения:`, dataToSave);

    // Сохраняем или обновляем запись только если есть активность
    const result = await this.prisma.teacherWorkedHours.upsert({
      where: {
        teacherId_month_year: {
          teacherId,
          month,
          year,
        },
      },
      update: dataToSave,
      create: {
        teacherId,
        month,
        year,
        ...dataToSave,
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

    console.log(`[TeacherWorkedHours] Результат сохранения:`, {
      id: result.id,
      scheduledHours: result.scheduledHours,
      workedHours: result.workedHours,
      substitutedHours: result.substitutedHours,
      substitutedByOthers: result.substitutedByOthers,
    });

    return result;
  }

  /**
   * Разворачивает расписания (периодические и разовые) в конкретные даты для указанного периода
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
            // Статус остается как в базе данных
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
            status: instance.status, // ✅ Виртуальный статус на основе даты/времени
          });
        }
      }
    }

    console.log(`[TeacherWorkedHours] Развернули ${schedules.length} шаблонов расписания в ${expandedSchedules.length} конкретных занятий`);
    return expandedSchedules;
  }

  /**
   * Генерирует экземпляры периодического занятия с правильными статусами
   */
  private generatePeriodicInstances(
    schedule: any,
    startDate: Date,
    endDate: Date,
    excludedDates: Date[] = []
  ): Array<{ date: Date; status: 'COMPLETED' | 'SCHEDULED' }> {
    const instances = [];
    const current = new Date(startDate);
    const now = new Date();
    
    // Добавляем буфер времени - урок считается завершенным только через час после окончания
    const COMPLETION_BUFFER_HOURS = 1;

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
            // Определяем статус на основе даты и времени с буфером
            const instanceDateTime = new Date(dateToCheck);
            const [hours, minutes] = schedule.endTime.split(':');
            instanceDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Добавляем буфер времени для завершения урока
            instanceDateTime.setHours(instanceDateTime.getHours() + COMPLETION_BUFFER_HOURS);
            
            const status: 'COMPLETED' | 'SCHEDULED' = instanceDateTime < now ? 'COMPLETED' : 'SCHEDULED';
            
            console.log(`[TeacherWorkedHours] Урок ${schedule.id} на ${dateToCheck.toLocaleDateString()} ${schedule.startTime}-${schedule.endTime}: статус ${status} (время окончания с буфером: ${instanceDateTime.toLocaleString()})`);
            
            instances.push({
              date: new Date(dateToCheck),
              status,
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
        // Определяем статус на основе даты и времени с буфером
        const instanceDateTime = new Date(dateToCheck);
        const [hours, minutes] = schedule.endTime.split(':');
        instanceDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Добавляем буфер времени для завершения урока
        instanceDateTime.setHours(instanceDateTime.getHours() + COMPLETION_BUFFER_HOURS);
        
        const status: 'COMPLETED' | 'SCHEDULED' = instanceDateTime < now ? 'COMPLETED' : 'SCHEDULED';
        
        console.log(`[TeacherWorkedHours] Урок ${schedule.id} на ${dateToCheck.toLocaleDateString()} ${schedule.startTime}-${schedule.endTime}: статус ${status} (время окончания с буфером: ${instanceDateTime.toLocaleString()})`);
        
        instances.push({
          date: new Date(dateToCheck),
          status,
        });
      }

      current.setDate(current.getDate() + intervalDays);
    }

    console.log(`[TeacherWorkedHours] Сгенерировано ${instances.length} экземпляров для дня недели ${schedule.dayOfWeek} с периодичностью ${schedule.repeat}`);
    return instances;
  }

  /**
   * Генерирует конкретные даты для периодического занятия с учетом периодичности
   */
  private generateDatesForPeriodicSchedule(
    dayOfWeek: number,
    repeat: string,
    startDate: Date,
    endDate: Date,
    excludedDates: Date[] = []
  ): Date[] {
    const dates = [];
    const current = new Date(startDate);

    // Преобразуем день недели (1=понедельник в нашем формате, 0=воскресенье в JS)
    const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek; // 7 (воскресенье) -> 0

    // Найти первое вхождение нужного дня недели в периоде
    while (current.getDay() !== targetDay && current <= endDate) {
      current.setDate(current.getDate() + 1);
    }

    // Определяем интервал в зависимости от периодичности
    let intervalDays = 7; // по умолчанию еженедельно
    
    switch (repeat) {
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
            dates.push(new Date(dateToCheck));
          }
        }
        return dates;
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
        dates.push(new Date(dateToCheck));
      }

      current.setDate(current.getDate() + intervalDays);
    }

    console.log(`[TeacherWorkedHours] Сгенерировано ${dates.length} дат для дня недели ${dayOfWeek} с периодичностью ${repeat}`);
    return dates;
  }

  private generateDatesForRegularSchedule(
    dayOfWeek: number,
    startDate: Date,
    endDate: Date,
    excludedDates: Date[]
  ): Date[] {
    // Используем новый метод с периодичностью 'weekly'
    return this.generateDatesForPeriodicSchedule(dayOfWeek, 'weekly', startDate, endDate, excludedDates);
  }

  private async calculateHoursFromSchedules(schedules: any[], teacherId: number) {
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
        const duration = await this.calculateDuration(schedule.startTime, schedule.endTime);

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
          teacherId: teacherId,
          month: month,
          year: year,
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
        teacherId: teacherId,
        year: year,
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
        month: month,
        year: year,
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
          month: month,
          year: year,
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

  /**
   * Рассчитывает продолжительность занятия в академических часах
   */
  private async calculateDuration(startTime: string, endTime: string): Promise<number> {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Получаем актуальное значение академического часа из настроек
    const academicHourDuration = await this.systemService.getAcademicHourDuration();
    
    // Конвертируем минуты в академические часы
    return durationMinutes / academicHourDuration;
  }

  /**
   * Получает настройку академического часа из базы данных
   * TODO: После создания миграции для SystemSettings включить этот код
   */
  getAcademicHourDuration(): number {
    // TODO: Временно используем константу, позже подключим SystemSettings
    /*
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key: 'academic_hour_duration' }
      });
      return setting ? parseInt(setting.value, 10) : this.ACADEMIC_HOUR_MINUTES;
    } catch (_error) {
      console.warn('Не удалось загрузить настройку академического часа, используем значение по умолчанию:', this.ACADEMIC_HOUR_MINUTES);
      return this.ACADEMIC_HOUR_MINUTES;
    }
    */
    return this.ACADEMIC_HOUR_MINUTES;
  }

  /**
   * Рассчитывает продолжительность занятия в академических часах с учетом настроек
   */
  calculateDurationWithSettings(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    const academicHourDuration = this.getAcademicHourDuration();
    return durationMinutes / academicHourDuration;
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

    console.log(`[TeacherWorkedHoursDetails] Загружаем детали для преподавателя ${teacherId}, период: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

    // Получаем ВСЕ расписания преподавателя (не только с конкретными датами)
    const allSchedules = await this.prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: teacherId }, // основные занятия
          { substituteId: teacherId }, // замещения
        ],
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
    });

    console.log(`[TeacherWorkedHoursDetails] Найдено ${allSchedules.length} шаблонов расписания`);

    // Разворачиваем периодические занятия в конкретные даты для указанного месяца
    const expandedSchedules = this.expandSchedulesForPeriod(allSchedules, startDate, endDate);

    console.log(`[TeacherWorkedHoursDetails] После развертывания: ${expandedSchedules.length} конкретных занятий`);

    // Группируем занятия по типам
    const scheduleDetails = {
      regular: [], // обычные занятия
      substitutions: [], // замещения
      cancelled: [], // отмененные
      rescheduled: [], // перенесенные
    };

    for (const schedule of expandedSchedules) {
      const item = {
        id: schedule.id,
        date: schedule.actualDate, // используем развернутую дату
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: await this.calculateDuration(schedule.startTime, schedule.endTime),
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
        // Добавляем информацию о том, периодическое ли это занятие
        isRecurring: !schedule.date, // если нет конкретной даты, значит периодическое
        repeat: schedule.repeat,
        dayOfWeek: schedule.dayOfWeek,
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

    // Сортируем по дате и времени
    const sortByDateTime = (a: any, b: any) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    };

    scheduleDetails.regular.sort(sortByDateTime);
    scheduleDetails.substitutions.sort(sortByDateTime);
    scheduleDetails.cancelled.sort(sortByDateTime);
    scheduleDetails.rescheduled.sort(sortByDateTime);

    console.log(`[TeacherWorkedHoursDetails] Сгруппированные занятия - Обычные: ${scheduleDetails.regular.length}, Замещения: ${scheduleDetails.substitutions.length}, Отмененные: ${scheduleDetails.cancelled.length}, Перенесенные: ${scheduleDetails.rescheduled.length}`);

    return {
      summary: workedHours,
      details: scheduleDetails,
      statistics: {
        totalSchedules: expandedSchedules.length,
        completedSchedules: expandedSchedules.filter(s => s.status === 'COMPLETED').length,
        cancelledSchedules: expandedSchedules.filter(s => s.status === 'CANCELLED').length,
        rescheduledSchedules: expandedSchedules.filter(s =>
          s.status === 'RESCHEDULED' || s.status === 'MOVED'
        ).length,
        substitutionSchedules: expandedSchedules.filter(s => s.substituteId === teacherId).length,
      },
    };
  }
}
