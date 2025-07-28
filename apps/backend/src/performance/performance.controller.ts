import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PerformanceService } from './performance.service';
import { PerformanceFilterDto } from './dto/performance-filter.dto';
import {
  StatisticsResponseDto,
  SubjectsResponseDto,
  ClassesResponseDto,
  LowPerformingStudentsResponseDto,
  HighProgressStudentsResponseDto,
  TrendsResponseDto,
  MonthlyDataDto,
  GradeDistributionDto,
  PerformanceMetricDto,
} from './dto/performance-response.dto';

@ApiTags('performance')
@Controller('performance')
@UseGuards(AuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('statistics')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить общую статистику успеваемости',
    description: 'Возвращает общие показатели успеваемости, посещаемости и выполнения заданий',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика успешно получена',
    type: StatisticsResponseDto,
  })
  async getStatistics(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getStatistics(filter);
  }

  @Get('subjects')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить статистику по предметам',
    description: 'Возвращает показатели успеваемости по каждому предмету',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика по предметам успешно получена',
    type: SubjectsResponseDto,
  })
  async getSubjects(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getSubjects(filter);
  }

  @Get('classes')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить статистику по группам',
    description: 'Возвращает показатели успеваемости по каждой группе',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика по группам успешно получена',
    type: ClassesResponseDto,
  })
  async getClasses() {
    return this.performanceService.getClasses();
  }

  @Get('students/low-performing')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить список отстающих студентов',
    description: 'Возвращает студентов с низкой успеваемостью и рекомендации для улучшения',
  })
  @ApiResponse({
    status: 200,
    description: 'Список отстающих студентов успешно получен',
    type: LowPerformingStudentsResponseDto,
  })
  async getLowPerformingStudents(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getLowPerformingStudents(filter);
  }

  @Get('students/high-progress')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить список студентов с высоким прогрессом',
    description: 'Возвращает студентов, которые показывают значительное улучшение результатов',
  })
  @ApiResponse({
    status: 200,
    description: 'Список прогрессирующих студентов успешно получен',
    type: HighProgressStudentsResponseDto,
  })
  async getHighProgressStudents(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getHighProgressStudents(filter);
  }

  @Get('trends')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить тренды успеваемости',
    description: 'Возвращает динамику изменения показателей успеваемости за период',
  })
  @ApiResponse({
    status: 200,
    description: 'Тренды успеваемости успешно получены',
    type: TrendsResponseDto,
  })
  async getTrends(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getTrends(filter);
  }

  @Get('monthly-data')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить помесячные данные',
    description: 'Возвращает данные по успеваемости, посещаемости и заданиям по месяцам',
  })
  @ApiResponse({
    status: 200,
    description: 'Помесячные данные успешно получены',
    type: [MonthlyDataDto],
  })
  async getMonthlyData(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getMonthlyData(filter);
  }

  @Get('grade-distribution')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить распределение оценок',
    description: 'Возвращает статистику распределения оценок студентов',
  })
  @ApiResponse({
    status: 200,
    description: 'Распределение оценок успешно получено',
    type: [GradeDistributionDto],
  })
  async getGradeDistribution(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getGradeDistribution(filter);
  }

  @Get('metrics')
  @RequirePermission('performance', 'read')
  @ApiOperation({
    summary: 'Получить общие метрики производительности',
    description: 'Возвращает основные показатели для радарной диаграммы',
  })
  @ApiResponse({
    status: 200,
    description: 'Метрики производительности успешно получены',
    type: [PerformanceMetricDto],
  })
  async getPerformanceMetrics(@Query() filter: PerformanceFilterDto) {
    return this.performanceService.getPerformanceMetrics(filter);
  }
}
