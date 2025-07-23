import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportFilterDto, ReportType, GenerateReportDto } from './dto/report-filter.dto';
import {
  FinancialReport,
  CashflowData,
  PerformanceMetrics,
  ForecastData,
  VarianceAnalysis,
  BudgetTrend,
  IncomeStatementData,
  BalanceSheetData
} from './entities/report.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(generateReportDto: GenerateReportDto, userId: string): Promise<FinancialReport> {
    const reportId = uuidv4();
    const startDate = generateReportDto.startDate ? new Date(generateReportDto.startDate) : this.getDefaultStartDate(generateReportDto.period);
    const endDate = generateReportDto.endDate ? new Date(generateReportDto.endDate) : new Date();

    let reportData: any;
    const title = generateReportDto.title || this.getDefaultTitle(generateReportDto.type);

    switch (generateReportDto.type) {
      case ReportType.CASHFLOW:
        reportData = await this.generateCashflowReport(startDate, endDate);
        break;
      case ReportType.PERFORMANCE:
        reportData = await this.generatePerformanceReport(startDate, endDate);
        break;
      case ReportType.FORECAST:
        reportData = await this.generateForecastReport(startDate, endDate);
        break;
      case ReportType.VARIANCE:
        reportData = await this.generateVarianceReport(startDate, endDate);
        break;
      case ReportType.BUDGET_ANALYSIS:
        reportData = await this.generateBudgetAnalysisReport(startDate, endDate);
        break;
      case ReportType.INCOME_STATEMENT:
        reportData = await this.generateIncomeStatementReport(startDate, endDate);
        break;
      case ReportType.BALANCE_SHEET:
        reportData = await this.generateBalanceSheetReport(startDate, endDate);
        break;
      default:
        throw new Error(`Unsupported report type: ${String(generateReportDto.type)}`);
    }

    const report: FinancialReport = {
      id: reportId,
      title,
      type: generateReportDto.type,
      period: this.formatPeriod(startDate, endDate),
      startDate,
      endDate,
      generatedAt: new Date(),
      generatedBy: userId,
      data: reportData,
      format: generateReportDto.format || 'JSON',
      status: 'COMPLETED',
      description: generateReportDto.description,
      tags: this.generateTags(generateReportDto.type, startDate, endDate)
    };

    return report;
  }

  async getCashflowData(startDate: Date, endDate: Date): Promise<CashflowData[]> {
    return await this.generateCashflowReport(startDate, endDate);
  }

  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<PerformanceMetrics> {
    return await this.generatePerformanceReport(startDate, endDate);
  }

  async getForecastData(startDate: Date, months: number = 6): Promise<ForecastData[]> {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return await this.generateForecastReport(startDate, endDate);
  }

  async getVarianceAnalysis(startDate: Date, endDate: Date): Promise<VarianceAnalysis[]> {
    return await this.generateVarianceReport(startDate, endDate);
  }

  async getBudgetTrends(startDate: Date, endDate: Date): Promise<BudgetTrend[]> {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
    });

    // Group by period (month)
    const trends: { [key: string]: BudgetTrend } = {};

    budgetItems.forEach(item => {
      const period = item.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      if (!trends[period]) {
        trends[period] = {
          period,
          income: 0,
          expense: 0,
          balance: 0,
        };
      }

      if (item.type === 'INCOME') {
        trends[period].income += item.actualAmount || item.plannedAmount;
      } else {
        trends[period].expense += item.actualAmount || item.plannedAmount;
      }
    });

    // Calculate balance and convert to array
    return Object.values(trends).map(trend => ({
      ...trend,
      balance: trend.income - trend.expense,
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  private async generateCashflowReport(startDate: Date, endDate: Date): Promise<CashflowData[]> {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by month
    const monthlyData: { [key: string]: CashflowData } = {};
    let cumulativeFlow = 0;

    // Process budget items
    budgetItems.forEach(item => {
      const month = item.createdAt.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = {
          period: month,
          income: 0,
          expense: 0,
          netFlow: 0,
          cumulativeFlow: 0,
        };
      }

      const amount = item.actualAmount || item.plannedAmount;
      if (item.type === 'INCOME') {
        monthlyData[month].income += amount;
      } else {
        monthlyData[month].expense += amount;
      }
    });

    // Process payments
    payments.forEach(payment => {
      const month = payment.createdAt.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = {
          period: month,
          income: 0,
          expense: 0,
          netFlow: 0,
          cumulativeFlow: 0,
        };
      }
      monthlyData[month].income += payment.amount;
    });

    // Calculate net flow and cumulative flow
    return Object.values(monthlyData)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(data => {
        data.netFlow = data.income - data.expense;
        cumulativeFlow += data.netFlow;
        data.cumulativeFlow = cumulativeFlow;
        return data;
      });
  }

  private async generatePerformanceReport(startDate: Date, endDate: Date): Promise<PerformanceMetrics> {
    const currentPeriodBudget = await this.prisma.budgetItem.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });

    const currentPeriodPayments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    const prevEndDate = new Date(endDate);
    prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);

    const previousPeriodPayments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      },
    });

    const currentRevenue = currentPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
    const previousRevenue = previousPeriodPayments.reduce((sum, p) => sum + p.amount, 0);

    const currentExpenses = currentPeriodBudget
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0);

    const plannedIncome = currentPeriodBudget
      .filter(item => item.type === 'INCOME')
      .reduce((sum, item) => sum + item.plannedAmount, 0);

    const actualIncome = currentPeriodBudget
      .filter(item => item.type === 'INCOME')
      .reduce((sum, item) => sum + (item.actualAmount || 0), 0);

    return {
      revenueGrowth: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      expenseControl: currentExpenses > 0 ? (currentRevenue / currentExpenses) * 100 : 100,
      budgetAccuracy: plannedIncome > 0 ? (actualIncome / plannedIncome) * 100 : 0,
      collectionRate: currentRevenue > 0 ? 95 : 0, // Simplified calculation
      liquidityRatio: currentRevenue > currentExpenses ? (currentRevenue / currentExpenses) : 0,
      profitMargin: currentRevenue > 0 ? ((currentRevenue - currentExpenses) / currentRevenue) * 100 : 0,
    };
  }

  private async generateForecastReport(startDate: Date, endDate: Date): Promise<ForecastData[]> {
    // Simple forecast based on historical data
    const historicalData = await this.generateCashflowReport(startDate, endDate);
    const forecasts: ForecastData[] = [];

    const avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / (historicalData.length || 1);
    const avgExpense = historicalData.reduce((sum, d) => sum + d.expense, 0) / (historicalData.length || 1);

    // Generate 6 months forecast
    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(endDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const period = forecastDate.toISOString().substring(0, 7);

      // Simple growth projection
      const growthFactor = 1 + (0.02 * i); // 2% monthly growth
      const projectedIncome = avgIncome * growthFactor;
      const projectedExpense = avgExpense * (1 + (0.01 * i)); // 1% monthly expense growth

      forecasts.push({
        period,
        projected: {
          income: projectedIncome,
          expense: projectedExpense,
          balance: projectedIncome - projectedExpense,
        },
        confidence: Math.max(95 - (i * 10), 60), // Decreasing confidence over time
        scenarios: {
          optimistic: projectedIncome * 1.2,
          realistic: projectedIncome,
          pessimistic: projectedIncome * 0.8,
        },
      });
    }

    return forecasts;
  }

  private async generateVarianceReport(startDate: Date, endDate: Date): Promise<VarianceAnalysis[]> {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });

    const varianceByCategory: { [category: string]: VarianceAnalysis } = {};

    budgetItems.forEach(item => {
      if (!varianceByCategory[item.category]) {
        varianceByCategory[item.category] = {
          category: item.category,
          planned: 0,
          actual: 0,
          variance: 0,
          variancePercent: 0,
          status: 'neutral',
        };
      }

      varianceByCategory[item.category].planned += item.plannedAmount;
      varianceByCategory[item.category].actual += item.actualAmount || 0;
    });

    return Object.values(varianceByCategory).map(analysis => {
      analysis.variance = analysis.actual - analysis.planned;
      analysis.variancePercent = analysis.planned > 0 ? (analysis.variance / analysis.planned) * 100 : 0;
      
      if (analysis.variancePercent > 5) {
        analysis.status = 'unfavorable';
      } else if (analysis.variancePercent < -5) {
        analysis.status = 'favorable';
      } else {
        analysis.status = 'neutral';
      }

      return analysis;
    });
  }

  private async generateBudgetAnalysisReport(startDate: Date, endDate: Date): Promise<any> {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });

    const analysis = {
      totalPlanned: 0,
      totalActual: 0,
      incomeAnalysis: { planned: 0, actual: 0 },
      expenseAnalysis: { planned: 0, actual: 0 },
      categoryBreakdown: {} as any,
    };

    budgetItems.forEach(item => {
      analysis.totalPlanned += item.plannedAmount;
      analysis.totalActual += item.actualAmount || 0;

      if (item.type === 'INCOME') {
        analysis.incomeAnalysis.planned += item.plannedAmount;
        analysis.incomeAnalysis.actual += item.actualAmount || 0;
      } else {
        analysis.expenseAnalysis.planned += item.plannedAmount;
        analysis.expenseAnalysis.actual += item.actualAmount || 0;
      }

      if (!analysis.categoryBreakdown[item.category]) {
        analysis.categoryBreakdown[item.category] = { planned: 0, actual: 0 };
      }
      analysis.categoryBreakdown[item.category].planned += item.plannedAmount;
      analysis.categoryBreakdown[item.category].actual += item.actualAmount || 0;
    });

    return analysis;
  }

  private async generateIncomeStatementReport(startDate: Date, endDate: Date): Promise<IncomeStatementData> {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const revenue = {
      tuition: payments.filter(p => p.serviceType === 'TUITION').reduce((sum, p) => sum + p.amount, 0),
      grants: budgetItems.filter(item => item.type === 'INCOME' && item.category === 'grants').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      donations: budgetItems.filter(item => item.type === 'INCOME' && item.category === 'donations').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      other: budgetItems.filter(item => item.type === 'INCOME' && !['grants', 'donations'].includes(item.category)).reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      total: 0,
    };
    revenue.total = revenue.tuition + revenue.grants + revenue.donations + revenue.other;

    const expenses = {
      salaries: budgetItems.filter(item => item.type === 'EXPENSE' && item.category === 'salaries').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      infrastructure: budgetItems.filter(item => item.type === 'EXPENSE' && item.category === 'infrastructure').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      utilities: budgetItems.filter(item => item.type === 'EXPENSE' && item.category === 'utilities').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      materials: budgetItems.filter(item => item.type === 'EXPENSE' && item.category === 'materials').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      equipment: budgetItems.filter(item => item.type === 'EXPENSE' && item.category === 'equipment').reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      other: budgetItems.filter(item => item.type === 'EXPENSE' && !['salaries', 'infrastructure', 'utilities', 'materials', 'equipment'].includes(item.category)).reduce((sum, item) => sum + (item.actualAmount || item.plannedAmount), 0),
      total: 0,
    };
    expenses.total = expenses.salaries + expenses.infrastructure + expenses.utilities + expenses.materials + expenses.equipment + expenses.other;

    return {
      period: this.formatPeriod(startDate, endDate),
      revenue,
      expenses,
      netIncome: revenue.total - expenses.total,
    };
  }

  private async generateBalanceSheetReport(startDate: Date, endDate: Date): Promise<BalanceSheetData> {
    // Simplified balance sheet - in real implementation, you'd need more complex accounting logic
    const totalRevenue = await this.prisma.payment.aggregate({
      where: {
        createdAt: { lte: endDate },
      },
      _sum: { amount: true },
    });

    const totalExpenses = await this.prisma.budgetItem.aggregate({
      where: {
        type: 'EXPENSE',
        createdAt: { lte: endDate },
        deletedAt: null,
      },
      _sum: { actualAmount: true, plannedAmount: true },
    });

    const cash = (totalRevenue._sum.amount || 0) - ((totalExpenses._sum.actualAmount || totalExpenses._sum.plannedAmount) || 0);
    
    return {
      period: this.formatPeriod(startDate, endDate),
      assets: {
        current: {
          cash: Math.max(cash, 0),
          receivables: 0, // Would need receivables tracking
          inventory: 0,   // Would need inventory tracking
          total: Math.max(cash, 0),
        },
        fixed: {
          equipment: 0,   // Would need asset tracking
          buildings: 0,   // Would need asset tracking
          other: 0,
          total: 0,
        },
        total: Math.max(cash, 0),
      },
      liabilities: {
        current: {
          payables: 0,
          shortTermDebt: 0,
          other: 0,
          total: 0,
        },
        longTerm: {
          loans: 0,
          other: 0,
          total: 0,
        },
        total: 0,
      },
      equity: {
        capital: Math.max(cash, 0), // Simplified
        retainedEarnings: 0,
        total: Math.max(cash, 0),
      },
    };
  }

  private getDefaultStartDate(period?: string): Date {
    const now = new Date();
    switch (period) {
      case 'QUARTERLY':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'YEARLY':
        return new Date(now.getFullYear(), 0, 1);
      case 'MONTHLY':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  private getDefaultTitle(type: ReportType): string {
    const titles = {
      [ReportType.BUDGET_ANALYSIS]: 'Анализ бюджета',
      [ReportType.CASHFLOW]: 'Движение денежных средств',
      [ReportType.PERFORMANCE]: 'Показатели эффективности',
      [ReportType.FORECAST]: 'Финансовый прогноз',
      [ReportType.VARIANCE]: 'Анализ отклонений',
      [ReportType.INCOME_STATEMENT]: 'Отчет о доходах и расходах',
      [ReportType.BALANCE_SHEET]: 'Баланс школы',
    };
    return titles[type] || 'Финансовый отчет';
  }

  private formatPeriod(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('ru-RU');
    const end = endDate.toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
  }

  private generateTags(type: ReportType, startDate: Date, endDate: Date): string[] {
    const tags = [type.toLowerCase().replace('_', '-')];
    
    const year = startDate.getFullYear().toString();
    tags.push(year);
    
    const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
                   'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const month = months[startDate.getMonth()];
    tags.push(month);
    
    return tags;
  }
}
