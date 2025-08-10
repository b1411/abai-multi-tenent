import { Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto, AddNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateQueryDto, PaginateResponseDto, PaginateMetaDto } from '../common/dtos/paginate.dto';
import { Subject } from 'rxjs';

export interface NotificationEvent {
  userId: number;
  notification: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notificationSubject = new Subject<NotificationEvent>();

  constructor(private prisma: PrismaService) { }

  getNotificationStream() {
    return this.notificationSubject.asObservable();
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
      include: {
        user: {
          select: { id: true, name: true, surname: true, role: true }
        }
      }
    });

    // Отправка уведомления через локальный Subject
    this.publishNotification(notification.userId, notification);

    return notification;
  }

  async addNotification(addNotificationDto: AddNotificationDto) {
    const { userIds, ...notificationData } = addNotificationDto;

    const notifications = await Promise.all(
      userIds.map(async (userId) => {
        const notification = await this.prisma.notification.create({
          data: {
            ...notificationData,
            userId,
          },
          include: {
            user: {
              select: { id: true, name: true, surname: true, role: true }
            }
          }
        });

        // Отправка уведомления через локальный Subject
        this.publishNotification(userId, notification);

        return notification;
      })
    );

    return notifications;
  }

  /**
   * Пакетное создание уведомлений с индивидуальными сообщениями/ссылками для каждого получателя
   */
  async addNotificationsBulk(notifications: Array<{
    userId: number;
    type: string;
    message: string;
    url?: string;
    createdBy?: number;
  }>) {
    const created: any[] = [];
    for (const n of notifications) {
      try {
        const notification = await this.prisma.notification.create({
          data: {
            userId: n.userId,
            type: n.type,
            message: n.message,
            url: n.url,
            createdBy: n.createdBy,
          },
          include: {
            user: {
              select: { id: true, name: true, surname: true, role: true }
            }
          }
        });

        this.publishNotification(n.userId, notification);
        created.push(notification);
      } catch (error) {
        this.logger.error('Error creating notification (bulk item):', error);
      }
    }
    return created;
  }

  private publishNotification(userId: number, notification: any) {
    try {
      const event: NotificationEvent = {
        userId,
        notification
      };

      // Отправляем уведомление через локальный Subject для SSE
      this.notificationSubject.next(event);
      this.logger.debug(`Notification published for user ${userId}`);
    } catch (error) {
      this.logger.error('Error publishing notification:', error);
    }
  }

  async findAll(paginateQuery: PaginateQueryDto): Promise<PaginateResponseDto<any>> {
    const { page, limit, sortBy, order, search } = paginateQuery;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { type: { contains: search, mode: 'insensitive' as const } },
          { message: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [notifications, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          user: {
            select: { id: true, name: true, surname: true, role: true }
          }
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const meta: PaginateMetaDto = {
      totalItems,
      itemCount: notifications.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };

    return { data: notifications, meta };
  }

  async findByUserId(userId: number, paginateQuery: PaginateQueryDto): Promise<PaginateResponseDto<any>> {
    const { page, limit, sortBy, order } = paginateQuery;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
    };

    const [notifications, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const meta: PaginateMetaDto = {
      totalItems,
      itemCount: notifications.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };

    return { data: notifications, meta };
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, surname: true, role: true }
        }
      }
    });

    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
        deletedAt: null,
      },
    });
  }

  async markAsRead(id: number) {
    await this.findOne(id);

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
      include: {
        user: {
          select: { id: true, name: true, surname: true, role: true }
        }
      }
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        deletedAt: null,
      },
      data: { read: true },
    });
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    await this.findOne(id);

    return this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
      include: {
        user: {
          select: { id: true, name: true, surname: true, role: true }
        }
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        type: true,
        message: true,
        deletedAt: true,
      },
    });
  }

  // Вспомогательные методы для создания типовых уведомлений
  async notifyNewQuiz(teacherId: number, studentIds: number[], quizName: string) {
    return this.addNotification({
      userIds: studentIds,
      type: 'NEW_QUIZ',
      message: `Новый тест: ${quizName}`,
      url: '/quizzes',
      createdBy: teacherId,
    });
  }

  async notifyQuizResult(studentId: number, quizName: string, score: number) {
    return this.addNotification({
      userIds: [studentId],
      type: 'QUIZ_RESULT',
      message: `Результат теста "${quizName}": ${score} баллов`,
      url: '/quiz-results',
    });
  }

  async notifyNewHomework(teacherId: number, studentIds: number[], homeworkName: string) {
    return this.addNotification({
      userIds: studentIds,
      type: 'NEW_HOMEWORK',
      message: `Новое домашнее задание: ${homeworkName}`,
      url: '/homework',
      createdBy: teacherId,
    });
  }

  async notifyPaymentDue(studentId: number, amount: number, dueDate: Date) {
    return this.addNotification({
      userIds: [studentId],
      type: 'PAYMENT_DUE',
      message: `Требуется оплата: ${amount} тенге. Срок: ${dueDate.toLocaleDateString()}`,
      url: '/payments',
    });
  }

  async notifyLessonCancelled(teacherId: number, studentIds: number[], lessonName: string, date: Date) {
    return this.addNotification({
      userIds: studentIds,
      type: 'LESSON_CANCELLED',
      message: `Урок "${lessonName}" отменен (${date.toLocaleDateString()})`,
      url: '/schedule',
      createdBy: teacherId,
    });
  }

  async notifyNewChatMessage(senderId: number, recipientIds: number[], senderName: string, messagePreview: string, chatId: number) {
    return this.addNotification({
      userIds: recipientIds,
      type: 'NEW_MESSAGE',
      message: `${senderName}: ${messagePreview}`,
      url: `/chat?chatId=${chatId}`,
      createdBy: senderId,
    });
  }

  // Уведомления для системы отпусков
  async notifyVacationCreated(teacherName: string, hrUserIds: number[], adminUserIds: number[], vacationId: number, startDate: Date, endDate: Date) {
    const allRecipients = [...hrUserIds, ...adminUserIds];
    
    if (allRecipients.length === 0) return [];

    return this.addNotification({
      userIds: allRecipients,
      type: 'VACATION_REQUEST_CREATED',
      message: `Создана заявка на отпуск: ${teacherName} с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`,
      url: `/vacations/${vacationId}`,
    });
  }

  async notifySubstituteAssigned(substituteUserId: number, teacherName: string, vacationId: number, startDate: Date, endDate: Date) {
    return this.addNotification({
      userIds: [substituteUserId],
      type: 'VACATION_SUBSTITUTE_ASSIGNED',
      message: `Вы назначены замещающим для ${teacherName} с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`,
      url: `/vacations/${vacationId}`,
    });
  }
}
