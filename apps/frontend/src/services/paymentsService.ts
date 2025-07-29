import apiClient from './apiClient';

export interface InvoiceOptions {
  type?: 'payment' | 'debt' | 'summary';
  format?: 'pdf' | 'html';
  startDate?: string;
  endDate?: string;
  notes?: string;
  includeQrCode?: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  paymentDate?: string;
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  overdueCount: number;
  paidCount: number;
  collectionRate: number;
}

export interface PaymentResponse {
  payments: Payment[];
  total: number;
  summary: PaymentSummary;
}

export interface PaymentFilters {
  studentId?: string;
  grade?: string;
  serviceType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreatePaymentDto {
  studentId: number;
  type: string;
  amount: number;
  dueDate: string;
  serviceName?: string;
}

class PaymentsService {
  // Получение списка платежей
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

  // Получение конкретного платежа
  async getPayment(id: string): Promise<Payment> {
    return await apiClient.get(`/payments/${id}`);
  }

  // Создание нового платежа
  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    return await apiClient.post('/payments', data);
  }

  // Обновление платежа
  async updatePayment(id: string, data: Partial<CreatePaymentDto>): Promise<Payment> {
    return await apiClient.patch(`/payments/${id}`, data);
  }

  // Удаление платежа
  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(`/payments/${id}`);
  }

  // Обработка платежа (подтверждение оплаты)
  async processPayment(id: string, data: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    comment?: string;
  }): Promise<Payment> {
    return await apiClient.post(`/payments/${id}/pay`, data);
  }

  // Отправка напоминания об оплате
  async sendPaymentReminder(id: string, data: {
    method: 'email' | 'sms' | 'push';
    message?: string;
  }): Promise<void> {
    await apiClient.post(`/payments/${id}/remind`, data);
  }

  // Генерация квитанции для конкретного платежа
  async generateInvoice(id: string, options: InvoiceOptions = {}): Promise<Blob> {
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

  // Генерация сводной квитанции для студента
  async generateSummaryInvoice(studentId: string, options: InvoiceOptions = {}): Promise<Blob> {
    return await apiClient.postBlob(`/payments/student/${studentId}/summary-invoice`, {
      type: options.type || 'summary',
      format: options.format || 'pdf',
      startDate: options.startDate,
      endDate: options.endDate,
      notes: options.notes,
      includeQrCode: options.includeQrCode !== false
    });
  }

  // Получение статистики по платежам
  async getPaymentSummary(): Promise<PaymentSummary> {
    return await apiClient.get('/payments/summary');
  }

  // Экспорт платежей
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

  // Получение аналитики по платежам
  async getPaymentAnalytics(period: string): Promise<any> {
    return await apiClient.get(`/payments/analytics/summary?period=${period}`);
  }

  // Массовая обработка платежей
  async bulkProcessPayments(paymentIds: string[], action: 'approve' | 'reject' | 'remind'): Promise<void> {
    return await apiClient.post('/payments/bulk', {
      paymentIds,
      action
    });
  }

  // Получение истории платежей студента
  async getStudentPaymentHistory(studentId: string): Promise<Payment[]> {
    return await apiClient.get(`/payments/student/${studentId}/history`);
  }

  // Получение просроченных платежей
  async getOverduePayments(): Promise<Payment[]> {
    return await apiClient.get('/payments/overdue');
  }

  // Получение платежей, требующих внимания
  async getPaymentsRequiringAttention(): Promise<Payment[]> {
    return await apiClient.get('/payments/attention');
  }

  // Настройка автоматических напоминаний
  async configureAutoReminders(config: {
    enabled: boolean;
    daysBefore: number;
    methods: ('email' | 'sms' | 'push')[];
  }): Promise<void> {
    return await apiClient.post('/payments/auto-reminders/config', config);
  }

  // Получение шаблонов для напоминаний
  async getReminderTemplates(): Promise<any[]> {
    return await apiClient.get('/payments/reminder-templates');
  }

  // Создание пользовательского шаблона напоминания
  async createReminderTemplate(template: {
    name: string;
    subject: string;
    content: string;
    type: 'email' | 'sms' | 'push';
  }): Promise<any> {
    return await apiClient.post('/payments/reminder-templates', template);
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
