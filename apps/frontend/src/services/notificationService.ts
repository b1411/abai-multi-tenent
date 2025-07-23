import apiClient from './apiClient';
import type { Notification, PaginatedNotifications } from '../types/notification';

class NotificationService {
  // Получить мои уведомления
  async getMyNotifications(page = 1, limit = 10): Promise<PaginatedNotifications> {
    return await apiClient.get<PaginatedNotifications>(`/notifications/my?page=${page}&limit=${limit}`);
  }

  // Получить количество непрочитанных уведомлений
  async getUnreadCount(): Promise<{ count: number }> {
    return await apiClient.get<{ count: number }>(`/notifications/unread-count/${this.getCurrentUserId()}`);
  }

  // Отметить уведомление как прочитанное
  async markAsRead(notificationId: number): Promise<Notification> {
    return await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
  }

  // Отметить все уведомления как прочитанные
  async markAllAsRead(): Promise<void> {
    await apiClient.patch<void>(`/notifications/read-all/${this.getCurrentUserId()}`);
  }

  // Создать SSE соединение для получения уведомлений в реальном времени
  createNotificationStream(userId: number, token?: string): EventSource {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (token) {
      params.append('token', token);
    }
    
    const url = `${import.meta.env.VITE_API_URL}notifications/stream?${params.toString()}`;
    return new EventSource(url);
  }

  // Получить ID текущего пользователя из localStorage или контекста
  private getCurrentUserId(): number {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    throw new Error('User not found');
  }

  // Создать уведомление (только для админов и учителей)
  async createNotification(data: {
    userId: number;
    type: string;
    message: string;
    url?: string;
  }): Promise<Notification> {
    return await apiClient.post<Notification>('/notifications', data);
  }

  // Создать уведомления для нескольких пользователей
  async createNotifications(data: {
    userIds: number[];
    type: string;
    message: string;
    url?: string;
  }): Promise<Notification[]> {
    return await apiClient.post<Notification[]>('/notifications/add', data);
  }

  // Получить все уведомления (только для админов)
  async getAllNotifications(page = 1, limit = 10, search?: string): Promise<PaginatedNotifications> {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) {
      query.append('search', search);
    }
    return await apiClient.get<PaginatedNotifications>(`/notifications?${query.toString()}`);
  }

  // Удалить уведомление
  async deleteNotification(notificationId: number): Promise<void> {
    await apiClient.delete<void>(`/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
