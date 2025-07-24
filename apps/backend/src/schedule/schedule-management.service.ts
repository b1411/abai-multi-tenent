import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleAiService } from './schedule-ai.service';
import { 
  ScheduleStatus, 
  ScheduleType,
  Schedule
} from '../../generated/prisma';

export interface RescheduleRequest {
  scheduleId: string;
  newDate: Date;
  newStartTime: string;
  newEndTime: string;
  newClassroomId?: number;
  reason: string;
  notifyParticipants?: boolean;
}

export interface CancelRequest {
  scheduleId: string;
  reason: string;
  notifyParticipants?: boolean;
}

export interface SubstituteRequest {
  scheduleId: string;
  substituteTeacherId: number;
  reason: string;
  notes?: string;
  notifyParticipants?: boolean;
}

export interface BatchOperation {
  operation: 'RESCHEDULE' | 'CANCEL' | 'SUBSTITUTE';
  scheduleIds: string[];
  data: any; // специфичные данные для каждой операции
  reason: string;
}

export interface ScheduleOperationResult {
  success: boolean;
  scheduleId: string;
  message: string;
  newScheduleId?: string;
  conflicts?: any[];
}

@Injectable()
export class ScheduleManagementService {
  private readonly logger = new Logger(ScheduleManagementService.name);

  constructor(
    private prisma: PrismaService,
    private scheduleAiService: ScheduleAiService
  ) {}

  /**
   * Переносит занятие на новое время
   */
  async rescheduleLesson(request: RescheduleRequest): Promise<ScheduleOperationResult> {
    this.logger.log(`Rescheduling lesson ${request.scheduleId}`);

    try {
      // 1. Получаем оригинальное расписание
      const originalSchedule = await this.getScheduleById(request.scheduleId);
      if (!originalSchedule) {
        throw new NotFoundException('Расписание не найдено');
      }

      // 2. Проверяем конфликты для нового времени
      const conflicts = await this.scheduleAiService.detectScheduleConflicts(
        request.newDate,
        request.newStartTime,
        request.newEndTime,
        originalSchedule.teacherId,
        request.newClassroomId || originalSchedule.classroomId,
        originalSchedule.groupId,
        request.scheduleId
      );

      if (conflicts.length > 0) {
        const highSeverityConflicts = conflicts.filter(c => c.severity >= 3);
        if (highSeverityConflicts.length > 0) {
          return {
            success: false,
            scheduleId: request.scheduleId,
            message: 'Обнаружены критические конфликты',
            conflicts: highSeverityConflicts
          };
        }
      }

      // 3. Создаем новое расписание
      const newSchedule = await this.prisma.schedule.create({
        data: {
          studyPlanId: originalSchedule.studyPlanId,
          groupId: originalSchedule.groupId,
          teacherId: originalSchedule.teacherId,
          classroomId: request.newClassroomId || originalSchedule.classroomId,
          lessonId: originalSchedule.lessonId,
          date: request.newDate,
          startTime: request.newStartTime,
          endTime: request.newEndTime,
          dayOfWeek: request.newDate.getDay(),
          type: originalSchedule.type,
          status: ScheduleStatus.SCHEDULED,
          originalDate: originalSchedule.date,
          originalTime: originalSchedule.startTime,
          moveReason: request.reason,
          notes: `Перенесено с ${originalSchedule.date.toISOString().split('T')[0]} ${originalSchedule.startTime}`
        }
      });

      // 4. Обновляем оригинальное расписание
      await this.prisma.schedule.update({
        where: { id: request.scheduleId },
        data: {
          status: ScheduleStatus.RESCHEDULED,
          rescheduledTo: newSchedule.id,
          moveReason: request.reason
        }
      });

      // 5. Отправляем уведомления (если требуется)
      if (request.notifyParticipants) {
        await this.sendRescheduleNotifications(originalSchedule, newSchedule, request.reason);
      }

      return {
        success: true,
        scheduleId: request.scheduleId,
        newScheduleId: newSchedule.id,
        message: 'Занятие успешно перенесено',
        conflicts: conflicts.filter(c => c.severity < 3)
      };

    } catch (error) {
      this.logger.error('Error rescheduling lesson:', error);
      throw error;
    }
  }

