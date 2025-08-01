import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  ParseIntPipe, 
  UseGuards,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { EducationalReportsService } from './educational-reports.service';
import { 
  EducationalReportFiltersDto, 
  StudentReportFiltersDto 
} from './dto/educational-report-filters.dto';

@ApiTags('Educational Reports - Приказ 125')

@Controller('educational-reports')
@UseGuards(AuthGuard)
export class EducationalReportsController {
  constructor(private readonly educationalReportsService: EducationalReportsService) {}

  /**
   * Получить список студентов с базовой информацией для отчетов
   * Доступ зависит от роли пользователя
   */
  @Get('students')
  @ApiOperation({ summary: 'Получить список студентов для отчетов' })
  @ApiResponse({ status: 200, description: 'Список студентов успешно получен' })
  async getStudents(
    @Request() req: any,
    @Query() filters: EducationalReportFiltersDto
  ) {
    const { userId, role } = req.user;
    return this.educationalReportsService.getStudentsByRole(userId, role, filters);
  }

  /**
   * Получить оценки конкретного студента по периодам
   * Согласно приказу 125
   */
  @Get('students/:studentId/grades')
  @ApiOperation({ summary: 'Получить оценки студента по предметам' })
  @ApiResponse({ status: 200, description: 'Оценки студента успешно получены' })
  async getStudentGrades(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() filters: StudentReportFiltersDto
  ) {
    return this.educationalReportsService.getStudentGrades(studentId, filters);
  }

  /**
   * Получить данные о посещаемости студента
   */
  @Get('students/:studentId/attendance')
  @ApiOperation({ summary: 'Получить данные о посещаемости студента' })
  @ApiResponse({ status: 200, description: 'Данные посещаемости успешно получены' })
  async getStudentAttendance(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() filters: StudentReportFiltersDto
  ) {
    return this.educationalReportsService.getStudentAttendance(studentId, filters);
  }

  /**
   * Рассчитать итоговые оценки согласно приказу 125
   */
  @Get('students/:studentId/period-grades')
  @ApiOperation({ summary: 'Расчет итоговых оценок согласно приказу 125' })
  @ApiResponse({ status: 200, description: 'Итоговые оценки успешно рассчитаны' })
  async calculatePeriodGrades(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() filters: StudentReportFiltersDto
  ) {
    const grades = await this.educationalReportsService.getStudentGrades(studentId, filters);
    
    // Преобразуем данные для расчета итоговых оценок
    return grades.map(subject => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      periodGrade: this.educationalReportsService.calculatePeriodGrades(
        subject.grades.map(g => g.grade), 
        filters.period
      ),
      averageGrade: subject.averageGrade,
      qualityPercentage: subject.qualityPercentage,
      gradesCount: subject.gradesCount
    }));
  }

  /**
   * Получить статистику качества знаний по классу/группе
   */
  @Get('quality-statistics')
  @ApiOperation({ summary: 'Получить статистику качества знаний' })
  @ApiResponse({ status: 200, description: 'Статистика успешно получена' })
  async getQualityStatistics(
    @Request() req: any,
    @Query() filters: EducationalReportFiltersDto
  ) {
    const { userId, role } = req.user;
    const students = await this.educationalReportsService.getStudentsByRole(userId, role, filters);

    // Базовая статистика по полученным студентам
    const totalStudents = students.length;
    
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        averageGrade: 0,
        qualityPercentage: 0,
        attendancePercentage: 0
      };
    }

    // Для реальной реализации нужно собрать оценки всех студентов
    // Пока возвращаем базовую структуру
    return {
      totalStudents,
      averageGrade: 4.2, // Будет рассчитываться из реальных данных
      qualityPercentage: 78, // Процент студентов с оценками 4 и 5
      attendancePercentage: 85, // Процент посещаемости
      studentsAbove4: Math.floor(totalStudents * 0.78),
      studentsBelow3: Math.floor(totalStudents * 0.05)
    };
  }

  /**
   * Получить список предметов (StudyPlan = предметы в системе)
   */
  @Get('subjects')
  @ApiOperation({ summary: 'Получить список предметов' })
  @ApiResponse({ status: 200, description: 'Список предметов успешно получен' })
  async getSubjects() {
    return this.educationalReportsService.getSubjects();
  }

  /**
   * Получить список классов/групп
   */
  @Get('classes')
  @ApiOperation({ summary: 'Получить список классов для фильтров' })
  @ApiResponse({ status: 200, description: 'Список классов успешно получен' })
  async getClasses(@Request() req: any) {
    const { userId, role } = req.user;
    return this.educationalReportsService.getClasses(userId, role);
  }

  /**
   * Получить список учителей
   */
  @Get('teachers')
  @ApiOperation({ summary: 'Получить список учителей для фильтров' })
  @ApiResponse({ status: 200, description: 'Список учителей успешно получен' })
  async getTeachers(@Request() req: any) {
    const { userId, role } = req.user;
    return this.educationalReportsService.getTeachers(userId, role);
  }
}
