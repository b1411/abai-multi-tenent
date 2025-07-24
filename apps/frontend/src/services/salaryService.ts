import apiClient from './apiClient';
import { 
  Salary, 
  CreateSalaryDto, 
  SalaryFilter, 
  SalaryStatistics, 
  SalaryPaginatedResponse 
} from '../types/salary';

export const salaryService = {
  // Получить список зарплат с фильтрацией
  async getSalaries(filters?: SalaryFilter): Promise<SalaryPaginatedResponse> {
    const params = new URLSearchParams();
    
    if (filters?.teacherId) params.append('teacherId', filters.teacherId.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return await apiClient.get<SalaryPaginatedResponse>(`/salaries?${params.toString()}`);
  },

  // Получить зарплату по ID
  async getSalary(id: number): Promise<Salary> {
    return await apiClient.get<Salary>(`/salaries/${id}`);
  },

  // Создать новую зарплату
  async createSalary(salaryData: CreateSalaryDto): Promise<Salary> {
    return await apiClient.post<Salary>('/salaries', salaryData);
  },

  // Обновить зарплату
  async updateSalary(id: number, salaryData: Partial<CreateSalaryDto>): Promise<Salary> {
    return await apiClient.patch<Salary>(`/salaries/${id}`, salaryData);
  },

  // Удалить зарплату
  async deleteSalary(id: number): Promise<void> {
    await apiClient.delete(`/salaries/${id}`);
  },

  // Утвердить зарплату
  async approveSalary(id: number): Promise<Salary> {
    return await apiClient.post<Salary>(`/salaries/${id}/approve`);
  },

  // Отметить зарплату как выплаченную
  async markSalaryAsPaid(id: number): Promise<Salary> {
    return await apiClient.post<Salary>(`/salaries/${id}/mark-paid`);
  },

  // Получить статистику по зарплатам
  async getSalaryStatistics(year?: number, month?: number): Promise<SalaryStatistics> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    return await apiClient.get<SalaryStatistics>(`/salaries/statistics?${params.toString()}`);
  },

  // Получить историю зарплат учителя
  async getSalaryHistory(teacherId: number): Promise<Salary[]> {
    return await apiClient.get<Salary[]>(`/salaries/history/${teacherId}`);
  },

  // Экспорт данных зарплат
  async exportSalaries(filters?: SalaryFilter, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.teacherId) params.append('teacherId', filters.teacherId.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    params.append('format', format);

    return await apiClient.getBlob(`/salaries/export?${params.toString()}`);
  },

  // Пересчитать зарплаты
  async recalculateSalaries(filters?: { month?: number; year?: number }): Promise<void> {
    return await apiClient.post('/salaries/recalculate', filters);
  },
};
