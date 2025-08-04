import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
import { CreateAchievementDto } from './dto/achievement.dto';

@Controller('kpi')
@ApiTags('KPI')
@ApiBearerAuth()
export class KpiController {
  constructor(private readonly kpiService: KpiService) { }

  @Get('overview')
  @ApiOperation({ summary: 'Получить общий обзор KPI' })
  @ApiResponse({ status: 200, type: KpiOverviewResponseDto })
  async getOverview(@Query() filter: KpiFilterDto): Promise<KpiOverviewResponseDto> {
    return this.kpiService.getOverview(filter);
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Получить KPI преподавателей' })
  @ApiResponse({ status: 200, type: TeacherKpiResponseDto })
  async getTeacherKpi(@Query() filter: KpiFilterDto): Promise<TeacherKpiResponseDto> {
    return this.kpiService.getTeacherKpi(filter);
  }

  @Get('teachers/:teacherId/details')
  @ApiOperation({ summary: 'Получить детальную информацию о KPI преподавателя' })
  @ApiResponse({ status: 200 })
  async getTeacherKpiDetails(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.kpiService.getTeacherKpiDetails(teacherId);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Получить KPI отделов' })
  @ApiResponse({ status: 200, type: DepartmentKpiResponseDto })
  async getDepartmentKpi(@Query() filter: KpiFilterDto): Promise<DepartmentKpiResponseDto> {
    return this.kpiService.getDepartmentKpi(filter);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Получить тренды KPI' })
  @ApiResponse({ status: 200, type: KpiTrendsResponseDto })
  async getTrends(@Query() filter: KpiFilterDto): Promise<KpiTrendsResponseDto> {
    return this.kpiService.getTrends(filter);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Получить цели KPI' })
  @ApiResponse({ status: 200, type: KpiGoalsResponseDto })
  async getGoals(@Query() filter: KpiFilterDto): Promise<KpiGoalsResponseDto> {
    return this.kpiService.getGoals(filter);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Получить сравнение KPI' })
  @ApiResponse({ status: 200, type: KpiComparisonResponseDto })
  async getComparison(@Query() filter: KpiFilterDto): Promise<KpiComparisonResponseDto> {
    return this.kpiService.getComparison(filter);
  }

  @Get('export')
  @ApiOperation({ summary: 'Экспорт данных KPI' })
  @ApiResponse({ status: 200 })
  async exportKpi(
    @Query() filter: KpiFilterDto,
    @Query('format') format: 'xlsx' | 'csv' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.kpiService.exportKpi(filter, format);

    const filename = `kpi-export-${new Date().toISOString().split('T')[0]}.${format}`;

    let contentType: string;
    switch (format) {
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('teachers/:teacherId/export')
  @ApiOperation({ summary: 'Экспорт отчета по конкретному преподавателю' })
  @ApiResponse({ status: 200 })
  async exportTeacherReport(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query() filter: KpiFilterDto,
    @Query('format') format: 'xlsx' | 'pdf' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.kpiService.exportTeacherReport(teacherId, filter, format);

    const filename = `kpi-teacher-report-${teacherId}-${new Date().toISOString().split('T')[0]}.${format}`;

    const contentType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Ручной пересчет KPI для всех преподавателей' })
  @ApiResponse({ status: 200 })
  async recalculateKpi() {
    return this.kpiService.manualKpiRecalculation();
  }

  @Get('calculation-status')
  @ApiOperation({ summary: 'Get KPI calculation status' })
  @ApiResponse({ status: 200, description: 'Calculation status retrieved' })
  async getCalculationStatus() {
    return this.kpiService.getCalculationStatus();
  }

  // Settings management endpoints
  @Get('settings')
  @ApiOperation({ summary: 'Получить настройки KPI' })
  @ApiResponse({ status: 200, type: KpiSettingsResponseDto })
  async getSettings(): Promise<KpiSettingsResponseDto> {
    return this.kpiService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Обновить настройки KPI' })
  @ApiResponse({ status: 200, type: KpiSettingsResponseDto })
  async updateSettings(@Body() settings: KpiSettingsDto): Promise<KpiSettingsResponseDto> {
    return this.kpiService.updateSettings(settings);
  }

  // Goals management endpoints
  @Post('goals')
  @ApiOperation({ summary: 'Создать новую цель KPI' })
  @ApiResponse({ status: 201 })
  async createGoal(@Body() goalData: CreateKpiGoalDto) {
    return this.kpiService.createGoal(goalData);
  }

  @Put('goals/:goalId')
  @ApiOperation({ summary: 'Обновить цель KPI' })
  @ApiResponse({ status: 200 })
  async updateGoal(
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() goalData: UpdateKpiGoalDto,
  ) {
    return this.kpiService.updateGoal(goalId, goalData);
  }

  @Delete('goals/:goalId')
  @ApiOperation({ summary: 'Удалить цель KPI' })
  @ApiResponse({ status: 200 })
  async deleteGoal(@Param('goalId', ParseIntPipe) goalId: number) {
    return this.kpiService.deleteGoal(goalId);
  }

  // Achievements management endpoints
  @Post('achievements')
  @ApiOperation({ summary: 'Создать достижение преподавателя' })
  @ApiResponse({ status: 201 })
  async createAchievement(@Body() achievementData: CreateAchievementDto) {
    return this.kpiService.createAchievement(achievementData);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Получить список достижений' })
  @ApiResponse({ status: 200 })
  async getAchievements(
    @Query('teacherId') teacherId?: number,
    @Query('type') type?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.kpiService.getAchievements(teacherId, type, limit, offset);
  }

  @Post('olympiad-results')
  @ApiOperation({ summary: 'Добавить результат олимпиады' })
  @ApiResponse({ status: 201 })
  async createOlympiadResult(@Body() resultData: any) {
    return this.kpiService.createOlympiadResult(resultData);
  }

  @Get('olympiad-results')
  @ApiOperation({ summary: 'Получить результаты олимпиад' })
  @ApiResponse({ status: 200 })
  async getOlympiadResults(
    @Query('teacherId') teacherId?: number,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.kpiService.getOlympiadResults(teacherId, limit, offset);
  }

  @Post('student-admissions')
  @ApiOperation({ summary: 'Добавить поступление ученика' })
  @ApiResponse({ status: 201 })
  async createStudentAdmission(@Body() admissionData: any) {
    return this.kpiService.createStudentAdmission(admissionData);
  }

  @Get('student-admissions')
  @ApiOperation({ summary: 'Получить список поступлений' })
  @ApiResponse({ status: 200 })
  async getStudentAdmissions(
    @Query('teacherId') teacherId?: number,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.kpiService.getStudentAdmissions(teacherId, limit, offset);
  }

  // Update endpoints for editing achievements
  @Put('achievements/:achievementId')
  @ApiOperation({ summary: 'Обновить достижение преподавателя' })
  @ApiResponse({ status: 200 })
  async updateAchievement(
    @Param('achievementId', ParseIntPipe) achievementId: number,
    @Body() achievementData: any,
  ) {
    return this.kpiService.updateAchievement(achievementId, achievementData);
  }

  @Put('olympiad-results/:resultId')
  @ApiOperation({ summary: 'Обновить результат олимпиады' })
  @ApiResponse({ status: 200 })
  async updateOlympiadResult(
    @Param('resultId', ParseIntPipe) resultId: number,
    @Body() resultData: any,
  ) {
    return this.kpiService.updateOlympiadResult(resultId, resultData);
  }

  @Put('student-admissions/:admissionId')
  @ApiOperation({ summary: 'Обновить поступление ученика' })
  @ApiResponse({ status: 200 })
  async updateStudentAdmission(
    @Param('admissionId', ParseIntPipe) admissionId: number,
    @Body() admissionData: any,
  ) {
    return this.kpiService.updateStudentAdmission(admissionId, admissionData);
  }
}
