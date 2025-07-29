import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ActivityMonitoringService } from '../activity-monitoring.service';
import { JwtService } from '../../jwt/jwt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../../generated/prisma';

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
})
export class ActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ActivityGateway.name);

  constructor(
    private readonly activityMonitoringService: ActivityMonitoringService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connecting: ${client.id}`);
    
    try {
      // Извлекаем токен
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        this.logger.warn('No token provided');
        client.disconnect();
        return;
      }

      // Проверяем токен
      const payload = this.jwtService.verify(token as string);
      if (!payload?.id) {
        this.logger.warn('Invalid token payload');
        client.disconnect();
        return;
      }

      // Получаем пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          role: true,
        },
      });

      if (!user) {
        this.logger.warn('User not found');
        client.disconnect();
        return;
      }

      // Сохраняем данные пользователя
      client.data.user = user;

      // Присоединяем к соответствующей комнате
      if (user.role === UserRole.ADMIN) {
        await client.join('admins');
        this.logger.log(`Admin ${user.email} connected successfully`);
        
        // Отправляем начальные данные только админам
        const onlineUsers = await this.activityMonitoringService.getOnlineUsers(user.id);
        client.emit('online-users-update', onlineUsers);
      } else {
        await client.join('users');
        this.logger.log(`User ${user.email} connected successfully`);
      }
      
      // Отправляем подтверждение всем пользователям
      client.emit('connected', { 
        message: 'Connected to activity monitoring',
        userId: user.id,
        isAdmin: user.role === UserRole.ADMIN
      });

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(`Admin ${client.data.user.email} disconnected`);
    }
  }

  @SubscribeMessage('get-online-users')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    try {
      if (!client.data.user) {
        return { error: 'Not authenticated' };
      }

      const onlineUsers = await this.activityMonitoringService.getOnlineUsers(
        client.data.user.id
      );
      
      return { onlineUsers };
    } catch (error) {
      this.logger.error('Error getting online users:', error);
      return { error: 'Failed to get online users' };
    }
  }

  @SubscribeMessage('get-activity')
  async handleGetActivity(
    @MessageBody() data: { userId?: number; limit?: number; offset?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!client.data.user) {
        return { error: 'Not authenticated' };
      }

      const activity = await this.activityMonitoringService.getUserActivity(
        client.data.user.id,
        data.userId,
        data.limit || 50,
        data.offset || 0,
      );
      
      return { activity };
    } catch (error) {
      this.logger.error('Error getting activity:', error);
      return { error: 'Failed to get activity' };
    }
  }

  @SubscribeMessage('get-stats')
  async handleGetStats(
    @MessageBody() data: { days?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!client.data.user) {
        return { error: 'Not authenticated' };
      }

      const stats = await this.activityMonitoringService.getActivityStats(
        client.data.user.id,
        data.days || 7,
      );
      
      return { stats };
    } catch (error) {
      this.logger.error('Error getting stats:', error);
      return { error: 'Failed to get statistics' };
    }
  }

  @SubscribeMessage('update-current-page')
  async handleUpdateCurrentPage(
    @MessageBody() data: { page: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!client.data.user) {
        this.logger.warn('update-current-page: Not authenticated');
        return { error: 'Not authenticated' };
      }

      this.logger.log(`📍 User ${client.data.user.email} (ID: ${client.data.user.id}) navigated to page: ${data.page}`);

      // Получаем токен и находим соответствующую сессию
      const sessionToken = client.handshake.auth?.token || client.handshake.query?.token;
      let sessionId = null;
      
      if (sessionToken) {
        // Обновляем активность сессии с текущей страницей
        await this.activityMonitoringService.updateSessionActivity(sessionToken as string, data.page);
        
        // Находим ID сессии по токену для логирования
        const session = await this.prisma.userSession.findUnique({
          where: { sessionToken: sessionToken as string },
          select: { id: true }
        });
        
        if (session) {
          sessionId = session.id;
        }
      }

      // Логируем смену страницы как активность
      await this.activityMonitoringService.logActivity(client.data.user.id, sessionId, {
        type: 'PAGE_VIEW' as any,
        action: 'page_navigation',
        description: `Пользователь перешел на страницу ${data.page}`,
        url: data.page,
        success: true,
      });

      // Уведомляем других админов об обновлении онлайн пользователей
      if (client.data.user.role === UserRole.ADMIN) {
        const onlineUsers = await this.activityMonitoringService.getOnlineUsers(client.data.user.id);
        this.server.to('admins').emit('online-users-update', onlineUsers);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error updating current page:', error);
      return { error: 'Failed to update current page' };
    }
  }

  // Методы для уведомлений
  notifyUserOnline(userId: number) {
    this.server.to('admins').emit('user-online', { userId });
  }

  notifyUserOffline(userId: number) {
    this.server.to('admins').emit('user-offline', { userId });
  }

  notifyNewActivity(activity: any) {
    this.server.to('admins').emit('new-activity', activity);
  }

  async broadcastOnlineUsersUpdate() {
    try {
      // Получаем админа для выполнения запроса (нужен любой админ)
      const admin = await this.prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      if (admin) {
        const onlineUsers = await this.activityMonitoringService.getOnlineUsers(admin.id);
        this.server.to('admins').emit('online-users-update', onlineUsers);
      }
    } catch (error) {
      this.logger.error('Error broadcasting online users update:', error);
    }
  }
}
