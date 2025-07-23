export interface ReportData {
  [key: string]: any;
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

export interface IncomeStatementData {
  period: string;
  revenue: {
    tuition: number;
    grants: number;
    donations: number;
    other: number;
    total: number;
  };
  expenses: {
    salaries: number;
    infrastructure: number;
    utilities: number;
    materials: number;
    equipment: number;
    other: number;
    total: number;
  };
  netIncome: number;
}

export interface BalanceSheetData {
  period: string;
  assets: {
    current: {
      cash: number;
      receivables: number;
      inventory: number;
      total: number;
    };
    fixed: {
      equipment: number;
      buildings: number;
      other: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      payables: number;
      shortTermDebt: number;
      other: number;
      total: number;
    };
    longTerm: {
      loans: number;
      other: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
}

export class FinancialReport {
  id: string;
  title: string;
  type: string;
  period: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  generatedBy: string;
  data: ReportData;
  format: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  description?: string;
  tags: string[];
}
