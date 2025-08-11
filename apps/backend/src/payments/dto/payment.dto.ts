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
