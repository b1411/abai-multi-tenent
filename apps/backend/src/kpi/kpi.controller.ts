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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  // Периодические KPI эндпоинты
  @Get('teachers/:teacherId/periodic')
  @ApiOperation({ summary: 'Рассчитать периодический KPI преподавателя' })
  @ApiResponse({ status: 200 })
  async getTeacherPeriodicKpi(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
    } : undefined;

    return this.kpiService.calculatePeriodicKpiScore(teacherId, period);
  }

  @Get('periodic/all')
  @ApiOperation({ summary: 'Получить периодический KPI всех преподавателей' })
  @ApiResponse({ status: 200 })
  async getAllTeachersPeriodicKpi(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
    } : undefined;

    return this.kpiService.getAllTeachersPeriodicKpi(period);
  }

  @Get('periodic/top-achievements')
  @ApiOperation({ summary: 'Получить топ периодических достижений' })
  @ApiResponse({ status: 200 })
  async getTopPeriodicAchievements(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: number = 10,
  ) {
    const period = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
    } : undefined;

    return this.kpiService.getTopPeriodicAchievements(period, limit);
  }

  @Get('teachers/:teacherId/students')
  @ApiOperation({ summary: 'Получить студентов преподавателя' })
  @ApiResponse({ status: 200 })
  async getTeacherStudents(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.kpiService.getStudents(teacherId);
  }

  // Periodic KPI endpoints
  @Get('periodic')
  @ApiOperation({ summary: 'Получить периодические KPI' })
  @ApiResponse({ status: 200 })
  async getPeriodicKpi(
    @Query('teacherId') teacherId?: number,
    @Query('period') period?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('quarter') quarter?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Если не указан teacherId, возвращаем данные для всех преподавателей
    if (!teacherId) {
      const period = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate),
      } : undefined;
      
      return this.kpiService.getAllTeachersPeriodicKpi(period);
    }
    
    return this.kpiService.getPeriodicKpi({
      teacherId,
      period,
      year,
      month,
      quarter,
      startDate,
      endDate,
    });
  }

  @Get('periodic/stats')
  @ApiOperation({ summary: 'Получить статистику периодических KPI' })
  @ApiResponse({ status: 200 })
  async getPeriodicStats(
    @Query('teacherId') teacherId?: number,
    @Query('year') year?: number,
    @Query('period') period?: 'monthly' | 'quarterly' | 'yearly',
  ) {
    return this.kpiService.getPeriodicStats({ teacherId, year, period });
  }

  @Get('periodic/trends')
  @ApiOperation({ summary: 'Получить тренды периодических KPI' })
  @ApiResponse({ status: 200 })
  async getPeriodicTrends(
    @Query('teacherId') teacherId?: number,
    @Query('startYear') startYear?: number,
    @Query('endYear') endYear?: number,
    @Query('achievementType') achievementType?: string,
  ) {
    return this.kpiService.getPeriodicTrends({
      teacherId,
      startYear,
      endYear,
      achievementType,
    });
  }

  @Get('periodic/comparison')
  @ApiOperation({ summary: 'Сравнение периодических KPI' })
  @ApiResponse({ status: 200 })
  async getPeriodicComparison(
    @Query('teacherIds') teacherIds?: number[],
    @Query('period') period?: string,
    @Query('year') year?: number,
    @Query('comparisonType') comparisonType?: 'achievements' | 'olympiads' | 'admissions',
  ) {
    return this.kpiService.getPeriodicComparison({
      teacherIds,
      period,
      year,
      comparisonType,
    });
  }

  @Get('periodic/export')
  @ApiOperation({ summary: 'Экспорт периодических KPI' })
  @ApiResponse({ status: 200 })
  async exportPeriodicKpi(
    @Res() res: Response,
    @Query('teacherId') teacherId?: number,
    @Query('period') period?: string,
    @Query('year') year?: number,
    @Query('format') format?: 'xlsx' | 'csv' | 'pdf',
  ) {
    const buffer = await this.kpiService.exportPeriodicKpi({
      teacherId,
      period,
      year,
      format,
    });

    const filename = `periodic-kpi-export-${new Date().toISOString().split('T')[0]}.${format || 'xlsx'}`;
    const contentType = format === 'pdf' ? 'application/pdf' :
      format === 'csv' ? 'text/csv' :
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  // Verification endpoints
  @Put('achievements/:achievementId/verify')
  @ApiOperation({ summary: 'Верифицировать достижение' })
  @ApiResponse({ status: 200 })
  async verifyAchievement(
    @Param('achievementId', ParseIntPipe) achievementId: number,
    @Body() body: { isVerified: boolean; comment?: string },
  ) {
    return this.kpiService.verifyAchievement(achievementId, body.isVerified, body.comment);
  }

  @Put('olympiad-results/:resultId/verify')
  @ApiOperation({ summary: 'Верифицировать результат олимпиады' })
  @ApiResponse({ status: 200 })
  async verifyOlympiadResult(
    @Param('resultId', ParseIntPipe) resultId: number,
    @Body() body: { isVerified: boolean; comment?: string },
  ) {
    return this.kpiService.verifyOlympiadResult(resultId, body.isVerified, body.comment);
  }

  @Put('student-admissions/:admissionId/verify')
  @ApiOperation({ summary: 'Верифицировать поступление ученика' })
  @ApiResponse({ status: 200 })
  async verifyStudentAdmission(
    @Param('admissionId', ParseIntPipe) admissionId: number,
    @Body() body: { isVerified: boolean; comment?: string },
  ) {
    return this.kpiService.verifyStudentAdmission(admissionId, body.isVerified, body.comment);
  }

  // Delete endpoints
  @Delete('achievements/:achievementId')
  @ApiOperation({ summary: 'Удалить достижение' })
  @ApiResponse({ status: 200 })
  async deleteAchievement(@Param('achievementId', ParseIntPipe) achievementId: number) {
    return this.kpiService.deleteAchievement(achievementId);
  }

  @Delete('olympiad-results/:resultId')
  @ApiOperation({ summary: 'Удалить результат олимпиады' })
  @ApiResponse({ status: 200 })
  async deleteOlympiadResult(@Param('resultId', ParseIntPipe) resultId: number) {
    return this.kpiService.deleteOlympiadResult(resultId);
  }

  @Delete('student-admissions/:admissionId')
  @ApiOperation({ summary: 'Удалить поступление' })
  @ApiResponse({ status: 200 })
  async deleteStudentAdmission(@Param('admissionId', ParseIntPipe) admissionId: number) {
    return this.kpiService.deleteStudentAdmission(admissionId);
  }

  // Bulk operations
  @Post('achievements/bulk')
  @ApiOperation({ summary: 'Массовое создание достижений' })
  @ApiResponse({ status: 201 })
  async bulkCreateAchievements(@Body() body: { achievements: any[] }) {
    return this.kpiService.bulkCreateAchievements(body.achievements);
  }

  @Put('achievements/bulk')
  @ApiOperation({ summary: 'Массовое обновление достижений' })
  @ApiResponse({ status: 200 })
  async bulkUpdateAchievements(@Body() body: { updates: { id: number; data: any }[] }) {
    return this.kpiService.bulkUpdateAchievements(body.updates);
  }

  @Post('achievements/bulk-delete')
  @ApiOperation({ summary: 'Массовое удаление достижений' })
  @ApiResponse({ status: 200 })
  async bulkDeleteAchievements(@Body() body: { ids: number[] }) {
    return this.kpiService.bulkDeleteAchievements(body.ids);
  }

  // Summary and metadata
  @Get('summary')
  @ApiOperation({ summary: 'Получить сводку KPI' })
  @ApiResponse({ status: 200 })
  async getKpiSummary(
    @Query('teacherId') teacherId?: number,
    @Query('period') period?: string,
  ) {
    return this.kpiService.getKpiSummary(teacherId, period);
  }

  @Get('achievement-types')
  @ApiOperation({ summary: 'Получить типы достижений' })
  @ApiResponse({ status: 200 })
  async getAchievementTypes() {
    return this.kpiService.getAchievementTypes();
  }

  @Get('school-types')
  @ApiOperation({ summary: 'Получить типы школ' })
  @ApiResponse({ status: 200 })
  async getSchoolTypes() {
    return this.kpiService.getSchoolTypes();
  }

  // Periodic goals
  @Get('periodic/goals')
  @ApiOperation({ summary: 'Получить периодические цели' })
  @ApiResponse({ status: 200 })
  async getPeriodicGoals(
    @Query('teacherId') teacherId?: number,
    @Query('year') year?: number,
  ) {
    return this.kpiService.getPeriodicGoals(teacherId, year);
  }

  @Post('periodic/goals')
  @ApiOperation({ summary: 'Установить периодические цели' })
  @ApiResponse({ status: 201 })
  async setPeriodicGoals(@Body() goals: {
    teacherId: number;
    year: number;
    achievements?: number;
    olympiadWins?: number;
    studentAdmissions?: number;
  }) {
    return this.kpiService.setPeriodicGoals(goals);
  }

  @Put('periodic/goals/:goalId')
  @ApiOperation({ summary: 'Обновить периодические цели' })
  @ApiResponse({ status: 200 })
  async updatePeriodicGoals(
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() goals: any,
  ) {
    return this.kpiService.updatePeriodicGoals(goalId, goals);
  }
}
