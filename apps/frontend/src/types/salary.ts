export enum SalaryStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum BonusType {
  PERFORMANCE = 'PERFORMANCE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  OVERTIME = 'OVERTIME',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER',
}

export interface SalaryBonus {
  id: number;
  type: BonusType;
  name: string;
  amount: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryDeduction {
  id: number;
  name: string;
  amount: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Salary {
  id: number;
  teacherId: number;
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      middlename?: string;
      email: string;
    };
  };
  baseSalary: number;
  bonuses: SalaryBonus[];
  deductions: SalaryDeduction[];
  totalGross: number;
  totalNet: number;
  month: number;
  year: number;
  status: SalaryStatus;
  approvedBy?: number;
  approvedAt?: string;
  paidAt?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryDto {
  teacherId: number;
  baseSalary: number;
  bonuses?: {
    type: BonusType;
    name: string;
    amount: number;
    comment?: string;
  }[];
  deductions?: {
    name: string;
    amount: number;
    comment?: string;
  }[];
  month: number;
  year: number;
  comment?: string;
}

export interface SalaryFilter {
  teacherId?: number;
  status?: SalaryStatus;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface SalaryStatistics {
  totalPayroll: number;
  avgSalary: number;
  employeeCount: number;
  statusStats: {
    status: SalaryStatus;
    count: number;
    total: number;
  }[];
}

export interface SalaryPaginatedResponse {
  data: Salary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
