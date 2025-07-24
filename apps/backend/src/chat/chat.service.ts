import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(userId: number, createChatDto: CreateChatDto) {
    const { participantIds, name, isGroup = false } = createChatDto;

    // Добавляем создателя в список участников, если его там нет
    const allParticipants = [...new Set([userId, ...participantIds])];

    // Проверяем, что все участники существуют
    const users = await this.prisma.user.findMany({
      where: { id: { in: allParticipants } },
    });

    if (users.length !== allParticipants.length) {
      throw new NotFoundException('Один или несколько пользователей не найдены');
    }

    // Для личного чата проверяем, что участников ровно 2
    if (!isGroup && allParticipants.length !== 2) {
      throw new ForbiddenException('Личный чат должен содержать ровно 2 участника');
    }

    // Для личного чата проверяем, нет ли уже такого чата
    if (!isGroup) {
      const existingChat = await this.prisma.chatRoom.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: allParticipants },
            },
          },
        },
        include: {
          participants: true,
        },
      });

      if (existingChat && existingChat.participants.length === 2) {
        return existingChat;
      }
    }

    // Создаем чат
    const chat = await this.prisma.chatRoom.create({
      data: {
        name,
        isGroup,
        createdBy: userId,
        participants: {
          create: allParticipants.map(participantId => ({
            userId: participantId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    return chat;
  }

  async getUserChats(userId: number) {
    const chats = await this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
        deletedAt: null,
      },
      include: {
        participants: {
          where: {
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return chats.map(chat => ({
      ...chat,
      lastMessage: chat.messages[0] || null,
      unreadCount: chat._count.messages,
      // Для личного чата возвращаем собеседника
      participant: !chat.isGroup 
        ? chat.participants.find(p => p.userId !== userId)?.user 
        : null,
    }));
  }

  async getChatMessages(chatId: number, userId: number, page = 1, limit = 50) {
    // Проверяем, что пользователь является участником чата
    const participation = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participation) {
      throw new ForbiddenException('Вы не являетесь участником этого чата');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        chatId,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.chatMessage.count({
      where: {
        chatId,
        deletedAt: null,
      },
    });

    return {
      data: messages.reverse(), // Возвращаем в хронологическом порядке
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(userId: number, createMessageDto: CreateMessageDto) {
    const { content, receiverId, chatId, replyToId } = createMessageDto;

    let targetChatId = chatId;

    // Если указан receiverId, но не chatId, создаем или находим личный чат
    if (receiverId && !chatId) {
      const existingChat = await this.prisma.chatRoom.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [userId, receiverId] },
            },
          },
        },
        include: {
          participants: true,
        },
      });

      if (existingChat && existingChat.participants.length === 2) {
        targetChatId = existingChat.id;
      } else {
        // Создаем новый личный чат
        const newChat = await this.createChat(userId, {
          participantIds: [receiverId],
          isGroup: false,
        });
        targetChatId = newChat.id;
      }
    }

    if (!targetChatId) {
      throw new ForbiddenException('Необходимо указать получателя или ID чата');
    }

    // Проверяем участие в чате
    const participation = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId: targetChatId,
        userId,
        isActive: true,
      },
    });

    if (!participation) {
      throw new ForbiddenException('Вы не являетесь участником этого чата');
    }

    // Проверяем, что сообщение для ответа существует
    if (replyToId) {
      const replyMessage = await this.prisma.chatMessage.findFirst({
        where: {
          id: replyToId,
          chatId: targetChatId,
          deletedAt: null,
        },
      });

      if (!replyMessage) {
        throw new NotFoundException('Сообщение для ответа не найдено');
      }
    }

    // Создаем сообщение
    const message = await this.prisma.chatMessage.create({
      data: {
        content,
        senderId: userId,
        chatId: targetChatId,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    // Обновляем время последнего обновления чата
    await this.prisma.chatRoom.update({
      where: { id: targetChatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markMessagesAsRead(chatId: number, userId: number) {
    // Проверяем участие в чате
    const participation = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participation) {
      throw new ForbiddenException('Вы не являетесь участником этого чата');
    }

    // Отмечаем все сообщения как прочитанные
    await this.prisma.chatMessage.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Обновляем время последнего прочтения
    await this.prisma.chatParticipant.update({
      where: {
        id: participation.id,
      },
      data: {
        lastRead: new Date(),
      },
    });

    return { success: true };
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои сообщения');
    }

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async editMessage(messageId: number, userId: number, content: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Вы можете редактировать только свои сообщения');
    }

    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    return updatedMessage;
  }

  async getChatInfo(chatId: number) {
    const chat = await this.prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    return chat;
  }
}
