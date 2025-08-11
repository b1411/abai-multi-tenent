import apiClient from './apiClient';
import { 
  Lesson, 
  CreateLessonRequest, 
  UpdateLessonRequest, 
  LessonFilters,
  LessonListResponse 
} from '../types/lesson';

export class LessonService {
  async getLessons(filters: LessonFilters = {}): Promise<LessonListResponse> {
    const params = new URLSearchParams();
    
    if (filters.studyPlanId) params.append('studyPlanId', filters.studyPlanId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<{ data: Lesson[]; meta: any }>(`/lessons?${params.toString()}`);
    
    // Преобразуем формат ответа с meta в pagination
    return {
      data: response.data,
      pagination: {
        page: response.meta.currentPage,
        limit: response.meta.itemsPerPage,
        total: response.meta.totalItems,
        totalPages: response.meta.totalPages
      }
    };
  }

  async getMyLessons(filters: LessonFilters = {}): Promise<LessonListResponse> {
    const params = new URLSearchParams();
    
    if (filters.studyPlanId) params.append('studyPlanId', filters.studyPlanId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<{ data: Lesson[]; meta: any }>(`/lessons/me?${params.toString()}`);
    
    // Преобразуем формат ответа с meta в pagination
    return {
      data: response.data,
      pagination: {
        page: response.meta.currentPage,
        limit: response.meta.itemsPerPage,
        total: response.meta.totalItems,
        totalPages: response.meta.totalPages
      }
    };
  }

  async getLessonsByStudyPlan(studyPlanId: number): Promise<Lesson[]> {
    return await apiClient.get<Lesson[]>(`/lessons/by-study-plan/${studyPlanId}`);
  }

  async getLesson(id: number): Promise<Lesson> {
    return await apiClient.get<Lesson>(`/lessons/${id}`);
  }

  async createLesson(data: CreateLessonRequest): Promise<Lesson> {
    return await apiClient.post<Lesson>('/lessons', data);
  }

  async updateLesson(id: number, data: UpdateLessonRequest): Promise<Lesson> {
    return await apiClient.patch<Lesson>(`/lessons/${id}`, data);
  }

  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/lessons/${id}`);
  }
}

export const lessonService = new LessonService();
