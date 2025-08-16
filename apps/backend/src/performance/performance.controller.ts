import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
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
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('statistics')
  @ApiOperation({
    summary: 'Получить общую статистику успеваемости',
    description: 'Возвращает общие показатели успеваемости, посещаемости и выполнения заданий',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика успешно получена',
    type: StatisticsResponseDto,
  })
  @Roles('ADMIN', 'TEACHER', 'HR', 'PARENT', 'STUDENT')
  async getStatistics(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    // Для родителей фильтруем по их детям
    if (req.user.role === 'PARENT') {
      return this.performanceService.getParentStatistics(req.user.id, filter);
    }
    // Для студентов возвращаем только их собственные данные
    if (req.user.role === 'STUDENT') {
      return this.performanceService.getStudentStatistics(req.user.id, filter);
    }
    // Для учителей — только их студенты
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getTeacherStatistics(req.user.id, filter);
    }
    return this.performanceService.getStatistics(filter);
  }

  @Get('subjects')
  @ApiOperation({
    summary: 'Получить статистику по предметам',
    description: 'Возвращает показатели успеваемости по каждому предмету',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика по предметам успешно получена',
    type: SubjectsResponseDto,
  })
  @Roles('ADMIN', 'TEACHER', 'HR', 'PARENT', 'STUDENT')
  async getSubjects(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    // Для родителей возвращаем предметы только их детей
    if (req.user.role === 'PARENT') {
      return this.performanceService.getParentSubjects(req.user.id, filter);
    }
    // Для студентов возвращаем только их предметы
    if (req.user.role === 'STUDENT') {
      return this.performanceService.getStudentSubjects(req.user.id, filter);
    }
    // Для учителей — только их студенты
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getTeacherSubjects(req.user.id, filter);
    }
    return this.performanceService.getSubjects(filter);
  }

  @Get('classes')
  @ApiOperation({
    summary: 'Получить статистику по группам',
    description: 'Возвращает показатели успеваемости по каждой группе',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика по группам успешно получена',
    type: ClassesResponseDto,
  })
  @Roles('ADMIN', 'TEACHER', 'HR', 'PARENT', 'STUDENT')
  async getClasses(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    // Для родителей возвращаем группы только их детей
    if (req.user.role === 'PARENT') {
      return this.performanceService.getParentClasses(req.user.id);
    }
    // Для студентов возвращаем только их группу
    if (req.user.role === 'STUDENT') {
      return this.performanceService.getStudentClasses(req.user.id);
    }
    // Для учителей — только группы, где преподает учитель
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getTeacherClasses(req.user.id, filter);
    }
    return this.performanceService.getClasses(filter);
  }

  @Get('students/low-performing')
  @ApiOperation({
    summary: 'Получить список отстающих студентов',
    description: 'Возвращает студентов с низкой успеваемостью и рекомендации для улучшения',
  })
  @ApiResponse({
    status: 200,
    description: 'Список отстающих студентов успешно получен',
    type: LowPerformingStudentsResponseDto,
  })
  async getLowPerformingStudents(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getLowPerformingStudentsForTeacher(req.user.id, filter);
    }
    return this.performanceService.getLowPerformingStudents(filter);
  }

  @Get('students/high-progress')
  @ApiOperation({
    summary: 'Получить список студентов с высоким прогрессом',
    description: 'Возвращает студентов, которые показывают значительное улучшение результатов',
  })
  @ApiResponse({
    status: 200,
    description: 'Список прогрессирующих студентов успешно получен',
    type: HighProgressStudentsResponseDto,
  })
  async getHighProgressStudents(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getHighProgressStudentsForTeacher(req.user.id, filter);
    }
    return this.performanceService.getHighProgressStudents(filter);
  }

  @Get('trends')
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
  @ApiOperation({
    summary: 'Получить помесячные данные',
    description: 'Возвращает данные по успеваемости, посещаемости и заданиям по месяцам',
  })
  @ApiResponse({
    status: 200,
    description: 'Помесячные данные успешно получены',
    type: [MonthlyDataDto],
  })
  @Roles('ADMIN', 'TEACHER', 'HR', 'PARENT', 'STUDENT')
  async getMonthlyData(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getMonthlyDataForTeacher(req.user.id, filter);
    }
    return this.performanceService.getMonthlyData(filter);
  }

  @Get('grade-distribution')
  @ApiOperation({
    summary: 'Получить распределение оценок',
    description: 'Возвращает статистику распределения оценок студентов',
  })
  @ApiResponse({
    status: 200,
    description: 'Распределение оценок успешно получено',
    type: [GradeDistributionDto],
  })
  @Roles('ADMIN', 'TEACHER', 'HR', 'PARENT', 'STUDENT')
  async getGradeDistribution(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getGradeDistributionForTeacher(req.user.id, filter);
    }
    return this.performanceService.getGradeDistribution(filter);
  }

  @Get('insights')
  @ApiOperation({
    summary: 'Получить общие метрики производительности',
    description: 'Возвращает основные показатели для радарной диаграммы',
  })
  @ApiResponse({
    status: 200,
    description: 'Метрики производительности успешно получены',
    type: [PerformanceMetricDto],
  })
  @Roles('ADMIN', 'TEACHER', 'HR', 'PARENT', 'STUDENT')
  async getPerformanceMetrics(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getPerformanceMetricsForTeacher(req.user.id, filter);
    }
    return this.performanceService.getPerformanceMetrics(filter);
  }

  @Get('students/all')
  @ApiOperation({
    summary: 'Получить список всех студентов с их успеваемостью',
    description: 'Возвращает список всех студентов отсортированный по успеваемости',
  })
  @ApiResponse({
    status: 200,
    description: 'Список студентов успешно получен',
  })
  @Roles('ADMIN', 'TEACHER')
  async getAllStudentsPerformance(@Query() filter: PerformanceFilterDto, @Req() req: any) {
    if (req.user.role === 'TEACHER') {
      return this.performanceService.getAllStudentsPerformanceForTeacher(req.user.id, filter);
    }
    return this.performanceService.getAllStudentsPerformance(filter);
  }
}
