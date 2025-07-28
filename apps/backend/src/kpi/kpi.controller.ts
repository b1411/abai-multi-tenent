import { Controller, Get, Query, UseGuards, Res, Param, ParseIntPipe } from '@nestjs/common';
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
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';

@ApiTags('KPI')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('overview')
  @RequirePermission('kpi', 'read')
  @ApiOperation({ summary: 'Получить общие показатели KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiOverviewResponseDto })
  async getOverview(@Query() filter?: KpiFilterDto): Promise<KpiOverviewResponseDto> {
    return this.kpiService.getOverview(filter);
  }

  @Get('teachers')
  @RequirePermission('kpi', 'read')
  @ApiOperation({ summary: 'Получить KPI преподавателей' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: TeacherKpiResponseDto })
  async getTeacherKpi(@Query() filter?: KpiFilterDto): Promise<TeacherKpiResponseDto> {
    return this.kpiService.getTeacherKpi(filter);
  }

  @Get('departments')
  @RequirePermission('kpi', 'read')
  @ApiOperation({ summary: 'Получить KPI отделов' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: DepartmentKpiResponseDto })
  async getDepartmentKpi(@Query() filter?: KpiFilterDto): Promise<DepartmentKpiResponseDto> {
    return this.kpiService.getDepartmentKpi(filter);
  }

  @Get('trends')
  @RequirePermission('kpi', 'read')
  @ApiOperation({ summary: 'Получить тренды KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiTrendsResponseDto })
  async getTrends(@Query() filter?: KpiFilterDto): Promise<KpiTrendsResponseDto> {
    return this.kpiService.getTrends(filter);
  }

  @Get('goals')
  @RequirePermission('kpi', 'read')
  @ApiOperation({ summary: 'Получить цели KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiGoalsResponseDto })
  async getGoals(@Query() filter?: KpiFilterDto): Promise<KpiGoalsResponseDto> {
    return this.kpiService.getGoals(filter);
  }

  @Get('comparison')
  @RequirePermission('kpi', 'read')
  @ApiOperation({ summary: 'Получить сравнение KPI' })
  @ApiResponse({ status: 200, description: 'Успешно получены данные', type: KpiComparisonResponseDto })
  async getComparison(@Query() filter?: KpiFilterDto): Promise<KpiComparisonResponseDto> {
    return this.kpiService.getComparison(filter);
  }

  @Get('export')
  @RequirePermission('kpi', 'read')
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
  @RequirePermission('kpi', 'read')
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
}
