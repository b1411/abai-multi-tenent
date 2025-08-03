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

  // Экспорт данных нагрузки
  async exportWorkloads(params?: WorkloadFilterParams, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    searchParams.append('format', format);
    
    return await apiClient.getBlob(`/workload/export?${searchParams.toString()}`);
  },

  // Экспорт шаблона для загрузки
  async downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
    return await apiClient.getBlob(`/workload/template?format=${format}`);
  },

  // Экспорт отчета по конкретному преподавателю
  async exportTeacherWorkload(teacherId: number, academicYear?: string, format: 'xlsx' | 'pdf' = 'xlsx'): Promise<Blob> {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    params.append('format', format);
    
    return await apiClient.getBlob(`/workload/teacher/${teacherId}/export?${params.toString()}`);
  },

  // Пересчет всех отработанных часов
  async recalculateAllWorkedHours(year: number, month: number): Promise<any> {
    return await apiClient.post<any>(`/workload/recalculate-all/${year}/${month}`);
  },

  // Синхронизация часов конкретного преподавателя
  async syncTeacherHours(teacherId: number, year: number, month: number): Promise<any> {
    return await apiClient.post<any>(`/workload/sync-teacher-hours/${teacherId}/${year}/${month}`);
  },

  // Получение статистики в реальном времени
  async getRealTimeStats(params?: WorkloadFilterParams): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return await apiClient.get<any>(`/workload/real-time-stats${queryString}`);
  },

  // Получение всех отработанных часов
  async getAllWorkedHours(month: number, year: number): Promise<any[]> {
    return await apiClient.get<any[]>(`/teachers/worked-hours?month=${month}&year=${year}`);
  },

  // Получение детальной информации об отработанных часах преподавателя
  async getTeacherWorkedHoursDetails(teacherId: number, month: number, year: number): Promise<any> {
    return await apiClient.get<any>(`/teachers/${teacherId}/worked-hours/details?month=${month}&year=${year}`);
  },

  // Пересчет отработанных часов всех преподавателей (новый метод для WorkloadV2)
  async recalculateAllWorkedHours2(year: number, month: number): Promise<any> {
    return await apiClient.post<any>('/workload/recalculate-all', { year, month });
  },

  // Синхронизация часов конкретного преподавателя (новый метод для WorkloadV2)
  async syncTeacherWorkedHours(teacherId: number, year: number, month: number): Promise<any> {
    return await apiClient.post<any>('/workload/sync-teacher-hours', { teacherId, year, month });
  },
};
