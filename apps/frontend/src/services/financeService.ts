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
  async getReports(): Promise<any[]> {
    // Получить отчеты по типу PERFORMANCE (или другой тип, если нужен весь список)
    const response = await apiClient.get('/reports/PERFORMANCE');
    // Если ответ не массив, возвращаем пустой массив
    if (!Array.isArray(response)) return [];
    return response;
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

  async generateInvoice(id: string, format: 'pdf' | 'docx' = 'pdf'): Promise<Blob> {
    return await apiClient.getBlob(`/payments/${id}/invoice?format=${format}`);
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

  async generateReport(type: string, filters: any, format: 'pdf' | 'xlsx' = 'pdf'): Promise<Blob> {
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, filters, format })
    });
    return await response.blob();
  }
}

export const financeService = new FinanceService();
