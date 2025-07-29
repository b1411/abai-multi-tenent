import apiClient from './apiClient';

export interface Parent {
  id: number;
  userId: number;
  relation?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    name: string;
    surname: string;
    middlename?: string;
    phone?: string;
    avatar?: string;
    role: string;
  };
}

export interface Student {
  id: number;
  userId: number;
  groupId: number;
  user: {
    id: number;
    email: string;
    name: string;
    surname: string;
    middlename?: string;
    phone?: string;
    avatar?: string;
    role: string;
  };
  group: {
    id: number;
    name: string;
    courseNumber: number;
  };
}

export interface ChatSetupResult {
  chatId: number;
  type: 'teacher' | 'admin';
  teacher?: {
    id: number;
    name: string;
    surname: string;
    email: string;
    avatar?: string;
  };
  admin?: {
    id: number;
    name: string;
    surname: string;
    email: string;
    avatar?: string;
    role: string;
  };
  student?: {
    id: number;
    name: string;
    surname: string;
  };
}

export const parentService = {
  // Получить детей текущего родителя
  async getMyChildren(): Promise<Student[]> {
    return await apiClient.get<Student[]>('/parents/me/children');
  },

  // Настроить чаты для текущего родителя
  async setupMyChats(): Promise<ChatSetupResult[]> {
    return await apiClient.post<ChatSetupResult[]>('/parents/me/setup-chats');
  },

  // Обновить чаты для текущего родителя
  async refreshMyChats(): Promise<ChatSetupResult[]> {
    return await apiClient.post<ChatSetupResult[]>('/parents/me/refresh-chats');
  },

  // Получить информацию о родителе по ID пользователя
  async getParentByUserId(userId: number): Promise<Parent> {
    return await apiClient.get<Parent>(`/parents/user/${userId}`);
  },

  // Получить детей родителя по ID
  async getParentChildren(parentId: number): Promise<Student[]> {
    return await apiClient.get<Student[]>(`/parents/${parentId}/children`);
  },

  // Настроить чаты для родителя (только для админов)
  async setupParentChats(userId: number): Promise<ChatSetupResult[]> {
    return await apiClient.post<ChatSetupResult[]>(`/parents/${userId}/setup-chats`);
  },
};
