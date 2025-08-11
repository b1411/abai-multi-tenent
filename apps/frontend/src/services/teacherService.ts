import apiClient from './apiClient';
import type { Teacher, CreateTeacherDto, UpdateTeacherDto, TeacherWorkload, TeacherStatistics, TeacherFilters } from '../types/teacher';
import type { Schedule } from '../types/teacher';

export const teacherService = {
  // Получить всех преподавателей
  async getTeachers(): Promise<Teacher[]> {
    return await apiClient.get<Teacher[]>('/teachers');
  },

  // Получить преподавателя по ID
  async getTeacher(id: number): Promise<Teacher> {
    return await apiClient.get<Teacher>(`/teachers/${id}`);
  },

  // Создать нового преподавателя
  async createTeacher(teacherData: CreateTeacherDto): Promise<Teacher> {
    return await apiClient.post<Teacher>('/teachers', teacherData);
  },

  // Обновить преподавателя
  async updateTeacher(id: number, teacherData: UpdateTeacherDto): Promise<Teacher> {
    return await apiClient.patch<Teacher>(`/teachers/${id}`, teacherData);
  },

  // Удалить преподавателя
  async deleteTeacher(id: number): Promise<void> {
    await apiClient.delete(`/teachers/${id}`);
  },

  // Поиск преподавателей
  async searchTeachers(query: string): Promise<Teacher[]> {
    return await apiClient.get<Teacher[]>(`/teachers/search?q=${query}`);
  },

  // Получить нагрузку преподавателя
  async getTeacherWorkload(id: number): Promise<TeacherWorkload> {
    return await apiClient.get<TeacherWorkload>(`/teachers/${id}/workload`);
  },

  // Получить расписание преподавателя
  async getTeacherSchedule(id: number): Promise<Schedule[]> {
    return await apiClient.get<Schedule[]>(`/teachers/${id}/schedule`);
  },

  // Получить статистику по преподавателям
  async getTeacherStatistics(): Promise<TeacherStatistics> {
    return await apiClient.get<TeacherStatistics>('/teachers/statistics');
  },

  // Получить преподавателя по пользователю
  async getTeacherByUser(userId: number): Promise<Teacher | null> {
    try {
      // Предпочитаемый эндпоинт, если он реализован на бэкенде
      return await apiClient.get<Teacher>(`/teachers/by-user/${userId}`);
    } catch (error) {
      // Фолбэк: получаем всех преподавателей и фильтруем по user.id
      try {
        const list = await apiClient.get<any[]>('/teachers');
        const found = list.find(t => t?.user?.id === userId) || null;
        return found;
      } catch {
        return null;
      }
    }
  },

  // Фильтрация преподавателей
  async filterTeachers(filters: TeacherFilters): Promise<Teacher[]> {
    const params = new URLSearchParams();
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.employmentType && filters.employmentType !== 'all') {
      params.append('employmentType', filters.employmentType);
    }
    if (filters.subject) {
      params.append('subject', filters.subject);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    return await apiClient.get<Teacher[]>(`/teachers?${params.toString()}`);
  },

  // Экспорт данных преподавателей
  async exportTeachers(format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
    return await apiClient.getBlob(`/teachers/export?format=${format}`);
  },

  // Получить доступных пользователей для создания преподавателя
  async getAvailableUsers(): Promise<Array<{
    id: number;
    name: string;
    surname: string;
    email: string;
    middlename?: string;
  }>> {
    return await apiClient.get<Array<{
      id: number;
      name: string;
      surname: string;
      email: string;
      middlename?: string;
    }>>(`/users?role=TEACHER&available=true`);
  },

  // Изменить тип занятости преподавателя
  async changeEmploymentType(id: number, newType: 'STAFF' | 'PART_TIME'): Promise<Teacher> {
    return await apiClient.patch<Teacher>(`/teachers/${id}`, { 
      employmentType: newType 
    });
  }
};
