import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PerformanceFilterDto } from './dto/performance-filter.dto';
import {
  PerformanceOverviewDto,
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

  async getClasses(_filter?: PerformanceFilterDto): Promise<ClassesResponseDto> {
    void _filter;
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
    const baseWhere = {
      deletedAt: null,
      lessonScore: { not: null as any },
      ...(filter.groupId && {
        Student: { groupId: parseInt(filter.groupId) }
      })
    };

    // Получаем последние 2 месяца результатов (для тренда) и общий массив одним запросом для агрегации
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const results = await this.prisma.lessonResult.findMany({
      where: baseWhere,
      select: {
        studentId: true,
        lessonScore: true,
        createdAt: true,
        Lesson: { select: { studyPlan: { select: { name: true } } } },
        Student: { select: { user: { select: { name: true, surname: true } } } }
      }
    });

    // Группируем по студентам
    type LowRes = (typeof results)[number];
    const byStudent = new Map<number, LowRes[]>();
    for (const r of results) {
      if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []);
      byStudent.get(r.studentId)?.push(r);
    }

    const aggregates: { student: StudentWithSubjectsDto['student']; subjects: StudentWithSubjectsDto['subjects']; averageGrade: number }[] = [];
    for (const arr of byStudent.values()) {
      const grades = arr.map(r => r.lessonScore).filter((g): g is number => g != null);
      if (!grades.length) continue;
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
      const recent = arr.filter(r => r.createdAt >= oneMonthAgo).map(r => r.lessonScore).filter((g): g is number => g != null);
      const older = arr.filter(r => r.createdAt < oneMonthAgo).map(r => r.lessonScore).filter((g): g is number => g != null);
      const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
      const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : 0;
      const trend = olderAvg > 0 ? Number((recentAvg - olderAvg).toFixed(1)) : 0;

      const subjectMap = new Map<string, number[]>();
      for (const r of arr) {
        const subj = r.Lesson?.studyPlan?.name || 'Неизвестный предмет';
        if (!subjectMap.has(subj)) subjectMap.set(subj, []);
        if (r.lessonScore != null) subjectMap.get(subj)?.push(r.lessonScore);
      }
      const subjects = Array.from(subjectMap.entries()).map(([name, list]) => {
        const subjectAvg = list.reduce((a, b) => a + b, 0) / list.length;
        const recommendations: string[] = [];
        if (subjectAvg < 3) recommendations.push('Дополнительные консультации', 'Повторение базового материала', 'Индивидуальная работа');
        else if (subjectAvg < 3.5) recommendations.push('Больше практических заданий', 'Регулярные проверки знаний');
        return { name, grade: Number(subjectAvg.toFixed(1)), recommendations };
      }).sort((a, b) => a.grade - b.grade).slice(0, 3);

      const sample = arr[0];
      aggregates.push({
        student: { name: `${sample.Student.user.name} ${sample.Student.user.surname}`, grade: Number(avg.toFixed(1)), trend },
        subjects,
        averageGrade: avg
      });
    }

    const lowPerformingStudents = aggregates
      .filter(a => a.averageGrade < 3.5 && a.averageGrade > 0)
      .sort((a, b) => a.averageGrade - b.averageGrade)
      .slice(0, 5)
      .map(a => ({ student: a.student, subjects: a.subjects }));

    return { students: lowPerformingStudents };
  }

  async getHighProgressStudents(
    filter: PerformanceFilterDto
  ): Promise<HighProgressStudentsResponseDto> {
    const baseWhere = {
      deletedAt: null,
      lessonScore: { not: null as any },
      ...(filter.groupId && { Student: { groupId: parseInt(filter.groupId) } })
    };
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const results = await this.prisma.lessonResult.findMany({
      where: baseWhere,
      select: {
        studentId: true,
        lessonScore: true,
        createdAt: true,
        Lesson: { select: { studyPlan: { select: { name: true } } } },
        Student: { select: { user: { select: { name: true, surname: true } } } }
      }
    });
    type ProgRes = (typeof results)[number];
    const byStudent = new Map<number, ProgRes[]>();
    for (const r of results) {
      if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []);
      byStudent.get(r.studentId)?.push(r);
    }
    const progress: { student: { name: string; grade: number; trend: number }; improvements: { subject: string; improvement: number }[]; averageGrade: number; hasPositiveTrend: boolean }[] = [];
    for (const arr of byStudent.values()) {
      const grades = arr.map(r => r.lessonScore).filter((g): g is number => g != null);
      if (!grades.length) continue;
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
      const recent = arr.filter(r => r.createdAt >= oneMonthAgo).map(r => r.lessonScore).filter((g): g is number => g != null);
      const older = arr.filter(r => r.createdAt < oneMonthAgo).map(r => r.lessonScore).filter((g): g is number => g != null);
      const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
      const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : 0;
      const trend = olderAvg > 0 ? Number((recentAvg - olderAvg).toFixed(1)) : 0;
      const subjMap = new Map<string, { recent: number[], older: number[] }>();
      for (const r of arr) {
        const subj = r.Lesson?.studyPlan?.name || 'Неизвестный предмет';
        if (!subjMap.has(subj)) subjMap.set(subj, { recent: [], older: [] });
        if (r.createdAt >= oneMonthAgo) {
          if (r.lessonScore != null) subjMap.get(subj)?.recent.push(r.lessonScore);
        } else {
          if (r.lessonScore != null) subjMap.get(subj)?.older.push(r.lessonScore);
        }
      }
      const improvements = Array.from(subjMap.entries()).map(([subj, data]) => {
        const rAvg = data.recent.length ? data.recent.reduce((a, b) => a + b, 0) / data.recent.length : 0;
        const oAvg = data.older.length ? data.older.reduce((a, b) => a + b, 0) / data.older.length : 0;
        return { subject: subj, improvement: Number((rAvg - oAvg).toFixed(1)) };
      }).filter(i => i.improvement > 0).sort((a, b) => b.improvement - a.improvement).slice(0, 3);
      const sample = arr[0];
      progress.push({ student: { name: `${sample.Student.user.name} ${sample.Student.user.surname}`, grade: Number(avg.toFixed(1)), trend }, improvements, averageGrade: avg, hasPositiveTrend: trend > 0 });
    }
    const highProgressStudents = progress
      .filter(p => p.hasPositiveTrend && p.averageGrade >= 3.5)
      .sort((a, b) => b.student.trend - a.student.trend)
      .slice(0, 5)
      .map(p => ({ student: p.student, improvements: p.improvements }));
    return { students: highProgressStudents };
  }

  async getTrends(_filter: PerformanceFilterDto): Promise<TrendsResponseDto> {
    void _filter;
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
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    // Итерация по месяцам (<=7 запросов * несколько агрегатов вместо тысяч строк)
    const result: MonthlyDataDto[] = [];
    for (let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1); cursor <= endDate; cursor.setMonth(cursor.getMonth() + 1)) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); // exclusive
      const whereBase = {
        deletedAt: null as any,
        createdAt: { gte: monthStart, lt: monthEnd },
        ...(filter.groupId && { Student: { groupId: parseInt(filter.groupId) } })
      };

      const [gradeAgg, attendanceAll, attendancePresent, hwAll, hwGood] = await Promise.all([
        this.prisma.lessonResult.aggregate({ where: { ...whereBase, lessonScore: { not: null } }, _avg: { lessonScore: true } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, attendance: { not: null } } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, attendance: true } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, homeworkScore: { not: null } } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, homeworkScore: { gte: 3 } } }),
      ]);

      result.push({
        month: monthNames[monthStart.getMonth()],
        value: gradeAgg._avg.lessonScore ? Number(gradeAgg._avg.lessonScore.toFixed(1)) : 0,
        attendance: attendanceAll ? Math.round(attendancePresent / attendanceAll * 100) : 0,
        assignments: hwAll ? Math.round(hwGood / hwAll * 100) : 0,
      });
    }
    return result;
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

    const gradeCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };

    lessonResults.forEach(result => {
      const grade = Math.round(result.lessonScore);
      if (grade >= 2 && grade <= 5) {
        gradeCounts[grade]++;
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
    const quizResults = await this.prisma.quizAttempt.findMany({
      where: {
        deletedAt: null,
        score: { not: null },
        status: 'COMPLETED',
        ...(filter.groupId && {
          student: {
            groupId: parseInt(filter.groupId),
          },
        }),
      },
      include: {
        quiz: {
          select: {
            maxScore: true,
          },
        },
      },
    });

    const quizScores = quizResults.flatMap(r => (typeof r.score === 'number' ? [r.score] : []));
    const avgQuizScore = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;

    // Получаем максимальный балл из настроек тестов или используем средний максимальный балл
    const maxScores = quizResults.map(r => r.quiz?.maxScore || 100).filter(s => s > 0);
    const avgMaxScore = maxScores.length > 0 ? maxScores.reduce((a, b) => a + b, 0) / maxScores.length : 100;
    const quizRate = avgMaxScore > 0 ? Math.round((avgQuizScore / avgMaxScore) * 100) : 0;

    return [
      { subject: 'Оценки', value: Math.round((avgGrade / 5) * 100) }, // Преобразуем из 5-балльной в проценты
      { subject: 'Посещаемость', value: Math.round(attendanceRate) },
      { subject: 'Домашние задания', value: Math.round(assignmentRate) },
      { subject: 'Тесты', value: quizRate },
      { subject: 'Общая успеваемость', value: Math.round(((avgGrade / 5) * 100 + attendanceRate + assignmentRate + quizRate) / 4) },
    ];
  }

  async getParentStatistics(userId: number, _filter: PerformanceFilterDto): Promise<StatisticsResponseDto> {
    void _filter;
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

  async getParentSubjects(userId: number, _filter: PerformanceFilterDto): Promise<SubjectsResponseDto> {
    void _filter;
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

  async getStudentStatistics(userId: number, _filter: PerformanceFilterDto): Promise<StatisticsResponseDto> {
    void _filter;
    // Находим студента
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        lessonsResults: {
          where: { deletedAt: null },
        },
      },
    });

    if (!student) {
      // Возвращаем пустую статистику, если студент не найден
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

    // Получаем все результаты студента
    const allResults = student.lessonsResults;

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

  async getStudentSubjects(userId: number, _filter: PerformanceFilterDto): Promise<SubjectsResponseDto> {
    void _filter;
    // Находим студента
    const student = await this.prisma.student.findUnique({
      where: { userId },
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
    });

    if (!student) {
      return {
        subjects: [],
        summary: {
          bestPerforming: [],
          needsImprovement: [],
        },
      };
    }

    // Группируем результаты студента по предметам (studyPlan)
    const subjectResultsMap = new Map<string, any[]>();

    student.lessonsResults.forEach(result => {
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

  async getStudentClasses(userId: number): Promise<ClassesResponseDto> {
    // Находим студента с его группой
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        group: true,
        lessonsResults: {
          where: { deletedAt: null },
        },
      },
    });

    if (!student || !student.group) {
      return {
        classes: [],
        statistics: {
          averagePerformance: 0,
          topClasses: [],
          totalStudents: 0,
        },
      };
    }

    // Рассчитываем статистику только для группы студента, но показываем только его результаты
    const allResults = student.lessonsResults;

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

    const classes = [{
      id: student.group.id.toString(),
      name: student.group.name,
      averageGrade,
      attendance,
      assignments,
      studentsCount: 1, // Показываем только данные самого студента
    }];

    return {
      classes,
      statistics: {
        averagePerformance: averageGrade,
        topClasses: [student.group.name],
        totalStudents: 1,
      },
    };
  }

  // === TEACHER-SCOPED HELPERS AND METHODS ===

  private async getTeacherGroupIds(userId: number, filter?: PerformanceFilterDto): Promise<number[]> {
    // Найти преподавателя
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Найти группы, в которых у преподавателя есть учебные планы
    const groups = await this.prisma.group.findMany({
      where: {
        deletedAt: null,
        ...(filter?.groupId
          ? { id: parseInt(filter.groupId) }
          : {
            studyPlans: {
              some: {
                teacherId: teacher.id,
                deletedAt: null,
              },
            },
          }),
      },
      select: { id: true },
    });

    return groups.map((g) => g.id);
  }

  async getTeacherStatistics(userId: number, filter: PerformanceFilterDto): Promise<StatisticsResponseDto> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
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

    // Получаем студентов только из групп преподавателя
    const students = await this.prisma.student.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        lessonsResults: {
          where: { deletedAt: null },
        },
      },
    });

    const allResults = students.flatMap((s) => s.lessonsResults);

    const lessonScores = allResults.filter((r) => r.lessonScore !== null).map((r) => r.lessonScore);
    const averageGrade = lessonScores.length ? lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length : 0;

    const attendanceRecords = allResults.filter((r) => r.attendance !== null);
    const attendanceRate = attendanceRecords.length
      ? (attendanceRecords.filter((r) => r.attendance === true).length / attendanceRecords.length) * 100
      : 0;

    const homeworkRecords = allResults.filter((r) => r.homeworkScore !== null);
    const assignmentCompletionRate = homeworkRecords.length
      ? (homeworkRecords.filter((r) => r.homeworkScore >= 3).length / homeworkRecords.length) * 100
      : 0;

    const performanceRate = lessonScores.length
      ? (lessonScores.filter((score) => score >= 3).length / lessonScores.length) * 100
      : 0;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentResults = allResults.filter((r) => new Date(r.createdAt) >= oneMonthAgo);
    const olderResults = allResults.filter((r) => new Date(r.createdAt) < oneMonthAgo);

    const recentGrades = recentResults.filter((r) => r.lessonScore !== null).map((r) => r.lessonScore);
    const olderGrades = olderResults.filter((r) => r.lessonScore !== null).map((r) => r.lessonScore);
    const recentAvgGrade = recentGrades.length ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
    const olderAvgGrade = olderGrades.length ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
    const gradeTrend = olderAvgGrade > 0 ? Number((recentAvgGrade - olderAvgGrade).toFixed(1)) : 0;

    const recentPerformance = recentGrades.length ? (recentGrades.filter((g) => g >= 3).length / recentGrades.length) * 100 : 0;
    const olderPerformance = olderGrades.length ? (olderGrades.filter((g) => g >= 3).length / olderGrades.length) * 100 : 0;
    const performanceTrend = Math.round(recentPerformance - olderPerformance);

    const recentAttendance = recentResults.filter((r) => r.attendance !== null);
    const olderAttendance = olderResults.filter((r) => r.attendance !== null);
    const recentAttendanceRate = recentAttendance.length
      ? (recentAttendance.filter((r) => r.attendance).length / recentAttendance.length) * 100
      : 0;
    const olderAttendanceRate = olderAttendance.length
      ? (olderAttendance.filter((r) => r.attendance).length / olderAttendance.length) * 100
      : 0;
    const attendanceTrend = Math.round(recentAttendanceRate - olderAttendanceRate);

    const recentHomework = recentResults.filter((r) => r.homeworkScore !== null);
    const olderHomework = olderResults.filter((r) => r.homeworkScore !== null);
    const recentHomeworkRate = recentHomework.length
      ? (recentHomework.filter((r) => r.homeworkScore >= 3).length / recentHomework.length) * 100
      : 0;
    const olderHomeworkRate = olderHomework.length
      ? (olderHomework.filter((r) => r.homeworkScore >= 3).length / olderHomework.length) * 100
      : 0;
    const assignmentsTrend = Math.round(recentHomeworkRate - olderHomeworkRate);

    return {
      overview: {
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
      },
    };
  }

  async getTeacherSubjects(userId: number, filter: PerformanceFilterDto): Promise<SubjectsResponseDto> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
      return {
        subjects: [],
        summary: {
          bestPerforming: [],
          needsImprovement: [],
        },
      };
    }

    // Собираем результаты уроков только по группам преподавателя
    const results = await this.prisma.lessonResult.findMany({
      where: {
        deletedAt: null,
        Student: { groupId: { in: groupIds } },
      },
      include: {
        Lesson: {
          include: {
            studyPlan: true,
          },
        },
      },
    });

    const bySubject = new Map<string, { grades: number[]; attendance: number[]; assignments: number[] }>();

    results.forEach((r) => {
      const subjectName = r.Lesson?.studyPlan?.name || 'Неизвестный предмет';
      let entry = bySubject.get(subjectName);
      if (!entry) {
        entry = { grades: [], attendance: [], assignments: [] };
        bySubject.set(subjectName, entry);
      }
      if (r.lessonScore !== null) entry.grades.push(r.lessonScore);
      if (r.attendance !== null) entry.attendance.push(r.attendance ? 1 : 0);
      if (r.homeworkScore !== null) entry.assignments.push(r.homeworkScore);
    });

    const subjects = Array.from(bySubject.entries()).map(([name, data]) => {
      const grade = data.grades.length ? Number((data.grades.reduce((a, b) => a + b, 0) / data.grades.length).toFixed(1)) : 0;
      const attendance = data.attendance.length
        ? Math.round((data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length) * 100)
        : 0;
      const assignments = data.assignments.length
        ? Math.round((data.assignments.filter((v) => v >= 3).length / data.assignments.length) * 100)
        : 0;

      return { name, grade, attendance, assignments, participation: 0 };
    });

    const sorted = [...subjects].sort((a, b) => b.grade - a.grade);
    const bestPerforming = sorted.slice(0, 2).map((s) => s.name);
    const needsImprovement = sorted.slice(-2).map((s) => s.name);

    return {
      subjects,
      summary: {
        bestPerforming,
        needsImprovement,
      },
    };
  }

  async getTeacherClasses(userId: number, filter: PerformanceFilterDto): Promise<ClassesResponseDto> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
      return {
        classes: [],
        statistics: {
          averagePerformance: 0,
          topClasses: [],
          totalStudents: 0,
        },
      };
    }

    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      include: {
        students: {
          include: {
            lessonsResults: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    const classes = groups.map((group) => {
      const allResults = group.students.flatMap((s) => s.lessonsResults);

      const grades = allResults.filter((r) => r.lessonScore !== null).map((r) => r.lessonScore);
      const attendanceRecords = allResults.filter((r) => r.attendance !== null);
      const homeworkRecords = allResults.filter((r) => r.homeworkScore !== null);

      const averageGrade = grades.length ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)) : 0;
      const attendance = attendanceRecords.length
        ? Math.round((attendanceRecords.filter((r) => r.attendance).length / attendanceRecords.length) * 100)
        : 0;
      const assignments = homeworkRecords.length
        ? Math.round((homeworkRecords.filter((r) => r.homeworkScore >= 3).length / homeworkRecords.length) * 100)
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
    const averagePerformance = classes.length
      ? Number((classes.reduce((sum, c) => sum + c.averageGrade, 0) / classes.length).toFixed(1))
      : 0;
    const topClasses = [...classes].sort((a, b) => b.averageGrade - a.averageGrade).slice(0, 2).map((c) => c.name);

    return {
      classes,
      statistics: {
        averagePerformance,
        topClasses,
        totalStudents,
      },
    };
  }

  async getLowPerformingStudentsForTeacher(
    userId: number,
    filter: PerformanceFilterDto,
  ): Promise<LowPerformingStudentsResponseDto> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
      return { students: [] };
    }

    const students = await this.prisma.student.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        user: true,
        lessonsResults: {
          where: { deletedAt: null, lessonScore: { not: null } },
          include: {
            Lesson: {
              include: { studyPlan: true },
            },
          },
        },
      },
    });

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const studentsWithGrades = students.map((student) => {
      const grades = student.lessonsResults.map((r) => r.lessonScore).filter((g) => g !== null);
      const averageGrade = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      const recentGrades = student.lessonsResults
        .filter((r) => new Date(r.createdAt) >= oneMonthAgo)
        .map((r) => r.lessonScore)
        .filter((g) => g !== null);
      const olderGrades = student.lessonsResults
        .filter((r) => new Date(r.createdAt) < oneMonthAgo)
        .map((r) => r.lessonScore)
        .filter((g) => g !== null);

      const recentAvg = recentGrades.length ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
      const olderAvg = olderGrades.length ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
      const trend = olderAvg > 0 ? Number((recentAvg - olderAvg).toFixed(1)) : 0;

      const subjectResults = new Map<string, number[]>();
      student.lessonsResults.forEach((result) => {
        const subjectName = result.Lesson?.studyPlan?.name || 'Неизвестный предмет';
        if (!subjectResults.has(subjectName)) subjectResults.set(subjectName, []);
        subjectResults.get(subjectName)?.push(result.lessonScore);
      });

      const subjects = Array.from(subjectResults.entries()).map(([subjectName, subjectGrades]) => {
        const subjectAvg = subjectGrades.length
          ? Number((subjectGrades.reduce((a, b) => a + b, 0) / subjectGrades.length).toFixed(1))
          : 0;

        const recommendations: string[] = [];
        if (subjectAvg < 3) {
          recommendations.push('Дополнительные консультации', 'Повторение базового материала', 'Индивидуальная работа');
        } else if (subjectAvg < 3.5) {
          recommendations.push('Больше практических заданий', 'Регулярные проверки знаний');
        }

        return { name: subjectName, grade: subjectAvg, recommendations };
      });

      return {
        student: { name: `${student.user.name} ${student.user.surname}`, grade: Number(averageGrade.toFixed(1)), trend },
        subjects: subjects.slice(0, 3),
        averageGrade,
      };
    });

    const lowPerformingStudents = studentsWithGrades
      .filter((s) => s.averageGrade < 3.5 && s.averageGrade > 0)
      .sort((a, b) => a.averageGrade - b.averageGrade)
      .slice(0, 5)
      .map(({ student, subjects }) => ({ student, subjects }));

    return { students: lowPerformingStudents };
  }

  async getHighProgressStudentsForTeacher(
    userId: number,
    filter: PerformanceFilterDto,
  ): Promise<HighProgressStudentsResponseDto> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
      return { students: [] };
    }

    const students = await this.prisma.student.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        user: true,
        lessonsResults: {
          where: { deletedAt: null, lessonScore: { not: null } },
          include: {
            Lesson: { include: { studyPlan: true } },
          },
        },
      },
    });

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const studentsWithProgress = students.map((student) => {
      const grades = student.lessonsResults.map((r) => r.lessonScore).filter((g) => g !== null);
      const averageGrade = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      const recentGrades = student.lessonsResults
        .filter((r) => new Date(r.createdAt) >= oneMonthAgo)
        .map((r) => r.lessonScore)
        .filter((g) => g !== null);

      const olderGrades = student.lessonsResults
        .filter((r) => new Date(r.createdAt) < oneMonthAgo)
        .map((r) => r.lessonScore)
        .filter((g) => g !== null);

      const recentAvg = recentGrades.length ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length : 0;
      const olderAvg = olderGrades.length ? olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length : 0;
      const trend = olderAvg > 0 ? Number((recentAvg - olderAvg).toFixed(1)) : 0;

      const subjectResults = new Map<string, { recent: number[]; older: number[] }>();
      student.lessonsResults.forEach((result) => {
        const subjectName = result.Lesson?.studyPlan?.name || 'Неизвестный предмет';
        if (!subjectResults.has(subjectName)) subjectResults.set(subjectName, { recent: [], older: [] });
        const subject = subjectResults.get(subjectName);
        if (!subject) return;
        if (new Date(result.createdAt) >= oneMonthAgo) subject.recent.push(result.lessonScore);
        else subject.older.push(result.lessonScore);
      });

      const improvements = Array.from(subjectResults.entries())
        .map(([subjectName, data]) => {
          const recentSubjectAvg = data.recent.length ? data.recent.reduce((a, b) => a + b, 0) / data.recent.length : 0;
          const olderSubjectAvg = data.older.length ? data.older.reduce((a, b) => a + b, 0) / data.older.length : 0;
          const improvement = olderSubjectAvg > 0 ? Number((recentSubjectAvg - olderSubjectAvg).toFixed(1)) : 0;
          return { subject: subjectName, improvement };
        })
        .filter((imp) => imp.improvement > 0)
        .slice(0, 3);

      return {
        student: { name: `${student.user.name} ${student.user.surname}`, grade: Number(averageGrade.toFixed(1)), trend },
        improvements,
        averageGrade,
        hasPositiveTrend: trend > 0,
      };
    });

    const highProgressStudents = studentsWithProgress
      .filter((s) => s.hasPositiveTrend && s.averageGrade >= 3.5)
      .sort((a, b) => b.student.trend - a.student.trend)
      .slice(0, 5)
      .map(({ student, improvements }) => ({ student, improvements }));

    return { students: highProgressStudents };
  }

  async getMonthlyDataForTeacher(userId: number, filter: PerformanceFilterDto): Promise<MonthlyDataDto[]> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);
    if (!groupIds.length) return [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const result: MonthlyDataDto[] = [];
    for (let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1); cursor <= endDate; cursor.setMonth(cursor.getMonth() + 1)) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const whereBase = { deletedAt: null as any, createdAt: { gte: monthStart, lt: monthEnd }, Student: { groupId: { in: groupIds } } };
      const [gradeAgg, attendanceAll, attendancePresent, hwAll, hwGood] = await Promise.all([
        this.prisma.lessonResult.aggregate({ where: { ...whereBase, lessonScore: { not: null } }, _avg: { lessonScore: true } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, attendance: { not: null } } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, attendance: true } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, homeworkScore: { not: null } } }),
        this.prisma.lessonResult.count({ where: { ...whereBase, homeworkScore: { gte: 3 } } }),
      ]);
      result.push({
        month: monthNames[monthStart.getMonth()],
        value: gradeAgg._avg.lessonScore ? Number(gradeAgg._avg.lessonScore.toFixed(1)) : 0,
        attendance: attendanceAll ? Math.round(attendancePresent / attendanceAll * 100) : 0,
        assignments: hwAll ? Math.round(hwGood / hwAll * 100) : 0,
      });
    }
    return result;
  }

  async getGradeDistributionForTeacher(userId: number, filter: PerformanceFilterDto): Promise<GradeDistributionDto[]> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
      return [
        { name: '5', value: 0, color: '#10B981' },
        { name: '4', value: 0, color: '#3B82F6' },
        { name: '3', value: 0, color: '#F59E0B' },
        { name: '2', value: 0, color: '#EF4444' },
      ];
    }

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        deletedAt: null,
        lessonScore: { not: null },
        Student: { groupId: { in: groupIds } },
      },
    });

    const gradeCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };

    lessonResults.forEach((result) => {
      const grade = Math.round(result.lessonScore);
      if (grade >= 2 && grade <= 5) gradeCounts[grade]++;
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

  async getPerformanceMetricsForTeacher(userId: number, filter: PerformanceFilterDto): Promise<PerformanceMetricDto[]> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) {
      return [
        { subject: 'Оценки', value: 0 },
        { subject: 'Посещаемость', value: 0 },
        { subject: 'Домашние задания', value: 0 },
        { subject: 'Тесты', value: 0 },
        { subject: 'Общая успеваемость', value: 0 },
      ];
    }

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: {
        deletedAt: null,
        Student: { groupId: { in: groupIds } },
      },
    });

    const grades = lessonResults.filter((r) => r.lessonScore !== null).map((r) => r.lessonScore);
    const attendance = lessonResults.filter((r) => r.attendance !== null);
    const assignments = lessonResults.filter((r) => r.homeworkScore !== null);

    const avgGrade = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    const attendanceRate = attendance.length ? (attendance.filter((r) => r.attendance).length / attendance.length) * 100 : 0;
    const assignmentRate = assignments.length
      ? (assignments.filter((r) => r.homeworkScore >= 3).length / assignments.length) * 100
      : 0;

    // Ограничим тесты только студентами групп преподавателя
    const quizResults = await this.prisma.quizAttempt.findMany({
      where: {
        deletedAt: null,
        score: { not: null },
        status: 'COMPLETED',
        student: {
          groupId: { in: groupIds },
        },
      },
      include: {
        quiz: { select: { maxScore: true } },
      },
    });

    const quizScores = quizResults.map((r) => r.score).filter((s) => s !== null);
    const avgQuizScore = quizScores.length ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;
    const maxScores = quizResults.map((r) => r.quiz?.maxScore || 100).filter((s) => s > 0);
    const avgMaxScore = maxScores.length ? maxScores.reduce((a, b) => a + b, 0) / maxScores.length : 100;
    const quizRate = avgMaxScore > 0 ? Math.round((avgQuizScore / avgMaxScore) * 100) : 0;

    return [
      { subject: 'Оценки', value: Math.round((avgGrade / 5) * 100) },
      { subject: 'Посещаемость', value: Math.round(attendanceRate) },
      { subject: 'Домашние задания', value: Math.round(assignmentRate) },
      { subject: 'Тесты', value: quizRate },
      { subject: 'Общая успеваемость', value: Math.round(((avgGrade / 5) * 100 + attendanceRate + assignmentRate + quizRate) / 4) },
    ];
  }

  async getAllStudentsPerformanceForTeacher(
    userId: number,
    filter: PerformanceFilterDto,
  ): Promise<{ id: number; name: string; surname: string; group: string; averageGrade: number; attendanceRate: number; assignmentRate: number }[]> {
    const groupIds = await this.getTeacherGroupIds(userId, filter);

    if (groupIds.length === 0) return [];

    const students = await this.prisma.student.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        user: true,
        group: true,
        lessonsResults: { where: { deletedAt: null } },
      },
    });

    const studentsWithPerformance = students.map((student) => {
      const allResults = student.lessonsResults;

      const grades = allResults.filter((r) => r.lessonScore !== null).map((r) => r.lessonScore);
      const averageGrade = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      const attendanceRecords = allResults.filter((r) => r.attendance !== null);
      const attendanceRate = attendanceRecords.length
        ? (attendanceRecords.filter((r) => r.attendance).length / attendanceRecords.length) * 100
        : 0;

      const assignmentRecords = allResults.filter((r) => r.homeworkScore !== null);
      const assignmentRate = assignmentRecords.length
        ? (assignmentRecords.filter((r) => r.homeworkScore >= 3).length / assignmentRecords.length) * 100
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

    return studentsWithPerformance.sort((a, b) => b.averageGrade - a.averageGrade);
  }
}
