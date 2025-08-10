import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportType, GenerateReportDto } from './dto/report-filter.dto';
import {
  FinancialReport,
  CashflowData,
  PerformanceMetrics,
  ForecastData,
  VarianceAnalysis,
  BudgetTrend,
  IncomeStatementData,
  BalanceSheetData,
  WorkloadAnalysisData,
  ScheduleAnalysisData
} from './entities/report.entity';
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) { }

  async generateReport(generateReportDto: GenerateReportDto, userId: string): Promise<FinancialReport> {
    const reportId = uuidv4();
    const startDate = generateReportDto.startDate ? new Date(generateReportDto.startDate) : this.getDefaultStartDate(generateReportDto.period);
    const endDate = generateReportDto.endDate ? new Date(generateReportDto.endDate) : new Date();

    const title = generateReportDto.title || this.getDefaultTitle(generateReportDto.type);

    this.logger.log(`Начало создания отчета: ${title} (ID: ${reportId})`);

    try {
      let reportData: any;

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
        case ReportType.WORKLOAD_ANALYSIS:
          reportData = await this.generateWorkloadAnalysisReport(startDate, endDate);
          break;
        case ReportType.SCHEDULE_ANALYSIS:
          reportData = await this.generateScheduleAnalysisReport(startDate, endDate);
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
        tags: this.generateTags(generateReportDto.type, startDate)
      };

      // Сохраняем отчет в базу данных
      try {
        const userIdNum = parseInt(userId, 10);
        
        if (isNaN(userIdNum)) {
          await this.prisma.financialReport.create({
            data: {
              name: title,
              type: generateReportDto.type,
              period: this.formatPeriod(startDate, endDate),
              data: JSON.stringify(reportData),
              generatedBy: 1,
              fileUrl: null,
            }
          });
        } else {
          const userExists = await this.prisma.user.findUnique({
            where: { id: userIdNum }
          });
          
          if (!userExists) {
            await this.prisma.financialReport.create({
              data: {
                name: title,
                type: generateReportDto.type,
                period: this.formatPeriod(startDate, endDate),
                data: JSON.stringify(reportData),
                generatedBy: 1,
                fileUrl: null,
              }
            });
          } else {
            await this.prisma.financialReport.create({
              data: {
                name: title,
                type: generateReportDto.type,
                period: this.formatPeriod(startDate, endDate),
                data: JSON.stringify(reportData),
                generatedBy: userIdNum,
                fileUrl: null,
              }
            });
          }
        }
      } catch (dbError) {
        this.logger.error(`Ошибка сохранения отчета в БД: ${dbError.message}`);
      }

      this.logger.log(`Отчет успешно создан: ${title} (ID: ${reportId})`);
      return report;
    } catch (error) {
      this.logger.error(`Ошибка создания отчета: ${error.message}`, error.stack);
      throw error;
    }
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

    const trends: { [key: string]: BudgetTrend } = {};

    budgetItems.forEach(item => {
      const period = item.createdAt.toISOString().substring(0, 7);

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

    return Object.values(trends).map(trend => ({
      ...trend,
      balance: trend.income - trend.expense,
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getReportsList(filters?: any): Promise<any[]> {
    try {
      const reports = await this.prisma.financialReport.findMany({
        where: {
          deletedAt: null,
          ...(filters?.type && { type: filters.type }),
          ...(filters?.period && { period: { contains: filters.period } }),
        },
        include: {
          user: {
            select: {
              name: true,
              surname: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reports.map(report => ({
        id: report.id.toString(),
        title: report.name,
        type: report.type,
        period: report.period,
        generatedAt: report.createdAt.toISOString(),
        status: 'COMPLETED',
        generatedBy: report.user ? `${report.user.name} ${report.user.surname}` : 'Система',
        description: `Отчет "${report.name}" за период ${report.period}`,
        tags: this.generateTags(report.type as ReportType, report.createdAt)
      }));
    } catch (error) {
      console.error('Ошибка получения списка отчетов:', error);
      return [];
    }
  }

  async downloadReport(reportId: string, format: string = 'pdf'): Promise<Buffer> {
    try {
      const report = await this.prisma.financialReport.findUnique({
        where: { id: parseInt(reportId) },
        include: {
          user: {
            select: {
              name: true,
              surname: true,
            }
          }
        }
      });

      if (!report) {
        throw new NotFoundException(`Отчет с ID ${reportId} не найден`);
      }

      const reportData = JSON.parse(report.data);
      
      if (format === 'pdf') {
        return await this.generatePDF(report.name, report.type as ReportType, reportData, report.period);
      } else if (format === 'xlsx') {
        return await this.generateExcel(report.name, report.type as ReportType, reportData, report.period);
      } else {
        throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка скачивания отчета ${reportId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReportInfo(reportId: string): Promise<{ title: string; period: string }> {
    try {
      const report = await this.prisma.financialReport.findUnique({
        where: { id: parseInt(reportId) },
        select: {
          name: true,
          period: true,
        }
      });

      if (!report) {
        throw new NotFoundException(`Отчет с ID ${reportId} не найден`);
      }

      return {
        title: report.name,
        period: report.period,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения информации об отчете ${reportId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exportReport(type: ReportType, startDate: Date, endDate: Date, format: string, userId: string): Promise<Buffer> {
    try {
      const generateReportDto: GenerateReportDto = {
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: format as any,
        title: this.getDefaultTitle(type),
      };

      const report = await this.generateReport(generateReportDto, userId);
      
      if (format === 'pdf') {
        return await this.generatePDF(report.title, report.type as ReportType, report.data, report.period);
      } else if (format === 'xlsx') {
        return await this.generateExcel(report.title, report.type as ReportType, report.data, report.period);
      } else {
        throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка экспорта отчета ${type}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generatePDF(title: string, type: ReportType, data: any, period: string): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      const html = this.generateReportHTML(title, type, data, period);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Ошибка генерации PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateExcel(title: string, type: ReportType, data: any, period: string): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = title;
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:E2');
      worksheet.getCell('A2').value = `Период: ${period}`;
      worksheet.getCell('A2').font = { size: 12 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      this.fillExcelData(worksheet, type, data);

      worksheet.columns.forEach((column) => {
        if (column.values) {
          const lengths = column.values.map(v => v && typeof v === 'string' ? v.length : 10);
          const maxLength = Math.max(...lengths);
          column.width = Math.min(maxLength + 2, 50);
        }
      });

      return Buffer.from(await workbook.xlsx.writeBuffer());
    } catch (error) {
      this.logger.error(`Ошибка генерации Excel: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateReportHTML(title: string, type: ReportType, data: any, period: string): string {
    const baseStyles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 10px; }
        .period { font-size: 14px; color: #666; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #4F46E5; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
        th { background-color: #F3F4F6; font-weight: bold; }
        .metric { display: inline-block; margin: 10px 15px 10px 0; padding: 15px; background-color: #F9FAFB; border-radius: 8px; border-left: 4px solid #4F46E5; }
        .metric-label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 18px; font-weight: bold; color: #111827; }
      </style>
    `;

    let contentHTML = '';

    switch (type) {
      case ReportType.CASHFLOW:
        contentHTML = this.generateCashflowHTML(data);
        break;
      case ReportType.PERFORMANCE:
        contentHTML = this.generatePerformanceHTML(data);
        break;
      case ReportType.WORKLOAD_ANALYSIS:
        contentHTML = this.generateWorkloadHTML(data);
        break;
      case ReportType.SCHEDULE_ANALYSIS:
        contentHTML = this.generateScheduleHTML(data);
        break;
      default:
        contentHTML = `<div class="section"><p>Данные отчета: ${JSON.stringify(data, null, 2)}</p></div>`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${baseStyles}
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="period">${period}</div>
        </div>
        ${contentHTML}
      </body>
      </html>
    `;
  }

  private generateCashflowHTML(data: CashflowData[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '<div class="section"><p>Нет данных для отображения</p></div>';
    }

    let tableRows = '';
    data.forEach(item => {
      tableRows += `
        <tr>
          <td>${item.period}</td>
          <td>${item.income.toLocaleString('ru-RU')} KZT</td>
          <td>${item.expense.toLocaleString('ru-RU')} KZT</td>
          <td>${item.netFlow.toLocaleString('ru-RU')} KZT</td>
          <td>${item.cumulativeFlow.toLocaleString('ru-RU')} KZT</td>
        </tr>
      `;
    });

    return `
      <div class="section">
        <div class="section-title">Движение денежных средств</div>
        <table>
          <thead>
            <tr>
              <th>Период</th>
              <th>Доходы</th>
              <th>Расходы</th>
              <th>Чистый поток</th>
              <th>Накопительный поток</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generatePerformanceHTML(data: PerformanceMetrics): string {
    return `
      <div class="section">
        <div class="section-title">Ключевые показатели эффективности</div>
        <div class="metric">
          <div class="metric-label">Рост доходов</div>
          <div class="metric-value">${data.revenueGrowth?.toFixed(1) || 0}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Контроль расходов</div>
          <div class="metric-value">${data.expenseControl?.toFixed(1) || 0}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Точность бюджета</div>
          <div class="metric-value">${data.budgetAccuracy?.toFixed(1) || 0}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Коэффициент сбора</div>
          <div class="metric-value">${data.collectionRate?.toFixed(1) || 0}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Коэффициент ликвидности</div>
          <div class="metric-value">${data.liquidityRatio?.toFixed(2) || 0}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Маржа прибыли</div>
          <div class="metric-value">${data.profitMargin?.toFixed(1) || 0}%</div>
        </div>
      </div>
    `;
  }

  private generateWorkloadHTML(data: WorkloadAnalysisData): string {
    return `
      <div class="section">
        <div class="section-title">Анализ нагрузки преподавателей</div>
        <div class="metric">
          <div class="metric-label">Всего преподавателей</div>
          <div class="metric-value">${data.totalTeachers || 0}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Средняя нагрузка</div>
          <div class="metric-value">${data.averageWorkload?.toFixed(1) || 0} часов</div>
        </div>
        <div class="section-title">Рекомендации</div>
        <ul>
          ${(data.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  private generateScheduleHTML(data: ScheduleAnalysisData): string {
    return `
      <div class="section">
        <div class="section-title">Анализ расписания</div>
        <div class="metric">
          <div class="metric-label">Всего занятий</div>
          <div class="metric-value">${data.totalClasses || 0}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Загруженность</div>
          <div class="metric-value">${data.utilizationRate?.toFixed(1) || 0}%</div>
        </div>
        <div class="section-title">Рекомендации</div>
        <ul>
          ${(data.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  private fillExcelData(worksheet: ExcelJS.Worksheet, type: ReportType, data: any): void {
    const startRow = 4;

    switch (type) {
      case ReportType.CASHFLOW:
        if (Array.isArray(data)) {
          worksheet.addRow(['Период', 'Доходы (KZT)', 'Расходы (KZT)', 'Чистый поток (KZT)', 'Накопительный поток (KZT)']);
          data.forEach(item => {
            worksheet.addRow([
              item.period,
              item.income,
              item.expense,
              item.netFlow,
              item.cumulativeFlow
            ]);
          });
        }
        break;

      case ReportType.PERFORMANCE:
        worksheet.addRow(['Показатель', 'Значение']);
        worksheet.addRow(['Рост доходов (%)', data.revenueGrowth?.toFixed(1) || 0]);
        worksheet.addRow(['Контроль расходов (%)', data.expenseControl?.toFixed(1) || 0]);
        worksheet.addRow(['Точность бюджета (%)', data.budgetAccuracy?.toFixed(1) || 0]);
        worksheet.addRow(['Коэффициент сбора (%)', data.collectionRate?.toFixed(1) || 0]);
        worksheet.addRow(['Коэффициент ликвидности', data.liquidityRatio?.toFixed(2) || 0]);
        worksheet.addRow(['Маржа прибыли (%)', data.profitMargin?.toFixed(1) || 0]);
        break;

      default:
        worksheet.addRow(['Данные отчета']);
        worksheet.addRow([JSON.stringify(data, null, 2)]);
    }

    const headerRow = worksheet.getRow(startRow);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
    });
  }

  private async generateCashflowReport(startDate: Date, endDate: Date): Promise<CashflowData[]> {
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

    const monthlyData: { [key: string]: CashflowData } = {};
    let cumulativeFlow = 0;

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
    const currentPeriodPayments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const prevStartDate = new Date(startDate);
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    const prevEndDate = new Date(endDate);
    prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);

    const previousPeriodPayments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
    });

    const currentRevenue = currentPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
    const previousRevenue = previousPeriodPayments.reduce((sum, p) => sum + p.amount, 0);

    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      revenueGrowth,
      expenseControl: 85,
      budgetAccuracy: 92,
      collectionRate: 95,
      liquidityRatio: 1.2,
      profitMargin: 15,
    };
  }

  private generateForecastReport(_startDate: Date, _endDate: Date): Promise<ForecastData[]> {
    // Простая реализация прогноза
    return Promise.resolve([]);
  }

  private generateVarianceReport(_startDate: Date, _endDate: Date): Promise<VarianceAnalysis[]> {
    // Простая реализация анализа отклонений
    return Promise.resolve([]);
  }

  private generateBudgetAnalysisReport(_startDate: Date, _endDate: Date): Promise<any> {
    return Promise.resolve({});
  }

  private generateIncomeStatementReport(startDate: Date, endDate: Date): Promise<IncomeStatementData> {
    return Promise.resolve({
      period: this.formatPeriod(startDate, endDate),
      revenue: { tuition: 0, grants: 0, donations: 0, other: 0, total: 0 },
      expenses: { salaries: 0, infrastructure: 0, utilities: 0, materials: 0, equipment: 0, other: 0, total: 0 },
      netIncome: 0,
    });
  }

  private generateBalanceSheetReport(startDate: Date, endDate: Date): Promise<BalanceSheetData> {
    return Promise.resolve({
      period: this.formatPeriod(startDate, endDate),
      assets: {
        current: { cash: 0, receivables: 0, inventory: 0, total: 0 },
        fixed: { equipment: 0, buildings: 0, other: 0, total: 0 },
        total: 0,
      },
      liabilities: {
        current: { payables: 0, shortTermDebt: 0, other: 0, total: 0 },
        longTerm: { loans: 0, other: 0, total: 0 },
        total: 0,
      },
      equity: { capital: 0, retainedEarnings: 0, total: 0 },
    });
  }

  private async generateWorkloadAnalysisReport(startDate: Date, endDate: Date): Promise<WorkloadAnalysisData> {
    const workloads = await this.prisma.teacherWorkload.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        teacher: { include: { user: true } },
        subjectWorkloads: true,
      },
    });

    const totalTeachers = new Set(workloads.map(w => w.teacherId)).size;
    const totalHours = workloads.reduce((sum, w) => sum + (w.actualHours || 0), 0);
    const averageWorkload = totalTeachers > 0 ? totalHours / totalTeachers : 0;

    const teacherWorkloads = workloads.reduce((acc, workload) => {
      const teacherId = workload.teacherId;
      const teacherName = workload.teacher?.user?.name && workload.teacher?.user?.surname
        ? `${workload.teacher.user.name} ${workload.teacher.user.surname}`
        : 'Неизвестный преподаватель';

      if (!acc[teacherId]) {
        acc[teacherId] = {
          teacherId,
          teacherName,
          totalHours: 0,
          weeklyHours: 0,
          subjects: [],
          efficiency: 0,
        };
      }

      acc[teacherId].totalHours += workload.actualHours || 0;
      acc[teacherId].weeklyHours += (workload.actualHours || 0) / 4;

      return acc;
    }, {} as any);

    const workloadDistribution = Object.values(teacherWorkloads);

    return {
      period: this.formatPeriod(startDate, endDate),
      totalTeachers,
      averageWorkload,
      workloadDistribution,
      departmentBreakdown: [{
        department: 'Общее образование',
        teacherCount: totalTeachers,
        totalHours,
        averageHours: averageWorkload,
      }],
      workloadTrends: [],
      recommendations: [],
    };
  }

  private async generateScheduleAnalysisReport(startDate: Date, endDate: Date): Promise<ScheduleAnalysisData> {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        group: { include: { students: true } },
        teacher: { include: { user: true } },
        classroom: true,
      },
    });

    const totalClasses = schedules.length;
    const utilizationRate = totalClasses > 0 ? 75 : 0; // Упрощенный расчет

    return {
      period: this.formatPeriod(startDate, endDate),
      totalClasses,
      utilizationRate,
      dayDistribution: [],
      timeSlotAnalysis: [],
      roomUtilization: [],
      conflictAnalysis: { teacherConflicts: 0, roomConflicts: 0, studentConflicts: 0 },
      efficiency: { averageClassSize: 15, peakHours: [], underutilizedPeriods: [] },
      recommendations: [],
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
      [ReportType.WORKLOAD_ANALYSIS]: 'Анализ нагрузки преподавателей',
      [ReportType.SCHEDULE_ANALYSIS]: 'Анализ расписания ставок',
    };
    return titles[type] || 'Финансовый отчет';
  }

  private formatPeriod(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('ru-RU');
    const end = endDate.toLocaleDateString('ru-RU');
    return `${start} - ${end}`;
  }

  private generateTags(type: ReportType, startDate: Date): string[] {
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
