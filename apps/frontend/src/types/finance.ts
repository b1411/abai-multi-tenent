export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  serviceType: 'tuition' | 'extra' | 'meals' | 'transportation';
  serviceName: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
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

export interface BudgetItem {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  plannedAmount: number;
  actualAmount: number;
  currency: string;
  period: string;
  responsible?: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED';
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BudgetSummary {
  totalPlannedIncome: number;
  totalActualIncome: number;
  totalPlannedExpense: number;
  totalActualExpense: number;
  plannedBalance: number;
  actualBalance: number;
  incomeVariance: number;
  expenseVariance: number;
}

export interface BudgetResponse {
  items: BudgetItem[];
  summary: BudgetSummary;
}

export interface BudgetAnalytics {
  currentPeriod: {
    income: {
      planned: number;
      actual: number;
      variance: number;
      byCategory: Record<string, {
        planned: number;
        actual: number;
        variance: number;
      }>;
    };
    expense: {
      planned: number;
      actual: number;
      variance: number;
      byCategory: Record<string, {
        planned: number;
        actual: number;
        variance: number;
      }>;
    };
    balance: {
      planned: number;
      actual: number;
      variance: number;
    };
  };
}

export type PaymentType = 'TUITION' | 'BOOKS' | 'DORMITORY' | 'MEAL' | 'TRANSPORT' | 'EXAM' | 'CERTIFICATE' | 'OTHER';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'MOBILE';

export interface CreatePaymentDto {
  studentId: number;
  type: string;
  amount: number;
  dueDate: string;
  serviceName?: string;
}

export interface CreateBudgetItemDto {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  plannedAmount: number;
  actualAmount?: number;
  currency?: string;
  period: string;
  responsible?: string;
  status?: 'PENDING' | 'ACTIVE' | 'CLOSED';
  description?: string;
}

export interface PaymentFilters {
  grade?: string;
  serviceType?: string;
  status?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BudgetFilters {
  period?: string;
  type?: string;
  category?: string;
  status?: string;
  responsible?: string;
}

export const SERVICE_TYPE_LABELS = {
  tuition: 'Основное обучение',
  extra: 'Дополнительные занятия',
  meals: 'Питание',
  transportation: 'Транспорт'
} as const;

export const PAYMENT_STATUS_LABELS = {
  paid: 'Оплачено',
  unpaid: 'Не оплачено',
  partial: 'Частично оплачено',
  overdue: 'Просрочено'
} as const;

export const PAYMENT_STATUS_COLORS = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-gray-100 text-gray-800',
  partial: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800'
} as const;

export const BUDGET_TYPE_LABELS = {
  INCOME: 'Доход',
  EXPENSE: 'Расход'
} as const;

export const BUDGET_STATUS_LABELS = {
  PENDING: 'Ожидает',
  ACTIVE: 'Активно',
  CLOSED: 'Закрыто'
} as const;

export const INCOME_CATEGORIES = {
  tuition: 'Оплата за обучение',
  grants: 'Гранты и субсидии',
  donations: 'Пожертвования',
  rentals: 'Аренда помещений',
  services: 'Дополнительные услуги',
  other_income: 'Прочие доходы'
} as const;

export const EXPENSE_CATEGORIES = {
  salaries: 'Зарплаты и компенсации',
  infrastructure: 'Инфраструктура',
  utilities: 'Коммунальные услуги',
  materials: 'Учебные материалы',
  equipment: 'Оборудование',
  events: 'Мероприятия',
  services: 'Услуги сторонних организаций',
  other_expense: 'Прочие расходы'
} as const;

// Reports and Analytics Types
export interface FinancialReport {
  id: string;
  title: string;
  type: 'BUDGET_ANALYSIS' | 'CASHFLOW' | 'PERFORMANCE' | 'FORECAST' | 'VARIANCE';
  period: string;
  generatedAt: string;
  data: any;
}

export interface ReportFilters {
  type?: string;
  period?: string;
  year?: string;
  quarter?: string;
  comparison?: boolean;
}

export interface CashflowData {
  period: string;
  income: number;
  expense: number;
  netFlow: number;
  cumulativeFlow: number;
}

export interface PerformanceMetrics {
  revenueGrowth: number;
  expenseControl: number;
  budgetAccuracy: number;
  collectionRate: number;
  liquidityRatio: number;
  profitMargin: number;
}

export interface ForecastData {
  period: string;
  projected: {
    income: number;
    expense: number;
    balance: number;
  };
  confidence: number;
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export interface VarianceAnalysis {
  category: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
}

export interface BudgetTrend {
  period: string;
  income: number;
  expense: number;
  balance: number;
}
