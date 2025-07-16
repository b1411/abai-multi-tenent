import apiClient from './client';
import { ContentType } from './Api';
import authService from './authService';

// Типы данных
export interface Lesson {
  id: number;
  name: string;
  description: string | null;
  date: string;
  studyPlanId: number;
  homeworkId: number | null;
  materialsId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  studyPlan?: {
    id: number;
    name: string;
    teacher: {
      id: number;
      user: {
        id: number;
        name: string;
        surname: string;
        email: string;
        middlename?: string;
        phone?: string;
      };
    };
    group?: Array<{
      id: number;
      name: string;
      courseNumber: number;
    }>;
  };
  materials?: {
    id: number;
    lecture?: string;
    videoUrl?: string;
    presentationUrl?: string;
    quiz?: {
      id: number;
      name: string;
      isActive: boolean;
      maxScore?: number;
      duration?: number;
    };
    additionalFiles?: Array<{
      id: number;
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
  homework?: {
    id: number;
    name: string;
    deadline: string;
    additionalFiles?: Array<{
      id: number;
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
}

export interface LessonFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  studyPlanId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateLessonDto {
  name: string;
  description?: string | null;
  date: string;
  studyPlanId: number;
  homeworkId?: number | null;
  materialsId?: number | null;
}

export interface UpdateLessonDto {
  name?: string;
  description?: string | null;
  date?: string;
  studyPlanId?: number;
  homeworkId?: number | null;
  materialsId?: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// Функция для получения токена
const getAuthToken = (): string | null => {
  return authService.getToken();
};

// Сервис для работы с уроками
export const lessonsService = {
  // Получить все уроки
  async getAll(filters: LessonFilter = {}): Promise<PaginatedResponse<Lesson>> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      // Очищаем пустые значения
      const cleanFilters: Record<string, any> = {};
      
      if (filters.page && filters.page > 0) cleanFilters.page = filters.page;
      if (filters.limit && filters.limit > 0) cleanFilters.limit = filters.limit;
      if (filters.sortBy) cleanFilters.sortBy = filters.sortBy;
      if (filters.order) cleanFilters.order = filters.order;
      if (filters.search && filters.search.trim()) cleanFilters.search = filters.search.trim();
      if (filters.studyPlanId && filters.studyPlanId > 0) cleanFilters.studyPlanId = filters.studyPlanId;
      if (filters.dateFrom) cleanFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) cleanFilters.dateTo = filters.dateTo;

      const response = await apiClient.request({
        path: '/lessons',
        method: 'GET',
        secure: true,
        query: cleanFilters,
        format: 'json'
      });

      return response.data as PaginatedResponse<Lesson>;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  },

  // Получить уроки по учебному плану
  async getByStudyPlan(studyPlanId: number): Promise<Lesson[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/lessons/by-study-plan/${studyPlanId}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });

      return response.data as Lesson[];
    } catch (error) {
      console.error(`Error fetching lessons for study plan ${studyPlanId}:`, error);
      throw error;
    }
  },

  // Получить урок по ID
  async getById(id: number): Promise<Lesson> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/lessons/${id}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });

      return response.data as Lesson;
    } catch (error) {
      console.error(`Error fetching lesson ${id}:`, error);
      throw error;
    }
  },

  // Создать новый урок
  async create(data: CreateLessonDto): Promise<Lesson> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: '/lessons',
        method: 'POST',
        secure: true,
        body: data,
        type: ContentType.Json,
        format: 'json'
      });

      return response.data as Lesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  // Обновить урок
  async update(id: number, data: UpdateLessonDto): Promise<Lesson> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/lessons/${id}`,
        method: 'PATCH',
        secure: true,
        body: data,
        type: ContentType.Json,
        format: 'json'
      });

      return response.data as Lesson;
    } catch (error) {
      console.error(`Error updating lesson ${id}:`, error);
      throw error;
    }
  },

  // Удалить урок
  async delete(id: number): Promise<Lesson> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/lessons/${id}`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });

      return response.data as Lesson;
    } catch (error) {
      console.error(`Error deleting lesson ${id}:`, error);
      throw error;
    }
  }
};

export default lessonsService;