  /**
   * Отменяет занятие
   */
  async cancelLesson(request: CancelRequest): Promise<ScheduleOperationResult> {
    this.logger.log(`Cancelling lesson ${request.scheduleId}`);

    try {
      const schedule = await this.getScheduleById(request.scheduleId);
      if (!schedule) {
        throw new NotFoundException('Расписание не найдено');
      }

      // Обновляем статус на отменено
      await this.prisma.schedule.update({
        where: { id: request.scheduleId },
        data: {
          status: ScheduleStatus.CANCELLED,
          cancelReason: request.reason
        }
      });

      // Отправляем уведомления
      if (request.notifyParticipants) {
        await this.sendCancellationNotifications(schedule, request.reason);
      }

      return {
        success: true,
        scheduleId: request.scheduleId,
        message: 'Занятие отменено'
      };

    } catch (error) {
      this.logger.error('Error cancelling lesson:', error);
      throw error;
    }
  }

  /**
   * Назначает замещающего преподавателя
   */
  async assignSubstitute(request: SubstituteRequest): Promise<ScheduleOperationResult> {
    this.logger.log(`Assigning substitute for lesson ${request.scheduleId}`);

    try {
      const schedule = await this.getScheduleById(request.scheduleId);
      if (!schedule) {
        throw new NotFoundException('Расписание не найдено');
      }

      // Проверяем доступность замещающего преподавателя
      const conflicts = await this.scheduleAiService.detectScheduleConflicts(
        schedule.date,
        schedule.startTime,
        schedule.endTime,
        request.substituteTeacherId,
        schedule.classroomId,
        schedule.groupId,
        request.scheduleId
      );

      const teacherConflicts = conflicts.filter(c => c.type === 'TEACHER_BUSY');
      if (teacherConflicts.length > 0) {
        return {
          success: false,
          scheduleId: request.scheduleId,
          message: 'Замещающий преподаватель не доступен в это время',
          conflicts: teacherConflicts
        };
      }

      // Назначаем замещение
      await this.prisma.schedule.update({
        where: { id: request.scheduleId },
        data: {
          substituteId: request.substituteTeacherId,
          substituteReason: request.reason,
          type: ScheduleType.SUBSTITUTE,
          notes: request.notes ? 
            `${schedule.notes || ''}\nЗамещение: ${request.notes}` : 
            schedule.notes
        }
      });

      // Отправляем уведомления
      if (request.notifyParticipants) {
        await this.sendSubstituteNotifications(schedule, request.substituteTeacherId, request.reason);
      }

      return {
        success: true,
        scheduleId: request.scheduleId,
        message: 'Замещающий преподаватель назначен'
      };

    } catch (error) {
      this.logger.error('Error assigning substitute:', error);
      throw error;
    }
  }

  /**
   * Выполняет массовые операции с расписанием
   */
  async performBatchOperation(operation: BatchOperation): Promise<{
    batchId: string;
    results: ScheduleOperationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    this.logger.log(`Performing batch operation: ${operation.operation} for ${operation.scheduleIds.length} schedules`);

    // Создаем запись о массовой операции
    const batch = await this.prisma.scheduleBatch.create({
      data: {
        operation: operation.operation,
        description: operation.reason,
        totalItems: operation.scheduleIds.length,
        status: 'PROCESSING'
      }
    });

    const results: ScheduleOperationResult[] = [];
    let successful = 0;
    let failed = 0;

    try {
      for (const scheduleId of operation.scheduleIds) {
        try {
          let result: ScheduleOperationResult;

          switch (operation.operation) {
            case 'RESCHEDULE':
              result = await this.rescheduleLesson({
                scheduleId,
                ...operation.data,
                reason: operation.reason
              });
              break;

            case 'CANCEL':
              result = await this.cancelLesson({
                scheduleId,
                reason: operation.reason,
                notifyParticipants: operation.data.notifyParticipants
              });
              break;

            case 'SUBSTITUTE':
              result = await this.assignSubstitute({
                scheduleId,
                ...operation.data,
                reason: operation.reason
              });
              break;

            default:
              throw new BadRequestException('Неизвестная операция');
          }

          results.push(result);
          if (result.success) successful++;
          else failed++;

        } catch (error) {
          failed++;
          results.push({
            success: false,
            scheduleId,
            message: error.message || 'Неизвестная ошибка'
          });
        }
      }

      // Обновляем статус массовой операции
      await this.prisma.scheduleBatch.update({
        where: { id: batch.id },
        data: {
          processedItems: successful + failed,
          failedItems: failed,
          status: failed === 0 ? 'COMPLETED' : 'COMPLETED',
          completedAt: new Date(),
          errors: failed > 0 ? { 
            errors: results.filter(r => !r.success).map(r => r.message) 
          } : null
        }
      });

      return {
        batchId: batch.id,
        results,
        summary: {
          total: operation.scheduleIds.length,
          successful,
          failed
        }
      };

    } catch (error) {
      // Обновляем статус на ошибку
      await this.prisma.scheduleBatch.update({
        where: { id: batch.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errors: { error: error.message }
        }
      });

      throw error;
    }
  }

