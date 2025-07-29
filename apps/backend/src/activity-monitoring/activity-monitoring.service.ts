import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType, SessionStatus, UserRole } from '../../generated/prisma';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface ActivityLogData {
  type: ActivityType;
  action: string;
  description?: string;
  method?: string;
  url?: string;
  route?: string;
  statusCode?: number;
  requestData?: any;
  responseData?: any;
  entityType?: string;
  entityId?: string;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
}

export interface SessionData {
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
}

@Injectable()
export class ActivityMonitoringService {
  constructor(private prisma: PrismaService) {}

  // Создание новой сессии при логине
  async createSession(userId: number, sessionToken: string, sessionData: SessionData) {
    try {
      // Завершаем старые неактивные сессии пользователя
      await this.expireOldSessions(userId);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // сессия на 24 часа

      const session = await this.prisma.userSession.create({
        data: {
          userId,
          sessionToken,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          device: sessionData.device,
          browser: sessionData.browser,
          os: sessionData.os,
          location: sessionData.location,
          status: SessionStatus.ACTIVE,
          expiresAt,
        },
      });

      // Обновляем онлайн статус
      await this.updateOnlineStatus(userId, true);

      // Логируем активность входа
      await this.logActivity(userId, session.id, {
        type: ActivityType.LOGIN,
        action: 'user_login',
        description: 'Пользователь вошел в систему',
        success: true,
      });

      console.log(`Session created for user ${userId}, session: ${session.id}`);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Завершение сессии при выходе
  async terminateSession(sessionToken: string) {
    try {
      const session = await this.prisma.userSession.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!session) {
        return;
      }

      await this.prisma.userSession.update({
        where: { sessionToken },
        data: {
          status: SessionStatus.TERMINATED,
          logoutAt: new Date(),
        },
      });

      // Проверяем есть ли еще активные сессии у пользователя
      const activeSessions = await this.prisma.userSession.count({
        where: {
          userId: session.userId,
          status: SessionStatus.ACTIVE,
        },
      });

      // Если нет активных сессий, обновляем онлайн статус
      if (activeSessions === 0) {
        await this.updateOnlineStatus(session.userId, false);
      }

      // Логируем активность выхода
      await this.logActivity(session.userId, session.id, {
        type: ActivityType.LOGOUT,
        action: 'user_logout',
        description: 'Пользователь вышел из системы',
        success: true,
      });
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }

  // Обновление активности сессии
  async updateSessionActivity(sessionToken: string, currentPage?: string) {
    try {
      const session = await this.prisma.userSession.findUnique({
        where: { sessionToken },
      });

      if (!session || session.status !== SessionStatus.ACTIVE) {
        return;
      }

      await this.prisma.userSession.update({
        where: { sessionToken },
        data: {
          lastActivityAt: new Date(),
        },
      });

      // Обновляем онлайн статус
      await this.prisma.userOnlineStatus.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          isOnline: true,
          currentPage,
          sessionCount: 1,
        },
        update: {
          lastSeen: new Date(),
          currentPage,
        },
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  // Логирование активности
  async logActivity(userId: number, sessionId: string | null, data: ActivityLogData) {
    try {
      // Проверяем, существует ли пользователь
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!userExists) {
        console.warn(`Activity logging skipped: User with ID ${userId} not found`);
        return;
      }

      // Проверяем, существует ли сессия (если sessionId передан)
      let validSessionId = null;
      if (sessionId) {
        const sessionExists = await this.prisma.userSession.findUnique({
          where: { id: sessionId },
          select: { id: true }
        });
        
        if (sessionExists) {
          validSessionId = sessionId;
        } else {
          console.warn(`Activity logging: Session with ID ${sessionId} not found, logging without session`);
        }
      }

      await this.prisma.activityLog.create({
        data: {
          userId,
          sessionId: validSessionId,
          type: data.type,
          action: data.action,
          description: data.description,
          method: data.method,
          url: data.url,
          route: data.route,
          statusCode: data.statusCode,
          requestData: data.requestData,
          responseData: data.responseData,
          entityType: data.entityType,
          entityId: data.entityId,
          duration: data.duration,
          success: data.success ?? true,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Получение онлайн пользователей (только для админов)
  async getOnlineUsers(adminUserId: number) {
    // Проверяем, что пользователь является админом
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Access denied. Admin role required.');
    }

    const onlineStatuses = await this.prisma.userOnlineStatus.findMany({
      where: { isOnline: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { lastSeen: 'desc' },
    });

    // Преобразуем в плоскую структуру, которую ожидает фронтенд
    return onlineStatuses.map(status => ({
      id: status.user.id,
      name: status.user.name,
      surname: status.user.surname,
      email: status.user.email,
      role: status.user.role,
      avatar: status.user.avatar,
      lastSeen: status.lastSeen.toISOString(),
      currentPage: status.currentPage,
      sessionCount: status.sessionCount,
    }));
  }

  // Получение активности пользователя
  async getUserActivity(adminUserId: number, targetUserId?: number, limit = 50, offset = 0) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Access denied. Admin role required.');
    }

    const whereClause = targetUserId ? { userId: targetUserId } : {};

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityLog.count({ where: whereClause }),
    ]);

    return { activities, total };
  }

  // Получение статистики активности
  async getActivityStats(adminUserId: number, days = 7) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Access denied. Admin role required.');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalUsers, activeUsers, totalSessions, totalActivities] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userOnlineStatus.count({ where: { isOnline: true } }),
      this.prisma.userSession.count({
        where: {
          createdAt: { gte: startDate },
          status: SessionStatus.ACTIVE,
        },
      }),
      this.prisma.activityLog.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    // Статистика по дням
    const dailyStats = await this.prisma.dailyActivityStats.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return {
      summary: {
        totalUsers,
        activeUsers,
        totalSessions,
        totalActivities,
      },
      dailyStats,
    };
  }

  // Парсинг User Agent
  parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      device: result.device.type || 'desktop',
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
    };
  }

  // Получение данных из запроса
  getSessionDataFromRequest(req: Request): SessionData {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const parsedUA = this.parseUserAgent(userAgent);

    return {
      ipAddress,
      userAgent,
      device: parsedUA.device,
      browser: parsedUA.browser,
      os: parsedUA.os,
    };
  }

  // Завершение старых сессий
  private async expireOldSessions(userId: number) {
    const expiredTime = new Date();
    expiredTime.setHours(expiredTime.getHours() - 24);

    await this.prisma.userSession.updateMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActivityAt: { lt: expiredTime } },
        ],
        status: SessionStatus.ACTIVE,
      },
      data: {
        status: SessionStatus.EXPIRED,
      },
    });
  }

  // Обновление онлайн статуса
  private async updateOnlineStatus(userId: number, isOnline: boolean) {
    await this.prisma.userOnlineStatus.upsert({
      where: { userId },
      create: {
        userId,
        isOnline,
        sessionCount: isOnline ? 1 : 0,
      },
      update: {
        isOnline,
        lastSeen: new Date(),
        sessionCount: isOnline
          ? { increment: 1 }
          : { decrement: 1 },
      },
    });
  }

  // Очистка старых логов (для крон-задачи)
  async cleanupOldLogs() {
    const retentionDays = 180; // 6 месяцев
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedCount = await this.prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    console.log(`Cleaned up ${deletedCount.count} old activity logs`);
    return deletedCount.count;
  }
}
