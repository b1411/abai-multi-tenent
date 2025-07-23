import apiClient from './apiClient';
import type { PaginateResponseDto } from '../types/api';
import type {
  TeacherWorkload,
  CreateWorkloadData,
  UpdateWorkloadData,
  WorkloadFilterParams,
  WorkloadAnalytics,
  AddDailyHoursData,
} from '../types/workload';

export const workloadService = {
  // Получить список нагрузок с фильтрацией и пагинацией
  async getWorkloads(params?: WorkloadFilterParams): Promise<PaginateResponseDto<TeacherWorkload>> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return await apiClient.get<PaginateResponseDto<TeacherWorkload>>(`/workload${queryString}`);
  },

  // Получить нагрузку по ID
  async getWorkloadById(id: number): Promise<TeacherWorkload> {
    return await apiClient.get<TeacherWorkload>(`/workload/${id}`);
  },

  // Получить нагрузки конкретного преподавателя
  async getWorkloadsByTeacher(teacherId: number, academicYear?: string): Promise<TeacherWorkload[]> {
    const queryString = academicYear ? `?academicYear=${academicYear}` : '';
    return await apiClient.get<TeacherWorkload[]>(`/workload/teacher/${teacherId}${queryString}`);
  },

  // Создать новую нагрузку
  async createWorkload(data: CreateWorkloadData): Promise<TeacherWorkload> {
    return await apiClient.post<TeacherWorkload>('/workload', data);
  },

  // Обновить нагрузку
  async updateWorkload(id: number, data: UpdateWorkloadData): Promise<TeacherWorkload> {
    return await apiClient.patch<TeacherWorkload>(`/workload/${id}`, data);
  },

  // Удалить нагрузку
  async deleteWorkload(id: number): Promise<void> {
    await apiClient.delete<void>(`/workload/${id}`);
  },

  // Добавить ежедневные часы
  async addDailyHours(workloadId: number, data: AddDailyHoursData): Promise<any> {
    return await apiClient.post<any>(`/workload/${workloadId}/daily-hours`, data);
  },

  // Получить аналитику
  async getAnalytics(params?: WorkloadFilterParams): Promise<WorkloadAnalytics> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return await apiClient.get<WorkloadAnalytics>(`/workload/analytics${queryString}`);
  },

  // Экспорт данных (заглушка для будущей реализации)
  async exportWorkloads(params?: WorkloadFilterParams): Promise<Blob> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return await apiClient.getBlob(`/workload/export${queryString}`);
  },
};
