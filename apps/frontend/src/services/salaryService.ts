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

  // Пересчитать зарплаты через новую систему
  async recalculateSalaries(filters?: { month?: number; year?: number }): Promise<any> {
    return await apiClient.post('/payroll/recalculate', filters);
  },

  // Получить сводку по зарплатам
  async getPayrollSummary(month: number, year: number): Promise<any> {
    return await apiClient.get(`/payroll/summary/${year}/${month}`);
  },

  // Получить детали расчета зарплаты конкретного преподавателя
  async getPayrollDetails(teacherId: number, month: number, year: number): Promise<any> {
    return await apiClient.get(`/payroll/details/${teacherId}/${year}/${month}`);
  },

  // Управление ставками преподавателей
  async getTeacherSalaryRate(teacherId: number): Promise<any> {
    return await apiClient.get(`/teachers/${teacherId}/salary-rate`);
  },

  async createTeacherSalaryRate(teacherId: number, rateData: any): Promise<any> {
    return await apiClient.post(`/teachers/${teacherId}/salary-rate`, rateData);
  },

  async updateTeacherSalaryRate(rateId: number, rateData: any): Promise<any> {
    return await apiClient.patch(`/teachers/salary-rate/${rateId}`, rateData);
  },

  // Отработанные часы
  async getWorkedHours(teacherId: number, month: number, year: number): Promise<any> {
    return await apiClient.get(`/teachers/${teacherId}/worked-hours/${year}/${month}`);
  },

  async calculateWorkedHours(teacherId: number, month: number, year: number): Promise<any> {
    return await apiClient.post(`/teachers/${teacherId}/calculate-worked-hours/${year}/${month}`);
  },

  async getWorkedHoursDetails(teacherId: number, month: number, year: number): Promise<any> {
    return await apiClient.get(`/teachers/${teacherId}/worked-hours-details/${year}/${month}`);
  },

  // Система замещений
  async getAvailableTeachers(date: string, startTime: string, endTime: string, excludeTeacherId?: number): Promise<any> {
    const params = new URLSearchParams({
      date,
      startTime,
      endTime,
    });
    if (excludeTeacherId) {
      params.append('excludeTeacherId', excludeTeacherId.toString());
    }
    return await apiClient.get(`/substitutions/available-teachers?${params.toString()}`);
  },

  async createSubstitution(substitutionData: any): Promise<any> {
    return await apiClient.post('/substitutions', substitutionData);
  },

  async removeSubstitution(scheduleId: string): Promise<any> {
    return await apiClient.delete(`/substitutions/${scheduleId}`);
  },

  async getSubstitutions(filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.teacherId) params.append('teacherId', filters.teacherId.toString());
    if (filters?.substituteId) params.append('substituteId', filters.substituteId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    return await apiClient.get(`/substitutions?${params.toString()}`);
  },

  // Workflow управления зарплатами
  async getPendingApprovals(): Promise<any> {
    return await apiClient.get('/salaries/pending-approvals');
  },

  async getApprovedSalaries(filters?: { month?: number; year?: number }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    return await apiClient.get(`/salaries/approved?${params.toString()}`);
  },

  async getSalaryWorkflow(salaryId: number): Promise<any> {
    return await apiClient.get(`/salaries/${salaryId}/workflow`);
  },

  async editSalaryAdjustments(salaryId: number, adjustments: any): Promise<any> {
    return await apiClient.patch(`/salaries/${salaryId}/adjustments`, adjustments);
  },

  async rejectSalary(salaryId: number, reason: string): Promise<any> {
    return await apiClient.post(`/salaries/${salaryId}/reject`, { reason });
  },
};
