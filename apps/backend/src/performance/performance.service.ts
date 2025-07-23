import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PerformanceFilterDto,
  PerformancePeriod,
  PerformanceMetric,
} from './dto/performance-filter.dto';
import {
  PerformanceOverviewDto,
  SubjectPerformanceDto,
  StudentPerformanceDto,
  ClassDataDto,
  MonthlyDataDto,
  GradeDistributionDto,
  PerformanceMetricDto,
  StatisticsResponseDto,
  SubjectsResponseDto,
  ClassesResponseDto,
  LowPerformingStudentsResponseDto,
  HighProgressStudentsResponseDto,
  TrendsResponseDto,
  TrendDataPointDto,
  TrendAnalysisDto,
  StudentWithSubjectsDto,
  StudentWithImprovementsDto,
  SubjectWithRecommendationsDto,
  SubjectImprovementDto,
} from './dto/performance-response.dto';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async getStatistics(filter: PerformanceFilterDto): Promise<StatisticsResponseDto> {
    // Получаем реальные данные по студентам и группам
    const groups = await this.prisma.group.findMany({
      include: {
        students: {
          include: {
            lessonsResults: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    // Рассчитываем реальную статистику
    const allStudents = groups.flatMap(g => g.students);
    const allResults = allStudents.flatMap(s => s.lessonsResults);
    
    // Средняя оценка
    const lessonScores = allResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const averageGrade = lessonScores.length > 0 
      ? lessonScores.reduce((sum, score) => sum + score, 0) / lessonScores.length 
      : 0;

    // Посещаемость
    const attendanceRecords = allResults.filter(r => r.attendance !== null);
    const attendanceRate = attendanceRecords.length > 0
      ? (attendanceRecords.filter(r => r.attendance === true).length / attendanceRecords.length) * 100
      : 0;

    // Выполнение заданий (по домашним работам)
    const homeworkRecords = allResults.filter(r => r.homeworkScore !== null);
    const assignmentCompletionRate = homeworkRecords.length > 0
      ? (homeworkRecords.filter(r => r.homeworkScore >= 3).length / homeworkRecords.length) * 100
      : 0;

    // Общий уровень успеваемости
    const performanceRate = lessonScores.length > 0
      ? (lessonScores.filter(score => score >= 3).length / lessonScores.length) * 100
      : 0;

    const overview: PerformanceOverviewDto = {
      averageGrade: Number(averageGrade.toFixed(1)),
      performanceRate: Math.round(performanceRate),
      attendanceRate: Math.round(attendanceRate),
      assignmentCompletionRate: Math.round(assignmentCompletionRate),
      trends: {
        grade: Math.round((Math.random() - 0.5) * 2 * 10) / 10, // временно случайное
        performance: Math.round((Math.random() - 0.5) * 10),
        attendance: Math.round((Math.random() - 0.5) * 6),
        assignments: Math.round((Math.random() - 0.5) * 8),
      },
    };

    return { overview };
  }

  getSubjects(filter: PerformanceFilterDto): Promise<SubjectsResponseDto> {
    // Моковые данные для предметов
    const subjects: SubjectPerformanceDto[] = [
      { name: 'Математика', grade: 4.3, attendance: 95, assignments: 92, participation: 88 },
      { name: 'История', grade: 4.0, attendance: 88, assignments: 85, participation: 90 },
      { name: 'Биология', grade: 3.8, attendance: 92, assignments: 88, participation: 85 },
      { name: 'Английский', grade: 4.5, attendance: 94, assignments: 96, participation: 92 },
      { name: 'Физика', grade: 4.1, attendance: 90, assignments: 89, participation: 87 },
      { name: 'Химия', grade: 3.9, attendance: 91, assignments: 87, participation: 86 },
    ];

    const bestPerforming = ['Английский', 'Математика'];
    const needsImprovement = ['Биология', 'Химия'];

    return Promise.resolve({
      subjects,
      summary: {
        bestPerforming,
        needsImprovement,
      },
    });
  }

  async getClasses(): Promise<ClassesResponseDto> {
    // Получаем реальные группы из базы данных
    const groups = await this.prisma.group.findMany({
      include: {
        students: true,
      },
    });

    const classes: ClassDataDto[] = groups.map((group, index) => ({
      id: group.id.toString(),
      name: group.name,
      averageGrade: 4.0 + (index * 0.1),
      attendance: 88 + (index * 2),
      assignments: 82 + (index * 3),
      studentsCount: group.students.length,
    }));

    const totalStudents = classes.reduce((sum, c) => sum + c.studentsCount, 0);
    const averagePerformance = Number(
      (classes.reduce((sum, c) => sum + c.averageGrade, 0) / classes.length || 0).toFixed(1)
    );
    const topClasses = classes
      .sort((a, b) => b.averageGrade - a.averageGrade)
      .slice(0, 2)
      .map(c => c.name);

    return {
      classes,
      statistics: {
        averagePerformance,
        topClasses,
        totalStudents,
      },
    };
  }

  async getLowPerformingStudents(
    filter: PerformanceFilterDto
  ): Promise<LowPerformingStudentsResponseDto> {
    // Получаем реальных студентов и их данные
    const students = await this.prisma.student.findMany({
      where: {
        ...(filter.groupId && { groupId: parseInt(filter.groupId) }),
      },
      include: {
        user: true,
      },
    });

    // Создаем моковые данные для отстающих студентов
    const lowPerformingStudents: StudentWithSubjectsDto[] = students
      .slice(0, 3)
      .map((student, index) => ({
        student: {
          name: `${student.user.name} ${student.user.surname}`,
          grade: 2.8 + (index * 0.1),
          trend: -0.2 - (index * 0.1),
        },
        subjects: [
          {
            name: 'Математика',
            grade: 2.5,
            recommendations: [
              'Больше практических заданий',
              'Дополнительные консультации',
              'Повторение базового материала',
            ],
          },
          {
            name: 'Физика',
            grade: 2.8,
            recommendations: [
              'Работа с формулами',
              'Решение задач',
              'Лабораторные работы',
            ],
          },
        ],
      }));

    return { students: lowPerformingStudents };
  }

  async getHighProgressStudents(
    filter: PerformanceFilterDto
  ): Promise<HighProgressStudentsResponseDto> {
    // Получаем реальных студентов
    const students = await this.prisma.student.findMany({
      where: {
        ...(filter.groupId && { groupId: parseInt(filter.groupId) }),
      },
      include: {
        user: true,
      },
    });

    // Создаем моковые данные для прогрессирующих студентов
    const highProgressStudents: StudentWithImprovementsDto[] = students
      .slice(0, 3)
      .map((student, index) => ({
        student: {
          name: `${student.user.name} ${student.user.surname}`,
          grade: 4.7 + (index * 0.1),
          trend: 0.4 + (index * 0.1),
        },
        improvements: [
          {
            subject: 'Математика',
            improvement: 0.5,
          },
          {
            subject: 'Английский',
            improvement: 0.3,
          },
        ],
      }));

    return { students: highProgressStudents };
  }

  getTrends(filter: PerformanceFilterDto): Promise<TrendsResponseDto> {
    // Моковые данные для трендов
    const monthNames = ['Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев'];
    const trends: TrendDataPointDto[] = monthNames.map((month, index) => {
      const baseValue = 3.8 + (index * 0.1);
      const change = index > 0 ? 0.1 : 0;
      
      return {
        period: month,
        value: Number(baseValue.toFixed(1)),
        change: Number(change.toFixed(1)),
      };
    });

    const analysis: TrendAnalysisDto = {
      trend: 'positive',
      factors: [
        'Улучшение методов преподавания',
        'Повышение мотивации студентов',
        'Дополнительные консультации',
      ],
    };

    return Promise.resolve({ trends, analysis });
  }

  getMonthlyData(filter: PerformanceFilterDto): Promise<MonthlyDataDto[]> {
    const monthNames = ['Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев'];
    
    const data = monthNames.map((month, index) => ({
      month,
      value: Number((3.8 + (index * 0.1)).toFixed(1)),
      attendance: 88 + index * 1,
      assignments: 85 + index * 1,
    }));

    return Promise.resolve(data);
  }

  getGradeDistribution(filter: PerformanceFilterDto): Promise<GradeDistributionDto[]> {
    // Моковые данные для распределения оценок
    const distribution = [
      { name: '5', value: 25, color: '#10B981' },
      { name: '4', value: 40, color: '#3B82F6' },
      { name: '3', value: 25, color: '#F59E0B' },
      { name: '2', value: 10, color: '#EF4444' },
    ];

    return Promise.resolve(distribution);
  }

  getPerformanceMetrics(filter: PerformanceFilterDto): Promise<PerformanceMetricDto[]> {
    const metrics = [
      { subject: 'Оценки', value: 85 },
      { subject: 'Посещаемость', value: 92 },
      { subject: 'Домашние задания', value: 88 },
      { subject: 'Активность', value: 78 },
      { subject: 'Тесты', value: 82 },
    ];

    return Promise.resolve(metrics);
  }
}
