import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtService } from '../jwt/jwt.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Извлекаем токен из query или headers
      const token = client.handshake?.auth?.token || client.handshake?.query?.token;

      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect?.();
        return;
      }

      // Верифицируем JWT токен
      const payload = this.jwtService.verify(token as string);
      client.userId = parseInt(payload.id.toString());

      // Сохраняем подключение пользователя
      this.connectedUsers.set(client.userId, client.id || '');

      // Присоединяем пользователя к его персональной комнате
      await client.join?.(`user:${client.userId}`);

      // Получаем чаты пользователя и присоединяем к комнатам чатов
      const userChats = await this.chatService.getUserChats(client.userId);
      for (const chat of userChats) {
        await client.join?.(`chat:${chat.id}`);
      }

      this.logger.log(`User ${client.userId} connected with socket ${client.id}`);

      // Уведомляем пользователя об успешном подключении
      client.emit?.('connected', { userId: client.userId });

    } catch (error) {
      this.logger.error('Authentication failed', error);
      client.disconnect?.();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit?.('error', { message: 'Unauthorized' });
        return;
      }

      // Отправляем сообщение через сервис
      const message = await this.chatService.sendMessage(client.userId, data);

      // Получаем информацию о чате для создания уведомлений
      const chat = await this.chatService.getChatInfo(data.chatId);

      // Определяем, кто находится онлайн в этом чате
      const onlineUsersInChat = this.getOnlineUsersInChat(data.chatId);

      // Находим участников, которые не в чате сейчас (должны получить уведомление)
      const offlineParticipants = chat.participants
        .filter(p => p.userId !== client.userId) // Исключаем отправителя
        .filter(p => !onlineUsersInChat.includes(p.userId)) // Исключаем тех, кто онлайн в чате
        .map(p => p.userId);

      // Создаем уведомления для офлайн пользователей
      if (offlineParticipants.length > 0) {
        try {
          const senderName = message.sender?.name || 'Пользователь';

          await this.notificationsService.addNotification({
            userIds: offlineParticipants,
            type: 'NEW_MESSAGE',
            message: `${senderName}: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}`,
            url: `/chat?chatId=${data.chatId}`,
            createdBy: client.userId,
          });

          this.logger.log(`Created notifications for ${offlineParticipants.length} offline users in chat ${data.chatId}`);
        } catch (notificationError) {
          this.logger.error('Failed to create notifications:', notificationError);
          // Не прерываем отправку сообщения из-за ошибки уведомлений
        }
      }

      // Отправляем сообщение всем участникам чата
      client.to?.(`chat:${data.chatId}`)?.emit?.('newMessage', {
        message,
        chatId: data.chatId,
      });

      // Подтверждаем отправку отправителю
      client.emit?.('messageSent', { message });

      this.logger.log(`Message sent from user ${client.userId} to chat ${data.chatId}`);

    } catch (error) {
      this.logger.error('Error sending message', error);
      client.emit?.('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit?.('error', { message: 'Unauthorized' });
        return;
      }

      // Проверяем, что пользователь является участником чата
      const chat = await this.chatService.getChatInfo(data.chatId);
      const isParticipant = chat.participants.some(p => p.userId === client.userId);

      if (!isParticipant) {
        client.emit?.('error', { message: 'Not a chat participant' });
        return;
      }

      // Присоединяем к комнате чата
      await client.join?.(`chat:${data.chatId}`);

      // Отмечаем сообщения как прочитанные
      await this.chatService.markMessagesAsRead(data.chatId, client.userId);

      client.emit?.('joinedChat', { chatId: data.chatId });

      // Уведомляем других участников, что пользователь онлайн в чате
      client.to?.(`chat:${data.chatId}`)?.emit?.('userJoined', {
        userId: client.userId,
        chatId: data.chatId,
      });

      this.logger.log(`User ${client.userId} joined chat ${data.chatId}`);

    } catch (error) {
      this.logger.error('Error joining chat', error);
      client.emit?.('error', { message: 'Failed to join chat' });
    }
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) return;

      await client.leave?.(`chat:${data.chatId}`);

      // Уведомляем других участников, что пользователь покинул чат
      client.to?.(`chat:${data.chatId}`)?.emit?.('userLeft', {
        userId: client.userId,
        chatId: data.chatId,
      });

      client.emit?.('leftChat', { chatId: data.chatId });

      this.logger.log(`User ${client.userId} left chat ${data.chatId}`);

    } catch (error) {
      this.logger.error('Error leaving chat', error);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { chatId: number; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      this.logger.warn('Typing event from unauthenticated client');
      return;
    }

    this.logger.log(`📝 Typing event received from user ${client.userId}: ${data.isTyping ? 'started' : 'stopped'} typing in chat ${data.chatId}`);

    // Отправляем индикатор печати другим участникам чата
    const eventData = {
      userId: client.userId,
      chatId: data.chatId,
      isTyping: data.isTyping,
    };

    this.logger.log(`📤 Broadcasting userTyping event to chat:${data.chatId}`, eventData);

    client.to?.(`chat:${data.chatId}`)?.emit?.('userTyping', eventData);
  }

  // Метод для отправки уведомлений о новых чатах
  notifyNewChat(chatId: number, participantIds: number[]) {
    for (const userId of participantIds) {
      if (this.connectedUsers.has(userId)) {
        this.server.to(`user:${userId}`).emit('newChat', { chatId });
      }
    }
  }

  // Метод для уведомления об изменениях в чате
  notifyChatUpdate(chatId: number, participantIds: number[], updateData: any) {
    for (const userId of participantIds) {
      if (this.connectedUsers.has(userId)) {
        this.server.to?.(`user:${userId}`)?.emit?.('chatUpdated', {
          chatId,
          ...updateData
        });
      }
    }
  }

  // Проверка, онлайн ли пользователь
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Получение списка онлайн пользователей в чате
  getOnlineUsersInChat(chatId: number): number[] {
    const room = this.server.sockets?.adapter?.rooms?.get(`chat:${chatId}`);
    if (!room) return [];

    const onlineUsers: number[] = [];
    for (const socketId of room) {
      const socket = this.server.sockets?.sockets?.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        onlineUsers.push(socket.userId);
      }
    }
    return onlineUsers;
  }
}
