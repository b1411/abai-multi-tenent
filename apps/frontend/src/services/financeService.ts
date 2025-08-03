import apiClient from './apiClient';
import {
  Payment,
  PaymentResponse,
  PaymentFilters,
  CreatePaymentDto,
  BudgetItem,
  BudgetResponse,
  BudgetFilters,
  CreateBudgetItemDto,
  BudgetAnalytics
} from '../types/finance';

class FinanceService {
  // Получить список всех отчетов
  async getReports(): Promise<any[]> {
    try {
      const response = await apiClient.get('/reports/list');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Ошибка получения списка отчетов:', error);
      return [];
    }
  }

  // Получить отчет по типу
  async getReportByType(type: string, filters?: any): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      return await apiClient.get(`/reports/${type}?${params.toString()}`);
    } catch (error) {
      console.error(`Ошибка получения отчета ${type}:`, error);
      throw error;
    }
  }

  // Получить аналитику нагрузок
  async getWorkloadAnalytics(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return await apiClient.get(`/reports/workload/analytics?${params.toString()}`);
    } catch (error) {
      console.error('Ошибка получения аналитики нагрузок:', error);
      throw error;
    }
  }

  // Получить аналитику расписания
  async getScheduleAnalytics(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return await apiClient.get(`/reports/schedule/analytics?${params.toString()}`);
    } catch (error) {
      console.error('Ошибка получения аналитики расписания:', error);
      throw error;
    }
  }

  // Получить количество активных студентов
  async getActiveStudentsCount(): Promise<number> {
    try {
      const response = await apiClient.get('/students/count/active') as { count: number };
      return response.count || 0;
    } catch (error) {
      console.error('Ошибка получения количества активных студентов:', error);
      return 0;
    }
  }
  // Платежи
  async getPayments(filters?: PaymentFilters): Promise<PaymentResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    return await apiClient.get(`/payments?${params.toString()}`);
  }

  async getPayment(id: string): Promise<Payment> {
    return await apiClient.get(`/payments/${id}`);
  }

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    return await apiClient.post('/payments', data);
  }

  async updatePayment(id: string, data: Partial<CreatePaymentDto>): Promise<Payment> {
    return await apiClient.patch(`/payments/${id}`, data);
  }

  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(`/payments/${id}`);
  }

  async processPayment(id: string, data: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    comment?: string;
  }): Promise<Payment> {
    return await apiClient.post(`/payments/${id}/pay`, data);
  }

  async sendPaymentReminder(id: string, data: {
    method: 'email' | 'sms' | 'push';
    message?: string;
  }): Promise<void> {
    await apiClient.post(`/payments/${id}/remind`, data);
  }

  async generateInvoice(id: string, options: {
    type?: 'payment' | 'debt' | 'summary';
    format?: 'pdf' | 'html';
    startDate?: string;
    endDate?: string;
    notes?: string;
    includeQrCode?: boolean;
  } = {}): Promise<Blob> {
    const data: any = {
      type: options.type || 'payment',
      format: options.format || 'pdf',
      notes: options.notes,
      includeQrCode: options.includeQrCode !== false
    };

    // Даты нужны только для сводных квитанций
    if (options.type === 'summary') {
      data.startDate = options.startDate;
      data.endDate = options.endDate;
    }

    return await apiClient.postBlob(`/payments/${id}/invoice`, data);
  }

  async generateSummaryInvoice(studentId: string, options: {
    type?: 'payment' | 'debt' | 'summary';
    format?: 'pdf' | 'html';
    startDate?: string;
    endDate?: string;
    notes?: string;
    includeQrCode?: boolean;
  } = {}): Promise<Blob> {
    return await apiClient.postBlob(`/payments/student/${studentId}/summary-invoice`, {
      type: options.type || 'summary',
      format: options.format || 'pdf',
      startDate: options.startDate,
      endDate: options.endDate,
      notes: options.notes,
      includeQrCode: options.includeQrCode !== false
    });
  }

  // Бюджет
  async getBudgetItems(filters?: BudgetFilters): Promise<BudgetResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    return await apiClient.get(`/budget?${params.toString()}`);
  }

  async getBudgetItem(id: number): Promise<BudgetItem> {
    return await apiClient.get(`/budget/${id}`);
  }

  async createBudgetItem(data: CreateBudgetItemDto): Promise<BudgetItem> {
    return await apiClient.post('/budget', data);
  }

  async updateBudgetItem(id: number, data: Partial<CreateBudgetItemDto>): Promise<BudgetItem> {
    return await apiClient.patch(`/budget/${id}`, data);
  }

  async deleteBudgetItem(id: number): Promise<void> {
    await apiClient.delete(`/budget/${id}`);
  }

  async getBudgetAnalytics(period: string): Promise<BudgetAnalytics> {
    return await apiClient.get(`/budget/analytics/${period}`);
  }

  async closeBudgetPeriod(period: string, notes?: string): Promise<void> {
    await apiClient.post(`/budget/periods/${period}/close`, { notes });
  }

  // Аналитика и отчеты
  async getPaymentAnalytics(period: string): Promise<any> {
    return await apiClient.get(`/payments/analytics/summary?period=${period}`);
  }

  async exportPayments(filters?: PaymentFilters, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    params.append('format', format);

    return await apiClient.getBlob(`/payments/export?${params.toString()}`);
  }

  async exportBudget(period: string, format: 'xlsx' | 'pdf' | 'csv' = 'xlsx'): Promise<Blob> {
    return await apiClient.getBlob(`/budget/export?period=${period}&format=${format}`);
  }

  // Reports and Forecasting
  async getFinancialReport(type: string, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return await apiClient.get(`/reports/${type}?${params.toString()}`);
  }

  async getCashflowData(queryParams: string): Promise<any> {
    return await apiClient.get(`/reports/cashflow?${queryParams}`);
  }

  async getPerformanceMetrics(queryParams: string): Promise<any> {
    return await apiClient.get(`/reports/performance?${queryParams}`);
  }

  async getForecastData(period: string, months: number = 6): Promise<any> {
    return await apiClient.get(`/reports/forecast?period=${period}&months=${months}`);
  }

  async getVarianceAnalysis(period: string): Promise<any> {
    return await apiClient.get(`/reports/variance?period=${period}`);
  }

  async getBudgetTrends(startPeriod: string, endPeriod: string): Promise<any> {
    return await apiClient.get(`/reports/trends?start=${startPeriod}&end=${endPeriod}`);
  }

  async generateReport(type: string, data: any, format: 'PDF' | 'XLSX' | 'CSV' | 'JSON' = 'PDF'): Promise<any> {
    return await apiClient.post('/reports/generate', {
      type,
      startDate: data.startDate,
      endDate: data.endDate,
      title: data.title,
      format
    });
  }

  // Скачивание отчета
  async downloadReport(reportId: string, format: 'pdf' | 'xlsx' = 'pdf'): Promise<Blob> {
    return await apiClient.getBlob(`/reports/download/${reportId}?format=${format}`);
  }

  // Экспорт отчета по типу
  async exportReportByType(
    type: string, 
    format: 'pdf' | 'xlsx' = 'pdf',
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return await apiClient.getBlob(`/reports/export/${type}?${params.toString()}`);
  }
}

export const financeService = new FinanceService();
