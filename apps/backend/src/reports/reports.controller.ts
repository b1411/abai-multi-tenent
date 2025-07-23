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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFilterDto, GenerateReportDto, ReportType } from './dto/report-filter.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
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

  @Get(':type')
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
}
