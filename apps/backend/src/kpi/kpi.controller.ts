import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