  /**
   * Автоматически назначает замещения при отпуске преподавателя
   */
  async handleVacationSubstitutions(vacationId: number): Promise<{
    processedSchedules: number;
    substitutedSchedules: number;
    cancelledSchedules: number;
    errors: string[];
  }> {
    this.logger.log(`Handling vacation substitutions for vacation ${vacationId}`);

    const vacation = await this.prisma.vacation.findUnique({
      where: { id: vacationId },
      include: { 
        teacher: { include: { user: true } },
        substitute: { include: { user: true } }
      }
    });

    if (!vacation) {
      throw new NotFoundException('Отпуск не найден');
    }

    // Получаем все расписания преподавателя в период отпуска
    const affectedSchedules = await this.prisma.schedule.findMany({
      where: {
        teacherId: vacation.teacherId,
        date: {
          gte: vacation.startDate,
          lte: vacation.endDate
        },
        status: ScheduleStatus.SCHEDULED,
        deletedAt: null
      },
      include: {
        lesson: true,
        group: true
      }
    });

    let substitutedSchedules = 0;
    let cancelledSchedules = 0;
    const errors: string[] = [];

    for (const schedule of affectedSchedules) {
      try {
        if (vacation.substituteId) {
          // Назначаем замещающего преподавателя
          const result = await this.assignSubstitute({
            scheduleId: schedule.id,
            substituteTeacherId: vacation.substituteId,
            reason: `Замещение на время отпуска (${vacation.startDate.toISOString().split('T')[0]} - ${vacation.endDate.toISOString().split('T')[0]})`,
            notes: vacation.workTasks || undefined,
            notifyParticipants: true
          });

          if (result.success) {
            substitutedSchedules++;
          } else {
            // Если не удалось назначить замещение, отменяем занятие
            await this.cancelLesson({
              scheduleId: schedule.id,
              reason: `Отменено из-за отпуска преподавателя. ${result.message}`,
              notifyParticipants: true
            });
            cancelledSchedules++;
          }
        } else {
          // Нет замещающего - отменяем занятие
          await this.cancelLesson({
            scheduleId: schedule.id,
            reason: `Отменено из-за отпуска преподавателя (${vacation.startDate.toISOString().split('T')[0]} - ${vacation.endDate.toISOString().split('T')[0]})`,
            notifyParticipants: true
          });
          cancelledSchedules++;
        }
      } catch (error) {
        errors.push(`Ошибка обработки расписания ${schedule.id}: ${error.message}`);
      }
    }

    return {
      processedSchedules: affectedSchedules.length,
      substitutedSchedules,
      cancelledSchedules,
      errors
    };
  }

  // Приватные методы

