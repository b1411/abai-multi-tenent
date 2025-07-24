import apiClient from './apiClient';

export interface User {
  id: number;
  name: string;
  surname: string;
  avatar?: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  chatId: number;
  replyToId?: number;
  isRead: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  sender: User;
  replyTo?: ChatMessage;
}

export interface ChatRoom {
  id: number;
  name?: string;
  isGroup: boolean;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  participants: {
    id: number;
    userId: number;
    user: User;
  }[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface CreateChatDto {
  participantIds: number[];
  name?: string;
  isGroup?: boolean;
}

export interface CreateMessageDto {
  content: string;
  chatId?: number;
  receiverId?: number;
  replyToId?: number;
}

export interface UpdateMessageDto {
  content: string;
}

export interface PaginatedMessages {
  data: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ChatService {
  // Получить список чатов пользователя
  async getChats(): Promise<ChatRoom[]> {
    return apiClient.get<ChatRoom[]>('/chat');
  }

  // Создать новый чат
  async createChat(chatData: CreateChatDto): Promise<ChatRoom> {
    return apiClient.post<ChatRoom>('/chat', chatData);
  }

  // Получить сообщения чата с пагинацией
  async getChatMessages(
    chatId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    return apiClient.get<PaginatedMessages>(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  // Отправить сообщение
  async sendMessage(messageData: CreateMessageDto): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>('/chat/messages', messageData);
  }

  // Редактировать сообщение
  async updateMessage(messageId: number, messageData: UpdateMessageDto): Promise<ChatMessage> {
    return apiClient.put<ChatMessage>(`/chat/messages/${messageId}`, messageData);
  }

  // Удалить сообщение
  async deleteMessage(messageId: number): Promise<void> {
    await apiClient.delete(`/chat/messages/${messageId}`);
  }

  // Отметить сообщения как прочитанные
  async markChatAsRead(chatId: number): Promise<void> {
    await apiClient.put(`/chat/${chatId}/read`);
  }

  // Найти или создать личный чат с пользователем
  async getOrCreateDirectChat(userId: number): Promise<ChatRoom> {
    // Создаем новый личный чат
    return this.createChat({
      participantIds: [userId],
      isGroup: false
    });
  }

  // Получить информацию о чате
  async getChatInfo(chatId: number): Promise<ChatRoom> {
    return apiClient.get<ChatRoom>(`/chat/${chatId}`);
  }

  // Поиск пользователей для добавления в чат
  async searchUsers(query: string): Promise<User[]> {
    return apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // Получить последние сообщения для всех чатов
  async getRecentChats(): Promise<ChatRoom[]> {
    const chats = await this.getChats();
    return chats.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  // Форматирование времени сообщения
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      // Сегодня - показываем время
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      // Вчера
      return 'Вчера';
    } else if (date.getFullYear() === now.getFullYear()) {
      // Этот год - показываем дату без года
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short' 
      });
    } else {
      // Другой год - полная дата
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  }

  // Получить имя чата для отображения
  getChatDisplayName(chat: ChatRoom, currentUserId: number): string {
    if (chat.isGroup && chat.name) {
      return chat.name;
    }

    if (!chat.isGroup) {
      // Для личного чата показываем имя собеседника
      const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
      if (otherParticipant) {
        return `${otherParticipant.user.name} ${otherParticipant.user.surname}`;
      }
    }

    // Fallback для групповых чатов без названия
    const participantNames = chat.participants
      .filter(p => p.userId !== currentUserId)
      .map(p => p.user.name)
      .slice(0, 3);

    return participantNames.length > 0 
      ? participantNames.join(', ') + (chat.participants.length > 4 ? '...' : '')
      : 'Групповой чат';
  }

  // Получить аватар чата
  getChatAvatar(chat: ChatRoom, currentUserId: number): string | undefined {
    if (!chat.isGroup) {
      const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
      return otherParticipant?.user.avatar;
    }
    return undefined; // Для групповых чатов можно добавить логику группового аватара
  }
}

export const chatService = new ChatService();
