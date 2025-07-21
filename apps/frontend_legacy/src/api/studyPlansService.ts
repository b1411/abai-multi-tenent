import apiClient from './client';
import { ContentType } from './Api';
import authService from './authService';

// Типы данных
export interface StudyPlan {
  id: number;
  name: string;
  description: string | null;
  teacherId: number;
  normativeWorkload: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  teacher?: {
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
  lessons?: Array<{
    id: number;
    name: string;
    description?: string;
    date: string;
    materials?: {
      id: number;
      lecture?: string;
      videoUrl?: string;
      presentationUrl?: string;
      quiz?: {
        id: number;
        name: string;
        isActive: boolean;
      };
    };
    homework?: {
      id: number;
      name: string;
      deadline: string;
    };
  }>;
  schedules?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    classroom?: {
      id: number;
      name: string;
      building: string;
    };
  }>;
  _count?: {
    lessons: number;
  };
}

export interface StudyPlanFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  teacherId?: number;
  groupId?: number;
}

export interface CreateStudyPlanDto {
  name: string;
  description?: string | null;
  teacherId: number;
  normativeWorkload?: number | null;
}

export interface UpdateStudyPlanDto {
  name?: string;
  description?: string | null;
  teacherId?: number;
  normativeWorkload?: number | null;
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

// Сервис для работы с учебными планами
export const studyPlansService = {
  // Получить все учебные планы
  async getAll(filters: StudyPlanFilter = {}): Promise<PaginatedResponse<StudyPlan>> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      // Очищаем пустые значения и преобразуем в правильные типы
      const cleanFilters: Record<string, any> = {};
      
      if (filters.page && filters.page > 0) cleanFilters.page = filters.page;
      if (filters.limit && filters.limit > 0) cleanFilters.limit = filters.limit;
      if (filters.sortBy) cleanFilters.sortBy = filters.sortBy;
      if (filters.order) cleanFilters.order = filters.order;
      if (filters.search && filters.search.trim()) cleanFilters.search = filters.search.trim();
      if (filters.teacherId && filters.teacherId > 0) cleanFilters.teacherId = filters.teacherId;
      if (filters.groupId && filters.groupId > 0) cleanFilters.groupId = filters.groupId;

      const response = await apiClient.request({
        path: '/study-plans',
        method: 'GET',
        secure: true,
        query: cleanFilters,
        format: 'json'
      });

      return response.data as PaginatedResponse<StudyPlan>;
    } catch (error) {
      console.error('Error fetching study plans:', error);
      throw error;
    }
  },

  // Получить учебный план по ID
  async getById(id: number): Promise<StudyPlan> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/study-plans/${id}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });

      return response.data as StudyPlan;
    } catch (error) {
      console.error(`Error fetching study plan ${id}:`, error);
      throw error;
    }
  },

  // Создать новый учебный план
  async create(data: CreateStudyPlanDto): Promise<StudyPlan> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: '/study-plans',
        method: 'POST',
        secure: true,
        body: data,
        type: ContentType.Json,
        format: 'json'
      });

      return response.data as StudyPlan;
    } catch (error) {
      console.error('Error creating study plan:', error);
      throw error;
    }
  },

  // Обновить учебный план
  async update(id: number, data: UpdateStudyPlanDto): Promise<StudyPlan> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/study-plans/${id}`,
        method: 'PATCH',
        secure: true,
        body: data,
        type: ContentType.Json,
        format: 'json'
      });

      return response.data as StudyPlan;
    } catch (error) {
      console.error(`Error updating study plan ${id}:`, error);
      throw error;
    }
  },

  // Удалить учебный план
  async delete(id: number): Promise<StudyPlan> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      apiClient.setSecurityData(token);

      const response = await apiClient.request({
        path: `/study-plans/${id}`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });

      return response.data as StudyPlan;
    } catch (error) {
      console.error(`Error deleting study plan ${id}:`, error);
      throw error;
    }
  }
};

export default studyPlansService;
