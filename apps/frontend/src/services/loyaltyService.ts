import apiClient from './apiClient';
import {
  StudentReview,
  CreateReviewRequest,
  LoyaltyFilter,
  LoyaltyAnalytics,
  LoyaltyTrends,
  TeacherAnalytics,
  GroupAnalytics,
  LoyaltySummary,
  ReviewsResponse,
  ReviewReaction
} from '../types/loyalty';

class LoyaltyService {
  // Создание отзыва
  async createReview(reviewData: CreateReviewRequest): Promise<StudentReview> {
    return await apiClient.post<StudentReview>('/loyalty/reviews', reviewData);
  }

  // Получение списка отзывов с фильтрацией и пагинацией
  async getReviews(filter: LoyaltyFilter = {}): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<ReviewsResponse>(`/loyalty/reviews?${params.toString()}`);
  }

  // Получение отдельного отзыва
  async getReview(id: number): Promise<StudentReview> {
    return await apiClient.get<StudentReview>(`/loyalty/reviews/${id}`);
  }

  // Добавление реакции на отзыв
  async addReaction(reviewId: number, type: 'like' | 'helpful'): Promise<ReviewReaction> {
    return await apiClient.post<ReviewReaction>(`/loyalty/reviews/${reviewId}/reactions`, { type });
  }

  // Получение общей аналитики лояльности
  async getAnalytics(filter: LoyaltyFilter = {}): Promise<LoyaltyAnalytics> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<LoyaltyAnalytics>(`/loyalty/analytics?${params.toString()}`);
  }

  // Получение трендов лояльности
  async getTrends(filter: LoyaltyFilter = {}): Promise<LoyaltyTrends[]> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<LoyaltyTrends[]>(`/loyalty/analytics/trends?${params.toString()}`);
  }

  // Получение аналитики по учителю
  async getTeacherAnalytics(teacherId: number, filter: LoyaltyFilter = {}): Promise<TeacherAnalytics> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<TeacherAnalytics>(`/loyalty/analytics/teacher/${teacherId}?${params.toString()}`);
  }

  // Получение аналитики по группе
  async getGroupAnalytics(groupId: number, filter: LoyaltyFilter = {}): Promise<GroupAnalytics> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<GroupAnalytics>(`/loyalty/analytics/group/${groupId}?${params.toString()}`);
  }

  // Получение общего резюме
  async getSummary(filter: LoyaltyFilter = {}): Promise<LoyaltySummary> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<LoyaltySummary>(`/loyalty/analytics/summary?${params.toString()}`);
  }

  // Вспомогательные методы для форматирования
  formatRating(rating: number): string {
    return `${rating}/5`;
  }

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Отлично';
    if (rating >= 3.5) return 'Хорошо';
    if (rating >= 2.5) return 'Удовлетворительно';
    if (rating >= 1.5) return 'Плохо';
    return 'Очень плохо';
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    if (rating >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  }

  formatTeacherName(teacher: { user: { name: string; surname: string } }): string {
    return `${teacher.user.name} ${teacher.user.surname}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Получение аналитики повторных покупок
  async getRepeatPurchaseAnalytics(filter: LoyaltyFilter = {}): Promise<any> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiClient.get<any>(`/loyalty/analytics/repeat-purchases?${params.toString()}`);
  }

  // Обновление записей повторных покупок
  async updateRepeatPurchases(): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/loyalty/repeat-purchases/update', {});
  }

  getDefaultFilter(): LoyaltyFilter {
    return {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
  }
}

export const loyaltyService = new LoyaltyService();
