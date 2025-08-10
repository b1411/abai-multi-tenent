import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface NotificationTemplate {
  subject: string;
  message: string;
  type: 'email' | 'system' | 'sms';
}

@Injectable()
export class PayrollNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async notifyPayrollCalculated(teacherId: number, month: number, year: number) {
    const teacher = await this.prisma.teacher.findUnique({
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
    });

    if (!teacher) return;

    const notification: NotificationTemplate = {
      subject: 'Зарплата рассчитана',
      message: `Ваша зарплата за ${month}/${year} рассчитана и ожидает подтверждения.`,
      type: 'system',
    };

    await this.notificationsService.create({
      userId: teacher.user.id,
      type: notification.type,
      message: notification.message,
    });
  }

  async notifyPayrollApproved(teacherId: number, month: number, year: number) {
    const teacher = await this.prisma.teacher.findUnique({
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
    });

    if (!teacher) return;

    const notification: NotificationTemplate = {
      subject: 'Зарплата утверждена',
      message: `Ваша зарплата за ${month}/${year} утверждена и готова к выплате.`,
      type: 'system',
    };

    await this.notificationsService.create({
      userId: teacher.user.id,
      type: notification.type,
      message: notification.message,
    });
  }

  async notifyPayrollPaid(teacherId: number, month: number, year: number) {
    const teacher = await this.prisma.teacher.findUnique({
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
    });

    if (!teacher) return;

    const notification: NotificationTemplate = {
      subject: 'Зарплата выплачена',
      message: `Ваша зарплата за ${month}/${year} выплачена.`,
      type: 'system',
    };

    await this.notificationsService.create({
      userId: teacher.user.id,
      type: notification.type,
      message: notification.message,
    });
  }

  async notifyPayrollRejected(teacherId: number, month: number, year: number, reason: string) {
    const teacher = await this.prisma.teacher.findUnique({
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
    });

    if (!teacher) return;

    const notification: NotificationTemplate = {
      subject: 'Зарплата отклонена',
      message: `Ваша зарплата за ${month}/${year} отклонена. Причина: ${reason}`,
      type: 'system',
    };

    await this.notificationsService.create({
      userId: teacher.user.id,
      type: notification.type,
      message: notification.message,
    });
  }

  async notifySubstitutionAssigned(originalTeacherId: number, substituteTeacherId: number, scheduleDetails: any) {
    const [originalTeacher, substitute] = await Promise.all([
      this.prisma.teacher.findUnique({
        where: { id: originalTeacherId },
        include: { user: { select: { id: true, name: true, surname: true } } },
      }),
      this.prisma.teacher.findUnique({
        where: { id: substituteTeacherId },
        include: { user: { select: { id: true, name: true, surname: true } } },
      }),
    ]);

    if (!originalTeacher || !substitute) return;

    // Уведомление замещающему
    const substituteNotification: NotificationTemplate = {
      subject: 'Назначено замещение',
      message: `Вам назначено замещение занятия "${scheduleDetails.studyPlan}" в группе "${scheduleDetails.group}" на ${scheduleDetails.date} ${scheduleDetails.startTime}-${scheduleDetails.endTime}`,
      type: 'system',
    };

    // Уведомление оригинальному преподавателю
    const originalNotification: NotificationTemplate = {
      subject: 'Замещение назначено',
      message: `Для вашего занятия "${scheduleDetails.studyPlan}" в группе "${scheduleDetails.group}" на ${scheduleDetails.date} назначен замещающий: ${substitute.user.surname} ${substitute.user.name}`,
      type: 'system',
    };

    await this.notificationsService.addNotificationsBulk([
      { userId: substitute.user.id, type: substituteNotification.type, message: substituteNotification.message },
      { userId: originalTeacher.user.id, type: originalNotification.type, message: originalNotification.message },
    ]);
  }

  async notifyFinancistsAboutPendingApprovals() {
    const financists = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'FINANCIST'] },
        deletedAt: null,
      },
    });

    const pendingCount = await this.prisma.salary.count({
      where: {
        status: 'DRAFT',
        deletedAt: null,
      },
    });

    if (pendingCount === 0) return;

    const notification: NotificationTemplate = {
      subject: 'Ожидают подтверждения зарплаты',
      message: `У вас ${pendingCount} зарплат ожидают подтверждения.`,
      type: 'system',
    };

    await this.notificationsService.addNotificationsBulk(
      financists.map((f) => ({ userId: f.id, type: notification.type, message: notification.message }))
    );
  }

  async notifyBulkPayrollCalculated(month: number, year: number, stats: { successful: number; failed: number }) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'FINANCIST'] },
        deletedAt: null,
      },
    });

    const notification: NotificationTemplate = {
      subject: 'Массовый расчет зарплат завершен',
      message: `Расчет зарплат за ${month}/${year} завершен. Успешно: ${stats.successful}, с ошибками: ${stats.failed}`,
      type: 'system',
    };

    await this.notificationsService.addNotificationsBulk(
      admins.map((a) => ({ userId: a.id, type: notification.type, message: notification.message }))
    );
  }

  // Удалён собственный метод createNotification — используем NotificationsService

  async getPayrollNotificationSettings(userId: number) {
    // Здесь можно реализовать пользовательские настройки уведомлений
    // TODO: Получить настройки из базы данных
    console.log(`Getting notification settings for user ${userId}`);
    return {
      payrollCalculated: true,
      payrollApproved: true,
      payrollPaid: true,
      payrollRejected: true,
      substitutionAssigned: true,
      emailNotifications: true,
      smsNotifications: false,
    };
  }

  async updatePayrollNotificationSettings(userId: number, settings: any) {
    // Здесь можно реализовать обновление настроек уведомлений
    // TODO: Сохранить настройки в базе данных
    console.log(`Updating notification settings for user ${userId}`, settings);
    return settings;
  }

  async sendPayrollReminders() {
    // Уведомления о просроченных зарплатах
    const overdueApprovals = await this.prisma.salary.findMany({
      where: {
        status: 'DRAFT',
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 дней назад
        },
        deletedAt: null,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    if (overdueApprovals.length > 0) {
      const financists = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'FINANCIST'] },
          deletedAt: null,
        },
      });

      const notification: NotificationTemplate = {
        subject: 'Просроченные зарплаты требуют внимания',
        message: `У вас ${overdueApprovals.length} зарплат, ожидающих подтверждения более 7 дней.`,
        type: 'system',
      };

      await this.notificationsService.addNotificationsBulk(
        financists.map((f) => ({ userId: f.id, type: notification.type, message: notification.message }))
      );
    }
  }
}
