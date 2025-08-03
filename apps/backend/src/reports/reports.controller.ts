import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFilterDto, GenerateReportDto, ReportType } from './dto/report-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Roles('ADMIN', 'FINANCIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Сгенерировать финансовый отчет' })
  @ApiResponse({ status: 200, description: 'Отчет успешно сгенерирован' })
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id?.toString() || 'system';
    return await this.reportsService.generateReport(generateReportDto, userId);
  }

  @Get('cashflow')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить данные движения денежных средств' })
  @ApiResponse({ status: 200, description: 'Данные движения денежных средств' })
  async getCashflowData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await this.reportsService.getCashflowData(start, end);
  }

  @Get('performance')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить показатели эффективности' })
  @ApiResponse({ status: 200, description: 'Показатели эффективности' })
  async getPerformanceMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await this.reportsService.getPerformanceMetrics(start, end);
  }

  @Get('forecast')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить финансовый прогноз' })
  @ApiResponse({ status: 200, description: 'Финансовый прогноз' })
  async getForecastData(
    @Query('startDate') startDate: string,
    @Query('months') months: string = '6',
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    const monthsCount = parseInt(months) || 6;
    
    return await this.reportsService.getForecastData(start, monthsCount);
  }

  @Get('variance')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить анализ отклонений' })
  @ApiResponse({ status: 200, description: 'Анализ отклонений' })
  async getVarianceAnalysis(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await this.reportsService.getVarianceAnalysis(start, end);
  }

  @Get('trends')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить тренды бюджета' })
  @ApiResponse({ status: 200, description: 'Тренды бюджета' })
  async getBudgetTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await this.reportsService.getBudgetTrends(start, end);
  }

  @Get('list')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить список всех отчетов' })
  @ApiResponse({ status: 200, description: 'Список отчетов' })
  async getReportsList(@Query() filters: ReportFilterDto) {
    return await this.reportsService.getReportsList(filters);
  }

  @Get('download/:id')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Скачать отчет' })
  @ApiResponse({ status: 200, description: 'Файл отчета' })
  async downloadReport(
    @Param('id') reportId: string,
    @Query('format') format: string = 'pdf',
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const reportBuffer = await this.reportsService.downloadReport(reportId, format);
    
    // Получаем информацию об отчете для имени файла
    const reportInfo = await this.reportsService.getReportInfo(reportId);
    const fileName = `${reportInfo.title}_${reportInfo.period}.${format}`;
    
    res.set({
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    return new StreamableFile(reportBuffer);
  }

  @Get('export/:type')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Экспортировать отчет по типу' })
  @ApiResponse({ status: 200, description: 'Файл отчета' })
  async exportReportByType(
    @Param('type') type: ReportType,
    @Query('format') format: string = 'pdf',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ): Promise<StreamableFile> {
    const userId = req.user?.id?.toString() || '1';
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const reportBuffer = await this.reportsService.exportReport(type, start, end, format, userId);
    const fileName = `${this.getReportTitle(type)}_${start.toLocaleDateString('ru-RU')}-${end.toLocaleDateString('ru-RU')}.${format}`;
    
    res.set({
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    return new StreamableFile(reportBuffer);
  }

  @Get('workload/analytics')
  @Roles('ADMIN', 'FINANCIST', 'TEACHER')
  @ApiOperation({ summary: 'Получить аналитику нагрузок' })
  @ApiResponse({ status: 200, description: 'Аналитика нагрузок' })
  async getWorkloadAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    const userId = req.user?.id?.toString() || '1'; // Используем ID=1 как fallback
    
    return await this.reportsService.generateReport({
      type: ReportType.WORKLOAD_ANALYSIS,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      title: 'Аналитика нагрузок преподавателей'
    }, userId);
  }

  @Get('schedule/analytics')
  @Roles('ADMIN', 'FINANCIST', 'TEACHER')
  @ApiOperation({ summary: 'Получить аналитику расписания' })
  @ApiResponse({ status: 200, description: 'Аналитика расписания' })
  async getScheduleAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    const userId = req.user?.id?.toString() || '1'; // Используем ID=1 как fallback
    
    return await this.reportsService.generateReport({
      type: ReportType.SCHEDULE_ANALYSIS,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      title: 'Аналитика расписания ставок'
    }, userId);
  }

  @Get(':type')
  @Roles('ADMIN', 'FINANCIST')
  @ApiOperation({ summary: 'Получить отчет по типу' })
  @ApiResponse({ status: 200, description: 'Данные отчета' })
  async getReportByType(
    @Param('type') type: ReportType,
    @Query() filters: ReportFilterDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id?.toString() || 'system';
    
    const generateReportDto: GenerateReportDto = {
      type,
      startDate: filters.startDate,
      endDate: filters.endDate,
      period: filters.period,
      format: filters.format,
      title: `Отчет: ${type}`,
    };

    return await this.reportsService.generateReport(generateReportDto, userId);
  }

  private getReportTitle(type: ReportType): string {
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
    return titles[type] || 'Отчет';
  }

  private getReportDescription(type: ReportType): string {
    const descriptions = {
      [ReportType.BUDGET_ANALYSIS]: 'Детальный анализ исполнения бюджета по категориям',
      [ReportType.CASHFLOW]: 'Анализ входящих и исходящих денежных потоков',
      [ReportType.PERFORMANCE]: 'Ключевые показатели эффективности учреждения',
      [ReportType.FORECAST]: 'Прогноз финансовых показателей на ближайшие периоды',
      [ReportType.VARIANCE]: 'Анализ отклонений фактических показателей от плановых',
      [ReportType.INCOME_STATEMENT]: 'Отчет о доходах и расходах за период',
      [ReportType.BALANCE_SHEET]: 'Баланс активов и пассивов учреждения',
      [ReportType.WORKLOAD_ANALYSIS]: 'Анализ распределения учебной нагрузки между преподавателями',
      [ReportType.SCHEDULE_ANALYSIS]: 'Анализ эффективности использования расписания и аудиторий',
    };
    return descriptions[type] || 'Отчет';
  }

  private getReportTags(type: ReportType): string[] {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString();
    const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const month = months[currentDate.getMonth()];

    const baseTags = [type.toLowerCase().replace('_', '-'), year, month];
    
    // Добавляем специфичные теги для разных типов отчетов
    if (type.includes('WORKLOAD')) {
      baseTags.push('нагрузка-преподавателей');
    } else if (type.includes('SCHEDULE')) {
      baseTags.push('расписание-ставок');
    } else {
      baseTags.push('финансы');
    }

    return baseTags;
  }
}
