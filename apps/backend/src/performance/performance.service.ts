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
      where: {
        ...(filter.groupId && { id: parseInt(filter.groupId) }),
      },
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

    // Расчет реальных трендов за последний месяц
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentResults = allResults.filter(r => new Date(r.createdAt) >= oneMonthAgo);
    const olderResults = allResults.filter(r => new Date(r.createdAt) < oneMonthAgo);

    // Тренды по оценкам
    const recentGrades = recentResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const olderGrades = olderResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const recentAvgGrade = recentGrades.length > 0 ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
    const olderAvgGrade = olderGrades.length > 0 ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
    const gradeTrend = olderAvgGrade > 0 ? Number((recentAvgGrade - olderAvgGrade).toFixed(1)) : 0;

    // Тренды по успеваемости
    const recentPerformance = recentGrades.length > 0 ? (recentGrades.filter(g => g >= 3).length / recentGrades.length) * 100 : 0;
    const olderPerformance = olderGrades.length > 0 ? (olderGrades.filter(g => g >= 3).length / olderGrades.length) * 100 : 0;
    const performanceTrend = Math.round(recentPerformance - olderPerformance);

    // Тренды по посещаемости
    const recentAttendance = recentResults.filter(r => r.attendance !== null);
    const olderAttendance = olderResults.filter(r => r.attendance !== null);
    const recentAttendanceRate = recentAttendance.length > 0 ? (recentAttendance.filter(r => r.attendance).length / recentAttendance.length) * 100 : 0;
    const olderAttendanceRate = olderAttendance.length > 0 ? (olderAttendance.filter(r => r.attendance).length / olderAttendance.length) * 100 : 0;
    const attendanceTrend = Math.round(recentAttendanceRate - olderAttendanceRate);

    // Тренды по заданиям
    const recentHomework = recentResults.filter(r => r.homeworkScore !== null);
    const olderHomework = olderResults.filter(r => r.homeworkScore !== null);
    const recentHomeworkRate = recentHomework.length > 0 ? (recentHomework.filter(r => r.homeworkScore >= 3).length / recentHomework.length) * 100 : 0;
    const olderHomeworkRate = olderHomework.length > 0 ? (olderHomework.filter(r => r.homeworkScore >= 3).length / olderHomework.length) * 100 : 0;
    const assignmentsTrend = Math.round(recentHomeworkRate - olderHomeworkRate);

    const overview: PerformanceOverviewDto = {
      averageGrade: Number(averageGrade.toFixed(1)),
      performanceRate: Math.round(performanceRate),
      attendanceRate: Math.round(attendanceRate),
      assignmentCompletionRate: Math.round(assignmentCompletionRate),
      trends: {
        grade: gradeTrend,
        performance: performanceTrend,
        attendance: attendanceTrend,
        assignments: assignmentsTrend,
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
              where: { 
                deletedAt: null,
                ...(filter.groupId && {
                  Student: {
                    groupId: parseInt(filter.groupId),
                  },
                }),
              },
            },
          },
        },
      },
    });

    const subjects = subjectsRaw.map(subject => {
      // Собираем все результаты по всем урокам предмета (уже отфильтрованные по группе)
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

  async getClasses(filter?: PerformanceFilterDto): Promise<ClassesResponseDto> {
    // Получаем реальные группы из базы данных с результатами студентов
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

    const classes: ClassDataDto[] = groups.map((group) => {
      const allResults = group.students.flatMap(s => s.lessonsResults);

      // Рассчитываем реальные метрики для группы
      const grades = allResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
      const attendanceRecords = allResults.filter(r => r.attendance !== null);
      const homeworkRecords = allResults.filter(r => r.homeworkScore !== null);

      const averageGrade = grades.length > 0
        ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1))
        : 0;

      const attendance = attendanceRecords.length > 0
        ? Math.round((attendanceRecords.filter(r => r.attendance).length / attendanceRecords.length) * 100)
        : 0;

      const assignments = homeworkRecords.length > 0
        ? Math.round((homeworkRecords.filter(r => r.homeworkScore >= 3).length / homeworkRecords.length) * 100)
        : 0;

      return {
        id: group.id.toString(),
        name: group.name,
        averageGrade,
        attendance,
        assignments,
        studentsCount: group.students.length,
      };
    });

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
    // Получаем студентов с их результатами
    const students = await this.prisma.student.findMany({
      where: {
        ...(filter.groupId && { groupId: parseInt(filter.groupId) }),
      },
      include: {
        user: true,
        lessonsResults: {
          where: {
            deletedAt: null,
            lessonScore: { not: null },
          },
          include: {
            Lesson: {
              include: {
                studyPlan: true,
              },
            },
          },
        },
      },
    });

    // Рассчитываем средние оценки для каждого студента
    const studentsWithGrades = students.map(student => {
      const grades = student.lessonsResults.map(r => r.lessonScore).filter(g => g !== null);
      const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      // Расчет тренда (сравниваем последний месяц с предыдущим)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentGrades = student.lessonsResults
        .filter(r => new Date(r.createdAt) >= oneMonthAgo)
        .map(r => r.lessonScore)
        .filter(g => g !== null);

      const olderGrades = student.lessonsResults
        .filter(r => new Date(r.createdAt) < oneMonthAgo)
        .map(r => r.lessonScore)
        .filter(g => g !== null);

      const recentAvg = recentGrades.length > 0 ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
      const olderAvg = olderGrades.length > 0 ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
      const trend = olderAvg > 0 ? Number((recentAvg - olderAvg).toFixed(1)) : 0;

      // Группируем результаты по предметам
      const subjectResults = new Map<string, number[]>();
      student.lessonsResults.forEach(result => {
        const subjectName = result.Lesson?.studyPlan?.name || 'Неизвестный предмет';
        if (!subjectResults.has(subjectName)) {
          subjectResults.set(subjectName, []);
        }
        subjectResults.get(subjectName)?.push(result.lessonScore);
      });

      const subjects = Array.from(subjectResults.entries()).map(([subjectName, subjectGrades]) => {
        const subjectAvg = subjectGrades.length > 0 ?
          Number((subjectGrades.reduce((a, b) => a + b, 0) / subjectGrades.length).toFixed(1)) : 0;

        const recommendations = [];
        if (subjectAvg < 3) {
          recommendations.push('Дополнительные консультации', 'Повторение базового материала', 'Индивидуальная работа');
        } else if (subjectAvg < 3.5) {
          recommendations.push('Больше практических заданий', 'Регулярные проверки знаний');
        }

        return {
          name: subjectName,
          grade: subjectAvg,
          recommendations,
        };
      });

      return {
        student: {
          name: `${student.user.name} ${student.user.surname}`,
          grade: Number(averageGrade.toFixed(1)),
          trend,
        },
        subjects: subjects.slice(0, 3), // Ограничиваем 3 предметами
        averageGrade,
      };
    });

    // Фильтруем и сортируем отстающих студентов (средняя оценка < 3.5)
    const lowPerformingStudents: StudentWithSubjectsDto[] = studentsWithGrades
      .filter(s => s.averageGrade < 3.5 && s.averageGrade > 0)
      .sort((a, b) => a.averageGrade - b.averageGrade)
      .slice(0, 5)
      .map(({ student, subjects }) => ({ student, subjects }));

    return { students: lowPerformingStudents };
  }

  async getHighProgressStudents(
    filter: PerformanceFilterDto
  ): Promise<HighProgressStudentsResponseDto> {
    // Получаем студентов с их результатами
    const students = await this.prisma.student.findMany({
      where: {
        ...(filter.groupId && { groupId: parseInt(filter.groupId) }),
      },
      include: {
        user: true,
        lessonsResults: {
          where: {
            deletedAt: null,
            lessonScore: { not: null },
          },
          include: {
            Lesson: {
              include: {
                studyPlan: true,
              },
            },
          },
        },
      },
    });

    // Рассчитываем средние оценки и тренды для каждого студента
    const studentsWithProgress = students.map(student => {
      const grades = student.lessonsResults.map(r => r.lessonScore).filter(g => g !== null);
      const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      // Расчет тренда (сравниваем последний месяц с предыдущим)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentGrades = student.lessonsResults
        .filter(r => new Date(r.createdAt) >= oneMonthAgo)
        .map(r => r.lessonScore)
        .filter(g => g !== null);

      const olderGrades = student.lessonsResults
        .filter(r => new Date(r.createdAt) < oneMonthAgo)
        .map(r => r.lessonScore)
        .filter(g => g !== null);

      const recentAvg = recentGrades.length > 0 ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
      const olderAvg = olderGrades.length > 0 ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
      const trend = olderAvg > 0 ? Number((recentAvg - olderAvg).toFixed(1)) : 0;

      // Группируем результаты по предметам для анализа улучшений
      const subjectResults = new Map<string, { recent: number[], older: number[] }>();
      student.lessonsResults.forEach(result => {
        const subjectName = result.Lesson?.studyPlan?.name || 'Неизвестный предмет';
        if (!subjectResults.has(subjectName)) {
          subjectResults.set(subjectName, { recent: [], older: [] });
        }

        const subject = subjectResults.get(subjectName);
        if (!subject) return { subject: subjectName, improvement: 0 };
        if (new Date(result.createdAt) >= oneMonthAgo) {
          subject.recent.push(result.lessonScore);
        } else {
          subject.older.push(result.lessonScore);
        }
      });

      const improvements = Array.from(subjectResults.entries()).map(([subjectName, data]) => {
        const recentSubjectAvg = data.recent.length > 0 ?
          data.recent.reduce((a, b) => a + b, 0) / data.recent.length : 0;
        const olderSubjectAvg = data.older.length > 0 ?
          data.older.reduce((a, b) => a + b, 0) / data.older.length : 0;

        const improvement = olderSubjectAvg > 0 ? Number((recentSubjectAvg - olderSubjectAvg).toFixed(1)) : 0;

        return {
          subject: subjectName,
          improvement,
        };
      }).filter(imp => imp.improvement > 0).slice(0, 3); // Только положительные улучшения

      return {
        student: {
          name: `${student.user.name} ${student.user.surname}`,
          grade: Number(averageGrade.toFixed(1)),
          trend,
        },
        improvements,
        averageGrade,
        hasPositiveTrend: trend > 0,
      };
    });

    // Фильтруем и сортируем прогрессирующих студентов (положительный тренд и хорошие оценки)
    const highProgressStudents: StudentWithImprovementsDto[] = studentsWithProgress
      .filter(s => s.hasPositiveTrend && s.averageGrade >= 3.5)
      .sort((a, b) => b.student.trend - a.student.trend)
      .slice(0, 5)
      .map(({ student, improvements }) => ({ student, improvements }));

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

  async getAllStudentsPerformance(filter: PerformanceFilterDto): Promise<{ id: number; name: string; surname: string; group: string; averageGrade: number; attendanceRate: number; assignmentRate: number }[]> {
    // Получаем всех студентов с их результатами
    const students = await this.prisma.student.findMany({
      where: {
        ...(filter.groupId && { groupId: parseInt(filter.groupId) }),
      },
      include: {
        user: true,
        group: true,
        lessonsResults: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    // Рассчитываем статистику для каждого студента
    const studentsWithPerformance = students.map(student => {
      const allResults = student.lessonsResults;

      // Средняя оценка
      const grades = allResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
      const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      // Посещаемость
      const attendanceRecords = allResults.filter(r => r.attendance !== null);
      const attendanceRate = attendanceRecords.length > 0 
        ? (attendanceRecords.filter(r => r.attendance).length / attendanceRecords.length) * 100 
        : 0;

      // Выполнение заданий
      const assignmentRecords = allResults.filter(r => r.homeworkScore !== null);
      const assignmentRate = assignmentRecords.length > 0 
        ? (assignmentRecords.filter(r => r.homeworkScore >= 3).length / assignmentRecords.length) * 100 
        : 0;

      return {
        id: student.id,
        name: student.user.name,
        surname: student.user.surname,
        group: student.group?.name || 'Без группы',
        averageGrade: Number(averageGrade.toFixed(1)),
        attendanceRate: Math.round(attendanceRate),
        assignmentRate: Math.round(assignmentRate),
      };
    });

    // Сортируем по убыванию средней оценки
    return studentsWithPerformance.sort((a, b) => b.averageGrade - a.averageGrade);
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

    // Получаем данные о тестах (квизах)
    const quizResults = await this.prisma.quizSubmission.findMany({
      where: {
        deletedAt: null,
        score: { not: null },
        ...(filter.groupId && {
          student: {
            groupId: parseInt(filter.groupId),
          },
        }),
      },
    });

    const quizScores = quizResults.map(r => r.score).filter(s => s !== null);
    const avgQuizScore = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;
    const maxQuizScore = quizScores.length > 0 ? Math.max(...quizScores) : 100; // Предполагаем максимум 100
    const quizRate = maxQuizScore > 0 ? Math.round((avgQuizScore / maxQuizScore) * 100) : 0;

    return [
      { subject: 'Оценки', value: Math.round((avgGrade / 5) * 100) }, // Преобразуем из 5-балльной в проценты
      { subject: 'Посещаемость', value: Math.round(attendanceRate) },
      { subject: 'Домашние задания', value: Math.round(assignmentRate) },
      { subject: 'Тесты', value: quizRate },
      { subject: 'Общая успеваемость', value: Math.round(((avgGrade / 5) * 100 + attendanceRate + assignmentRate + quizRate) / 4) },
    ];
  }

  async getParentStatistics(userId: number, filter: PerformanceFilterDto): Promise<StatisticsResponseDto> {
    // Находим родителя и его детей
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            lessonsResults: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      // Возвращаем пустую статистику, если у родителя нет детей
      return {
        overview: {
          averageGrade: 0,
          performanceRate: 0,
          attendanceRate: 0,
          assignmentCompletionRate: 0,
          trends: {
            grade: 0,
            performance: 0,
            attendance: 0,
            assignments: 0,
          },
        },
      };
    }

    // Получаем все результаты детей родителя
    const allResults = parent.students.flatMap(student => student.lessonsResults);

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

    // Расчет трендов за последний месяц
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentResults = allResults.filter(r => new Date(r.createdAt) >= oneMonthAgo);
    const olderResults = allResults.filter(r => new Date(r.createdAt) < oneMonthAgo);

    // Тренды по оценкам
    const recentGrades = recentResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const olderGrades = olderResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const recentAvgGrade = recentGrades.length > 0 ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
    const olderAvgGrade = olderGrades.length > 0 ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
    const gradeTrend = olderAvgGrade > 0 ? Number((recentAvgGrade - olderAvgGrade).toFixed(1)) : 0;

    // Тренды по успеваемости
    const recentPerformance = recentGrades.length > 0 ? (recentGrades.filter(g => g >= 3).length / recentGrades.length) * 100 : 0;
    const olderPerformance = olderGrades.length > 0 ? (olderGrades.filter(g => g >= 3).length / olderGrades.length) * 100 : 0;
    const performanceTrend = Math.round(recentPerformance - olderPerformance);

    // Тренды по посещаемости
    const recentAttendance = recentResults.filter(r => r.attendance !== null);
    const olderAttendance = olderResults.filter(r => r.attendance !== null);
    const recentAttendanceRate = recentAttendance.length > 0 ? (recentAttendance.filter(r => r.attendance).length / recentAttendance.length) * 100 : 0;
    const olderAttendanceRate = olderAttendance.length > 0 ? (olderAttendance.filter(r => r.attendance).length / olderAttendance.length) * 100 : 0;
    const attendanceTrend = Math.round(recentAttendanceRate - olderAttendanceRate);

    // Тренды по заданиям
    const recentHomework = recentResults.filter(r => r.homeworkScore !== null);
    const olderHomework = olderResults.filter(r => r.homeworkScore !== null);
    const recentHomeworkRate = recentHomework.length > 0 ? (recentHomework.filter(r => r.homeworkScore >= 3).length / recentHomework.length) * 100 : 0;
    const olderHomeworkRate = olderHomework.length > 0 ? (olderHomework.filter(r => r.homeworkScore >= 3).length / olderHomework.length) * 100 : 0;
    const assignmentsTrend = Math.round(recentHomeworkRate - olderHomeworkRate);

    const overview: PerformanceOverviewDto = {
      averageGrade: Number(averageGrade.toFixed(1)),
      performanceRate: Math.round(performanceRate),
      attendanceRate: Math.round(attendanceRate),
      assignmentCompletionRate: Math.round(assignmentCompletionRate),
      trends: {
        grade: gradeTrend,
        performance: performanceTrend,
        attendance: attendanceTrend,
        assignments: assignmentsTrend,
      },
    };

    return { overview };
  }

  async getParentSubjects(userId: number, filter: PerformanceFilterDto): Promise<SubjectsResponseDto> {
    // Находим родителя и его детей
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            lessonsResults: {
              where: { deletedAt: null },
              include: {
                Lesson: {
                  include: {
                    studyPlan: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return {
        subjects: [],
        summary: {
          bestPerforming: [],
          needsImprovement: [],
        },
      };
    }

    // Собираем все результаты детей по предметам
    const allResults = parent.students.flatMap(student => student.lessonsResults);
    
    // Группируем результаты по предметам (studyPlan)
    const subjectResultsMap = new Map<string, any[]>();
    
    allResults.forEach(result => {
      if (result.Lesson?.studyPlan) {
        const subjectName = result.Lesson.studyPlan.name;
        if (!subjectResultsMap.has(subjectName)) {
          subjectResultsMap.set(subjectName, []);
        }
        subjectResultsMap.get(subjectName)?.push(result);
      }
    });

    // Рассчитываем статистику по каждому предмету
    const subjects = Array.from(subjectResultsMap.entries()).map(([subjectName, results]) => {
      const grades = results.map(r => r.lessonScore).filter(v => v !== null);
      const attendanceRecords = results.map(r => r.attendance).filter(v => v !== null);
      const assignmentsRecords = results.map(r => r.homeworkScore).filter(v => v !== null);

      const grade = grades.length > 0 ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)) : 0;
      const attendance = attendanceRecords.length > 0 ? Math.round(attendanceRecords.filter(a => a).length / attendanceRecords.length * 100) : 0;
      const assignments = assignmentsRecords.length > 0 ? Math.round(assignmentsRecords.filter(a => a >= 3).length / assignmentsRecords.length * 100) : 0;

      return {
        name: subjectName,
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

  async getParentClasses(userId: number): Promise<ClassesResponseDto> {
    // Находим родителя и его детей с их группами
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            group: true,
            lessonsResults: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return {
        classes: [],
        statistics: {
          averagePerformance: 0,
          topClasses: [],
          totalStudents: 0,
        },
      };
    }

    // Группируем детей по группам
    const groupsMap = new Map<number, { group: any; students: any[] }>();
    
    parent.students.forEach(student => {
      if (student.group) {
        const groupId = student.group.id;
        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, {
            group: student.group,
            students: [],
          });
        }
        groupsMap.get(groupId)?.students.push(student);
      }
    });

    // Рассчитываем статистику для каждой группы (только по детям родителя в этой группе)
    const classes = Array.from(groupsMap.values()).map(({ group, students }) => {
      const allResults = students.flatMap(s => s.lessonsResults);

      // Рассчитываем метрики только по детям родителя в этой группе
      const grades = allResults.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
      const attendanceRecords = allResults.filter(r => r.attendance !== null);
      const homeworkRecords = allResults.filter(r => r.homeworkScore !== null);

      const averageGrade = grades.length > 0
        ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1))
        : 0;

      const attendance = attendanceRecords.length > 0
        ? Math.round((attendanceRecords.filter(r => r.attendance).length / attendanceRecords.length) * 100)
        : 0;

      const assignments = homeworkRecords.length > 0
        ? Math.round((homeworkRecords.filter(r => r.homeworkScore >= 3).length / homeworkRecords.length) * 100)
        : 0;

      return {
        id: group.id.toString(),
        name: group.name,
        averageGrade,
        attendance,
        assignments,
        studentsCount: students.length, // Количество детей родителя в этой группе
      };
    });

    const totalStudents = classes.reduce((sum, c) => sum + c.studentsCount, 0);
    const averagePerformance = classes.length > 0
      ? Number((classes.reduce((sum, c) => sum + c.averageGrade, 0) / classes.length).toFixed(1))
      : 0;
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
}
