import { API_BASE_URL } from '../utils';

export enum PaymentRecurrence {
  ONCE = 'ONCE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export interface CreateGroupPaymentDto {
  groupId: number;
  type: string;
  amount: number;
  dueDate: string;
  description?: string;
  serviceName?: string;
  excludedStudentIds?: number[];
  studentOverrides?: StudentPaymentOverride[];
  recurrence?: PaymentRecurrence;
  recurrenceCount?: number;
  recurrenceEndDate?: string;
  sendNotifications?: boolean;
}

export interface StudentPaymentOverride {
  studentId: number;
  amount?: number;
  description?: string;
  excluded?: boolean;
}

export interface GroupPaymentResult {
  groupId: number;
  groupName: string;
  totalStudents: number;
  processedStudents: number;
  createdPayments: number;
  errors: Array<{
    studentId: number;
    studentName: string;
    error: string;
  }>;
  payments: Array<{
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
    createdAt: string;
  }>;
}

const API_URL = `${API_BASE_URL}payments`;

export const groupPaymentService = {
  // Создать групповой платеж
  async createGroupPayment(paymentData: CreateGroupPaymentDto): Promise<GroupPaymentResult> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/group`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Не удалось создать групповой платеж');
    }

    return response.json();
  },
};
