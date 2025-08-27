import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getCurrentAcademicQuarterRange } from '../common/academic-period.util';
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
import * as fs from 'fs';
import * as path from 'path';
import { SystemService } from '../system/system.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService, private systemService: SystemService) { }

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

  private logoCache?: string;
  private fontCache: Record<string, string> = {};

  private readFileBase64(filePath: string): string | undefined {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString('base64');
      }
    } catch (e) {
      this.logger.warn(`Не удалось прочитать файл ${filePath}: ${(e as Error).message}`);
    }
    return undefined;
  }

  private getAssetsRoot(): string {
    // Пути к фронтенд ассетам (шрифты / лого)
    return path.resolve(process.cwd(), 'apps', 'frontend', 'public');
  }

  private getLogoBase64(): string | undefined {
    if (this.logoCache) return this.logoCache;
    const root = this.getAssetsRoot();
    const file = path.join(root, 'logo rfm.png');
    const data = this.readFileBase64(file);
    if (data) this.logoCache = data;
    return data;
  }

  private async fetchImageAsBase64(url: string): Promise<string | undefined> {
    try {
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const buffer = Buffer.from(await res.arrayBuffer());
      return buffer.toString('base64');
    } catch {
      return undefined;
    }
  }

  private async getBrandLogoBase64(): Promise<string | undefined> {
    if (this.logoCache) return this.logoCache;
    try {
      const branding = await this.systemService.getBrandingSettings();
      if (branding?.logo) {
        const remote = await this.fetchImageAsBase64(branding.logo);
        if (remote) {
          this.logoCache = remote;
          return remote;
        }
      }
    } catch {
      // игнорируем и используем дефолт
    }
    return this.getLogoBase64();
  }

  private getFontBase64(fontFile: string): string | undefined {
    if (this.fontCache[fontFile]) return this.fontCache[fontFile];
    const root = this.getAssetsRoot();
    const file = path.join(root, 'fonts', fontFile);
    const data = this.readFileBase64(file);
    if (data) this.fontCache[fontFile] = data;
    return data;
  }

  private buildFontFaceCSS(): string {
    const noto = this.getFontBase64('NotoSans-Regular.ttf');
    const dejavu = this.getFontBase64('DejaVuSans.ttf');

    const faces: string[] = [];
    if (noto) {
      faces.push(`
        @font-face {
          font-family: 'NotoSans';
          src: url(data:font/ttf;base64,${noto}) format('truetype');
          font-weight: 400;
          font-style: normal;
        }
      `);
    }
    if (dejavu) {
      faces.push(`
        @font-face {
          font-family: 'DejaVuSans';
          src: url(data:font/ttf;base64,${dejavu}) format('truetype');
          font-weight: 400;
          font-style: normal;
        }
      `);
    }
    return faces.join('\n');
  }

  private async generatePDF(title: string, type: ReportType, data: any, period: string): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      const logo = await this.getBrandLogoBase64();
      const branding = await this.systemService.getBrandingSettings();
      const html = this.generateReportHTML(
        title,
        type,
        data,
        period,
        logo,
        this.buildFontFaceCSS(),
        branding
      );

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size:8px; font-family:'NotoSans','DejaVuSans',Arial,sans-serif; width:100%; padding:4px 32px; color:#6B7280; text-align:right;">
            ${title}
          </div>`,
        footerTemplate: `
          <div style="font-size:8px; font-family:'NotoSans','DejaVuSans',Arial,sans-serif; width:100%; padding:4px 32px; color:#6B7280; display:flex; justify-content:space-between;">
            <span>Период: ${period}</span>
            <span class="pageNumber"></span>/<span class="totalPages"></span>
          </div>`,
        margin: {
          top: '30mm',
          right: '18mm',
          bottom: '18mm',
          left: '18mm'
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

  private generateReportHTML(
    title: string,
    type: ReportType,
    data: any,
    period: string,
    logoBase64?: string,
    fontFacesCSS: string = '',
    branding?: { schoolName?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string }
  ): string {
    const baseStyles = `
      <style>
        ${fontFacesCSS}
        :root {
          --color-primary:${branding?.primaryColor || '#2563EB'};
          --color-primary-dark:${branding?.accentColor || branding?.primaryColor || '#1D4ED8'};
          --color-border:#E5E7EB;
          --color-bg:#FFFFFF;
          --color-bg-alt:#F9FAFB;
          --color-text:#111827;
          --color-text-muted:#6B7280;
        }
        * { box-sizing:border-box; }
        body {
          font-family: 'NotoSans','DejaVuSans',Arial,sans-serif;
          margin:0;
          padding:0 0 16px 0;
          color: var(--color-text);
          background: #FFFFFF;
          -webkit-font-smoothing: antialiased;
        }
        .page {
          padding:24px 24px 8px 24px;
        }
        .header {
          display:flex;
          align-items:center;
          gap:20px;
          margin-bottom:28px;
          padding-bottom:18px;
          border-bottom:3px solid var(--color-primary);
        }
        .brand {
          display:flex;
          align-items:center;
          gap:14px;
        }
        .brand img {
          height:56px;
          width:auto;
          object-fit:contain;
        }
        .title-block {
          flex:1;
        }
        .org-name {
          font-size:12px;
          letter-spacing:1px;
          font-weight:600;
          text-transform:uppercase;
          color: var(--color-primary-dark);
          margin-bottom:4px;
        }
        .title {
          font-size:24px;
          line-height:1.2;
          font-weight:700;
          color: var(--color-primary-dark);
          margin:0 0 6px 0;
        }
        .period {
          font-size:12px;
          color: var(--color-text-muted);
          font-weight:500;
        }
        .badges {
          display:flex;
          flex-direction:column;
          gap:6px;
          min-width:120px;
          align-items:flex-end;
        }
        .badge {
          background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));
          color:#fff;
          padding:6px 10px;
          font-size:11px;
          font-weight:600;
          border-radius:6px;
          letter-spacing:.5px;
          box-shadow:0 2px 4px rgba(0,0,0,0.12);
        }
        .section {
          margin-bottom:30px;
          page-break-inside:avoid;
        }
        .section-title {
          font-size:16px;
            font-weight:700;
            color:var(--color-primary-dark);
            margin:0 0 14px 0;
            letter-spacing:.5px;
            display:flex;
            align-items:center;
            gap:10px;
            position:relative;
            padding-left:10px;
        }
        .section-title:before {
          content:'';
          position:absolute;
          left:0;
          top:0;
          bottom:0;
          width:3px;
          background:linear-gradient(var(--color-primary),var(--color-primary-dark));
          border-radius:2px;
        }
        table {
          width:100%;
          border-collapse:separate;
          border-spacing:0;
          margin:0 0 18px 0;
          font-size:12px;
        }
        th {
          background:linear-gradient(135deg,#EEF2FF,#E0EAFF);
          color:#1E3A8A;
          font-weight:600;
          text-align:left;
          padding:10px 12px;
          border-top:1px solid var(--color-border);
          border-bottom:1px solid var(--color-border);
          border-right:1px solid var(--color-border);
          letter-spacing:.3px;
        }
        th:first-child {
          border-left:1px solid var(--color-border);
          border-top-left-radius:8px;
        }
        th:last-child {
          border-top-right-radius:8px;
        }
        td {
          padding:9px 12px;
          background:#fff;
          border-right:1px solid var(--color-border);
          border-bottom:1px solid var(--color-border);
        }
        td:first-child {
          border-left:1px solid var(--color-border);
        }
        tr:last-child td:first-child { border-bottom-left-radius:8px; }
        tr:last-child td:last-child { border-bottom-right-radius:8px; }
        tbody tr:nth-child(even) td {
          background:#F8FAFC;
        }
        tbody tr:hover td {
          background:#F1F5F9;
        }
        .metrics-grid {
          display:flex;
          flex-wrap:wrap;
          gap:14px;
          margin:4px 0 8px 0;
        }
        .metric {
          flex:1 1 180px;
          background:linear-gradient(#fff,#F3F6FB);
          border:1px solid #E2E8F0;
          border-radius:10px;
          padding:14px 16px 12px 16px;
          position:relative;
          overflow:hidden;
          box-shadow:0 2px 4px rgba(0,0,0,0.06);
        }
        .metric:before {
          content:'';
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at 85% 15%,rgba(37,99,235,0.18),transparent 60%),
            radial-gradient(circle at 15% 85%,rgba(29,78,216,0.1),transparent 70%);
          opacity:.6;
          pointer-events:none;
        }
        .metric-label {
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.5px;
          font-weight:600;
          color:#475569;
          margin-bottom:6px;
        }
        .metric-value {
          font-size:22px;
          font-weight:700;
          color:#1E3A8A;
          letter-spacing:.5px;
          line-height:1.1;
        }
        .metric small {
          display:block;
          font-size:10px;
          color:#64748B;
          margin-top:4px;
          font-weight:500;
        }
        ul {
          margin:8px 0 0 0;
          padding:0 0 0 18px;
        }
        li {
          margin-bottom:6px;
          line-height:1.35;
        }
        .raw-json {
          font-family: 'Courier New', monospace;
          white-space:pre-wrap;
          background:#0F172A;
          color:#E2E8F0;
          padding:14px 16px;
          border-radius:10px;
          font-size:11px;
          border:1px solid #1E293B;
          box-shadow:inset 0 0 4px rgba(0,0,0,0.4);
        }
        .divider {
          height:1px;
          background:linear-gradient(to right,transparent,#CBD5E1,transparent);
          margin:26px 0 24px;
        }
        .badge-outline {
          display:inline-block;
          border:1px solid var(--color-primary);
          color:var(--color-primary-dark);
          background:#F0F7FF;
          padding:4px 10px;
          border-radius:20px;
          font-size:11px;
          font-weight:600;
          letter-spacing:.4px;
          margin:2px 6px 4px 0;
        }
        .meta {
          display:flex;
          flex-wrap:wrap;
          gap:10px 18px;
          font-size:11px;
          color:#475569;
          margin-top:2px;
        }
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
        contentHTML = `
          <div class="section">
            <div class="section-title">Сырые данные</div>
            <div class="raw-json">${(JSON.stringify(data, null, 2) || '').replace(/</g,'<')}</div>
          </div>`;
    }

    const logoHTML = logoBase64
      ? `<img src="data:image/png;base64,${logoBase64}" alt="Logo" />`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="ru">
        <head>
          <meta charset="UTF-8" />
          ${baseStyles}
          <title>${title}</title>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">
                ${logoHTML}
              </div>
              <div class="title-block">
                <div class="org-name">${(branding?.schoolName || 'ФИНАНСОВАЯ СИСТЕМА').toUpperCase()}</div>
                <h1 class="title">${title}</h1>
                <div class="period">Период: ${period}</div>
                <div class="meta">
                  <span>Сформировано: ${new Date().toLocaleDateString('ru-RU')}</span>
                  <span>ID: ${Math.random().toString(36).substring(2,8).toUpperCase()}</span>
                </div>
              </div>
              <div class="badges">
                <div class="badge">ОТЧЁТ</div>
              </div>
            </div>
            ${contentHTML}
          </div>
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
        <div class="metrics-grid">
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
      </div>
    `;
  }

  private generateWorkloadHTML(data: WorkloadAnalysisData): string {
    return `
      <div class="section">
        <div class="section-title">Анализ нагрузки преподавателей</div>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Всего преподавателей</div>
            <div class="metric-value">${data.totalTeachers || 0}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Средняя нагрузка</div>
            <div class="metric-value">${data.averageWorkload?.toFixed(1) || 0} часов</div>
          </div>
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
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Всего занятий</div>
            <div class="metric-value">${data.totalClasses || 0}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Загруженность</div>
            <div class="metric-value">${data.utilizationRate?.toFixed(1) || 0}%</div>
          </div>
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
    void _startDate;
    void _endDate;
    // Простая реализация прогноза
    return Promise.resolve([]);
  }

  private generateVarianceReport(_startDate: Date, _endDate: Date): Promise<VarianceAnalysis[]> {
    void _startDate;
    void _endDate;
    // Простая реализация анализа отклонений
    return Promise.resolve([]);
  }

  private generateBudgetAnalysisReport(_startDate: Date, _endDate: Date): Promise<any> {
    void _startDate;
    void _endDate;
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

    type WorkloadItem = WorkloadAnalysisData['workloadDistribution'][number];
    const teacherWorkloads = workloads.reduce((acc, workload) => {
      const teacherId = String(workload.teacherId);
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
        } as WorkloadItem;
      }

      acc[teacherId].totalHours += workload.actualHours || 0;
      acc[teacherId].weeklyHours += (workload.actualHours || 0) / 4;

      return acc;
    }, {} as Record<string, WorkloadItem>);

    const workloadDistribution: WorkloadItem[] = Object.values(teacherWorkloads);

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
      case 'QUARTERLY': {
        // Используем учебные четверти
        const q = getCurrentAcademicQuarterRange(now);
        return q.start;
      }
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
