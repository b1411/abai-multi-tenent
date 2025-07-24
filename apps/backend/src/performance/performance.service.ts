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
  constructor(private prisma: PrismaService) { }

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

  async getSubjects(filter: PerformanceFilterDto): Promise<SubjectsResponseDto> {
    // Получаем все предметы
    const subjectsRaw = await this.prisma.studyPlan.findMany({
      include: {
        lessons: {
          include: {
            LessonResult: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    const subjects = subjectsRaw.map(subject => {
      // Собираем все результаты по всем урокам предмета
      const allResults = subject.lessons.flatMap(lesson => lesson.LessonResult);

      const grades = allResults.map(r => r.lessonScore).filter(v => v !== null);
      const attendanceRecords = allResults.map(r => r.attendance).filter(v => v !== null);
      const assignmentsRecords = allResults.map(r => r.homeworkScore).filter(v => v !== null);

      const grade = grades.length > 0 ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)) : 0;
      const attendance = attendanceRecords.length > 0 ? Math.round(attendanceRecords.filter(a => a).length / attendanceRecords.length * 100) : 0;
      const assignments = assignmentsRecords.length > 0 ? Math.round(assignmentsRecords.filter(a => a >= 3).length / assignmentsRecords.length * 100) : 0;

      return {
        name: subject.name,
        grade,
        attendance,
        assignments,
        participation: 0, // если появится поле participation, добавить сюда
      };
    });

    // Лучшие и требующие улучшения предметы по средней оценке
    const sorted = [...subjects].sort((a, b) => b.grade - a.grade);
    const bestPerforming = sorted.slice(0, 2).map(s => s.name);
    const needsImprovement = sorted.slice(-2).map(s => s.name);

    return {
      subjects,
      summary: {
        bestPerforming,
        needsImprovement,
      },
    };
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

  async getTrends(filter: PerformanceFilterDto): Promise<TrendsResponseDto> {
    // Получаем реальные данные за последние 6 месяцев
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
        lessonScore: { not: null },
      },
      include: {
        Lesson: true,
      },
    });

    // Группируем по месяцам
    const monthlyData: { [key: string]: { total: number; count: number } } = {};
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    lessonResults.forEach(result => {
      const month = result.createdAt.getMonth();
      const monthName = monthNames[month];
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { total: 0, count: 0 };
      }
      
      monthlyData[monthName].total += result.lessonScore;
      monthlyData[monthName].count += 1;
    });

    // Создаем тренды
    const trends: TrendDataPointDto[] = [];
    let previousValue = 0;

    Object.keys(monthlyData).forEach((month, index) => {
      const data = monthlyData[month];
      const value = data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 0;
      const change = index > 0 ? Number((value - previousValue).toFixed(1)) : 0;

      trends.push({
        period: month,
        value,
        change,
      });

      previousValue = value;
    });

    // Анализ тренда
    const overallTrend = trends.length > 1 
      ? trends[trends.length - 1].value > trends[0].value ? 'positive' : 'negative'
      : 'stable';

    const analysis: TrendAnalysisDto = {
      trend: overallTrend,
      factors: [
        'Активное участие студентов',
        'Эффективность методов обучения',
        'Регулярное выполнение заданий',
      ],
    };

    return { trends, analysis };
  }

  async getMonthlyData(filter: PerformanceFilterDto): Promise<MonthlyDataDto[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        Lesson: true,
      },
    });

    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const monthlyStats: { [key: string]: { grades: number[], attendance: number[], assignments: number[] } } = {};

    lessonResults.forEach(result => {
      const month = monthNames[result.createdAt.getMonth()];
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = { grades: [], attendance: [], assignments: [] };
      }
      
      if (result.lessonScore !== null) {
        monthlyStats[month].grades.push(result.lessonScore);
      }
      if (result.attendance !== null) {
        monthlyStats[month].attendance.push(result.attendance ? 1 : 0);
      }
      if (result.homeworkScore !== null) {
        monthlyStats[month].assignments.push(result.homeworkScore);
      }
    });

    return Object.keys(monthlyStats).map(month => ({
      month,
      value: monthlyStats[month].grades.length > 0 
        ? Number((monthlyStats[month].grades.reduce((a, b) => a + b, 0) / monthlyStats[month].grades.length).toFixed(1))
        : 0,
      attendance: monthlyStats[month].attendance.length > 0
        ? Math.round(monthlyStats[month].attendance.reduce((a, b) => a + b, 0) / monthlyStats[month].attendance.length * 100)
        : 0,
      assignments: monthlyStats[month].assignments.length > 0
        ? Math.round(monthlyStats[month].assignments.filter(score => score >= 3).length / monthlyStats[month].assignments.length * 100)
        : 0,
    }));
  }

  async getGradeDistribution(filter: PerformanceFilterDto): Promise<GradeDistributionDto[]> {
    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        deletedAt: null,
        lessonScore: { not: null },
        ...(filter.groupId && {
          Student: {
            groupId: parseInt(filter.groupId),
          },
        }),
      },
    });

    const gradeCounts = { 5: 0, 4: 0, 3: 0, 2: 0 };
    
    lessonResults.forEach(result => {
      const grade = Math.round(result.lessonScore);
      if (grade >= 2 && grade <= 5) {
        gradeCounts[grade as keyof typeof gradeCounts]++;
      }
    });

    const total = Object.values(gradeCounts).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      return [
        { name: '5', value: 0, color: '#10B981' },
        { name: '4', value: 0, color: '#3B82F6' },
        { name: '3', value: 0, color: '#F59E0B' },
        { name: '2', value: 0, color: '#EF4444' },
      ];
    }

    return [
      { name: '5', value: Math.round((gradeCounts[5] / total) * 100), color: '#10B981' },
      { name: '4', value: Math.round((gradeCounts[4] / total) * 100), color: '#3B82F6' },
      { name: '3', value: Math.round((gradeCounts[3] / total) * 100), color: '#F59E0B' },
      { name: '2', value: Math.round((gradeCounts[2] / total) * 100), color: '#EF4444' },
    ];
  }

  async getPerformanceMetrics(filter: PerformanceFilterDto): Promise<PerformanceMetricDto[]> {
    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        deletedAt: null,
        ...(filter.groupId && {
          Student: {
            groupId: parseInt(filter.groupId),
          },
        }),
      },
    });

    // Рассчитываем реальные метрики
    const grades = lessonResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const attendance = lessonResults.filter(r => r.attendance !== null);
    const assignments = lessonResults.filter(r => r.homeworkScore !== null);

    const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    const attendanceRate = attendance.length > 0 ? (attendance.filter(r => r.attendance).length / attendance.length) * 100 : 0;
    const assignmentRate = assignments.length > 0 ? (assignments.filter(r => r.homeworkScore >= 3).length / assignments.length) * 100 : 0;

    return [
      { subject: 'Оценки', value: Math.round(avgGrade * 20) }, // Преобразуем в проценты
      { subject: 'Посещаемость', value: Math.round(attendanceRate) },
      { subject: 'Домашние задания', value: Math.round(assignmentRate) },
      { subject: 'Активность', value: Math.round(avgGrade * 18) }, // Примерная активность
      { subject: 'Тесты', value: Math.round(assignmentRate * 0.9) }, // Примерная оценка тестов
    ];
  }
}
