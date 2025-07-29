import { Controller, Get, Post, Put, Delete, Query, Body, UseGuards, Res, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { KpiService } from './kpi.service';
import { KpiFilterDto } from './dto/kpi-filter.dto';
import {
  KpiOverviewResponseDto,
  TeacherKpiResponseDto,
  DepartmentKpiResponseDto,
  KpiTrendsResponseDto,
  KpiGoalsResponseDto,
  KpiComparisonResponseDto,
} from './dto/kpi-response.dto';
import {
  KpiSettingsDto,
  KpiSettingsResponseDto,
  CreateKpiGoalDto,
  UpdateKpiGoalDto,
} from './dto/kpi-settings.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('KPI')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Получить общие показатели KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiOverviewResponseDto })
  async getOverview(@Query() filter?: KpiFilterDto): Promise<KpiOverviewResponseDto> {
    return this.kpiService.getOverview(filter);
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Получить KPI преподавателей' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: TeacherKpiResponseDto })
  async getTeacherKpi(@Query() filter?: KpiFilterDto): Promise<TeacherKpiResponseDto> {
    return this.kpiService.getTeacherKpi(filter);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Получить KPI отделов' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: DepartmentKpiResponseDto })
  async getDepartmentKpi(@Query() filter?: KpiFilterDto): Promise<DepartmentKpiResponseDto> {
    return this.kpiService.getDepartmentKpi(filter);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Получить тренды KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiTrendsResponseDto })
  async getTrends(@Query() filter?: KpiFilterDto): Promise<KpiTrendsResponseDto> {
    return this.kpiService.getTrends(filter);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Получить цели KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiGoalsResponseDto })
  async getGoals(@Query() filter?: KpiFilterDto): Promise<KpiGoalsResponseDto> {
    return this.kpiService.getGoals(filter);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Получить сравнение KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiComparisonResponseDto })
  async getComparison(@Query() filter?: KpiFilterDto): Promise<KpiComparisonResponseDto> {
    return this.kpiService.getComparison(filter);
  }

  @Get('export')
  @ApiOperation({ summary: 'Экспорт KPI данных' })
  @ApiResponse({ status: 200, description: 'Файл экспорта KPI' })
  async exportKpi(
    @Query() filter: KpiFilterDto,
    @Query('format') format: 'xlsx' | 'csv' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.kpiService.exportKpi(filter, format);
    
    const filename = `kpi-export-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'xlsx' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : format === 'csv'
      ? 'text/csv'
      : 'application/pdf';
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    res.send(buffer);
  }

  @Get('teachers/:teacherId/export')
  @ApiOperation({ summary: 'Экспорт KPI отчета по преподавателю' })
  @ApiResponse({ status: 200, description: 'Файл отчета по преподавателю' })
  async exportTeacherReport(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query() filter: KpiFilterDto,
    @Query('format') format: 'xlsx' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.kpiService.exportTeacherReport(teacherId, filter, format);
    
    const filename = `teacher-kpi-${teacherId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'xlsx' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    res.send(buffer);
  }

  // Settings endpoints
  @Get('settings')
  @ApiOperation({ summary: 'Получить настройки KPI' })
  @ApiResponse({ status: 200, description: 'Настройки KPI', type: KpiSettingsResponseDto })
  async getSettings(): Promise<KpiSettingsResponseDto> {
    return this.kpiService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Обновить настройки KPI' })
  @ApiResponse({ status: 200, description: 'Настройки обновлены', type: KpiSettingsResponseDto })
  async updateSettings(@Body() settings: KpiSettingsDto): Promise<KpiSettingsResponseDto> {
    return this.kpiService.updateSettings(settings);
  }

  // Goals management
  @Post('goals')
  @ApiOperation({ summary: 'Создать новую цель KPI' })
  @ApiResponse({ status: 201, description: 'Цель создана' })
  async createGoal(@Body() goalData: CreateKpiGoalDto) {
    return this.kpiService.createGoal(goalData);
  }

  @Put('goals/:goalId')
  @ApiOperation({ summary: 'Обновить цель KPI' })
  @ApiResponse({ status: 200, description: 'Цель обновлена' })
  async updateGoal(
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() goalData: UpdateKpiGoalDto,
  ) {
    return this.kpiService.updateGoal(goalId, goalData);
  }

  @Delete('goals/:goalId')
  @ApiOperation({ summary: 'Удалить цель KPI' })
  @ApiResponse({ status: 200, description: 'Цель удалена' })
  async deleteGoal(@Param('goalId', ParseIntPipe) goalId: number) {
    return this.kpiService.deleteGoal(goalId);
  }

  // Manual KPI recalculation
  @Post('recalculate')
  @ApiOperation({ summary: 'Ручной пересчет KPI для всех преподавателей' })
  @ApiResponse({ status: 200, description: 'KPI пересчитан успешно' })
  async recalculateKpi() {
    return this.kpiService.manualKpiRecalculation();
  }

  @Get('calculation-status')
  @ApiOperation({ summary: 'Получить статус последнего обновления KPI' })
  @ApiResponse({ status: 200, description: 'Статус обновления' })
  async getCalculationStatus() {
    return this.kpiService.getCalculationStatus();
  }
}
