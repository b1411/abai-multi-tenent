import apiClient from './apiClient';
import {
  StatisticsResponse,
  SubjectsResponse,
  ClassesResponse,
  LowPerformingStudentsResponse,
  HighProgressStudentsResponse,
  TrendsResponse,
  MonthlyData,
  GradeDistribution,
  PerformanceMetric,
  PerformanceFilter,
} from '../types/performance';

export const performanceService = {
  // Получить общую статистику успеваемости
  async getStatistics(filter?: PerformanceFilter): Promise<StatisticsResponse> {
    const url = filter 
      ? `/performance/statistics?${new URLSearchParams(filter as any).toString()}`
      : '/performance/statistics';
    return await apiClient.get<StatisticsResponse>(url);
  },

  // Получить статистику по предметам
  async getSubjects(filter?: PerformanceFilter): Promise<SubjectsResponse> {
    const url = filter 
      ? `/performance/subjects?${new URLSearchParams(filter as any).toString()}`
      : '/performance/subjects';
    return await apiClient.get<SubjectsResponse>(url);
  },

  // Получить статистику по группам
  async getClasses(): Promise<ClassesResponse> {
    return await apiClient.get<ClassesResponse>('/performance/classes');
  },

  // Получить список отстающих студентов
  async getLowPerformingStudents(filter?: PerformanceFilter): Promise<LowPerformingStudentsResponse> {
    const url = filter 
      ? `/performance/students/low-performing?${new URLSearchParams(filter as any).toString()}`
      : '/performance/students/low-performing';
    return await apiClient.get<LowPerformingStudentsResponse>(url);
  },

  // Получить список студентов с высоким прогрессом
  async getHighProgressStudents(filter?: PerformanceFilter): Promise<HighProgressStudentsResponse> {
    const url = filter 
      ? `/performance/students/high-progress?${new URLSearchParams(filter as any).toString()}`
      : '/performance/students/high-progress';
    return await apiClient.get<HighProgressStudentsResponse>(url);
  },

  // Получить тренды успеваемости
  async getTrends(filter?: PerformanceFilter): Promise<TrendsResponse> {
    const url = filter 
      ? `/performance/trends?${new URLSearchParams(filter as any).toString()}`
      : '/performance/trends';
    return await apiClient.get<TrendsResponse>(url);
  },

  // Получить помесячные данные
  async getMonthlyData(filter?: PerformanceFilter): Promise<MonthlyData[]> {
    const url = filter 
      ? `/performance/monthly-data?${new URLSearchParams(filter as any).toString()}`
      : '/performance/monthly-data';
    return await apiClient.get<MonthlyData[]>(url);
  },

  // Получить распределение оценок
  async getGradeDistribution(filter?: PerformanceFilter): Promise<GradeDistribution[]> {
    const url = filter 
      ? `/performance/grade-distribution?${new URLSearchParams(filter as any).toString()}`
      : '/performance/grade-distribution';
    return await apiClient.get<GradeDistribution[]>(url);
  },

  // Получить общие метрики производительности
  async getPerformanceMetrics(filter?: PerformanceFilter): Promise<PerformanceMetric[]> {
    const url = filter 
      ? `/performance/metrics?${new URLSearchParams(filter as any).toString()}`
      : '/performance/metrics';
    return await apiClient.get<PerformanceMetric[]>(url);
  },
};