  private async getScheduleById(id: string) {
    return this.prisma.schedule.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: true } },
        substitute: { include: { user: true } },
        group: true,
        classroom: true,
        lesson: true
      }
    });
  }

  private async sendRescheduleNotifications(
    originalSchedule: any,
    newSchedule: any,
    reason: string
  ) {
    // Здесь была бы логика отправки уведомлений
    // Можно интегрировать с существующей системой уведомлений
    this.logger.log(`Sending reschedule notifications for schedule ${originalSchedule.id}`);
    
    // Создаем уведомления в базе данных
    const notifications = [];

    // Уведомление группе студентов
    const students = await this.prisma.student.findMany({
      where: { groupId: originalSchedule.groupId },
      include: { user: true }
    });

    for (const student of students) {
      notifications.push({
        userId: student.userId,
        type: 'SCHEDULE_RESCHEDULE',
        message: `Занятие "${originalSchedule.lesson?.name}" перенесено с ${originalSchedule.date.toISOString().split('T')[0]} ${originalSchedule.startTime} на ${newSchedule.date.toISOString().split('T')[0]} ${newSchedule.startTime}. Причина: ${reason}`,
        url: `/schedule/${newSchedule.id}`
      });
    }

    // Уведомление преподавателю
    notifications.push({
      userId: originalSchedule.teacher.userId,
      type: 'SCHEDULE_RESCHEDULE',
      message: `Ваше занятие "${originalSchedule.lesson?.name}" перенесено с ${originalSchedule.date.toISOString().split('T')[0]} ${originalSchedule.startTime} на ${newSchedule.date.toISOString().split('T')[0]} ${newSchedule.startTime}`,
      url: `/schedule/${newSchedule.id}`
    });

    await this.prisma.notification.createMany({
      data: notifications
    });
  }

  private async sendCancellationNotifications(schedule: any, reason: string) {
    this.logger.log(`Sending cancellation notifications for schedule ${schedule.id}`);

    const notifications = [];

    // Уведомление группе студентов
    const students = await this.prisma.student.findMany({
      where: { groupId: schedule.groupId },
      include: { user: true }
    });

    for (const student of students) {
      notifications.push({
        userId: student.userId,
        type: 'SCHEDULE_CANCEL',
        message: `Занятие "${schedule.lesson?.name}" ${schedule.date.toISOString().split('T')[0]} ${schedule.startTime} отменено. Причина: ${reason}`,
        url: `/schedule`
      });
    }

    // Уведомление преподавателю
    notifications.push({
      userId: schedule.teacher.userId,
      type: 'SCHEDULE_CANCEL',
      message: `Ваше занятие "${schedule.lesson?.name}" ${schedule.date.toISOString().split('T')[0]} ${schedule.startTime} отменено`,
      url: `/schedule`
    });

    await this.prisma.notification.createMany({
      data: notifications
    });
  }

  private async sendSubstituteNotifications(
    schedule: any, 
    substituteTeacherId: number, 
    reason: string
  ) {
    this.logger.log(`Sending substitute notifications for schedule ${schedule.id}`);

    const substitute = await this.prisma.teacher.findUnique({
      where: { id: substituteTeacherId },
      include: { user: true }
    });

    const notifications = [];

    // Уведомление группе студентов
    const students = await this.prisma.student.findMany({
      where: { groupId: schedule.groupId },
      include: { user: true }
    });

    for (const student of students) {
      notifications.push({
        userId: student.userId,
        type: 'SCHEDULE_SUBSTITUTE',
        message: `В занятии "${schedule.lesson?.name}" ${schedule.date.toISOString().split('T')[0]} ${schedule.startTime} произошла замена преподавателя. Вместо ${schedule.teacher.user.name} будет вести ${substitute?.user.name}. Причина: ${reason}`,
        url: `/schedule/${schedule.id}`
      });
    }

    // Уведомление оригинальному преподавателю
    notifications.push({
      userId: schedule.teacher.userId,
      type: 'SCHEDULE_SUBSTITUTE',
      message: `Для вашего занятия "${schedule.lesson?.name}" ${schedule.date.toISOString().split('T')[0]} ${schedule.startTime} назначен замещающий преподаватель: ${substitute?.user.name}`,
      url: `/schedule/${schedule.id}`
    });

    // Уведомление замещающему преподавателю
    if (substitute) {
      notifications.push({
        userId: substitute.userId,
        type: 'SCHEDULE_SUBSTITUTE',
        message: `Вы назначены замещающим преподавателем для занятия "${schedule.lesson?.name}" ${schedule.date.toISOString().split('T')[0]} ${schedule.startTime}. Группа: ${schedule.group.name}`,
        url: `/schedule/${schedule.id}`
      });
    }

    await this.prisma.notification.createMany({
      data: notifications
    });
  }
}
