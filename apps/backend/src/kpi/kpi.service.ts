import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackAggregationService } from './feedback-aggregation.service';
import { KpiFilterDto } from './dto/kpi-filter.dto';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import {
  KpiOverviewResponseDto,
  TeacherKpiResponseDto,
  DepartmentKpiResponseDto,
  KpiTrendsResponseDto,
  KpiGoalsResponseDto,
  KpiComparisonResponseDto,
  KpiMetricDto,
  TeacherKpiDto,
  DepartmentKpiDto,
  KpiTrendDto,
  KpiGoalDto,
  KpiComparisonDto,
} from './dto/kpi-response.dto';
import {
  KpiSettingsDto,
  KpiSettingsResponseDto,
  CreateKpiGoalDto,
  UpdateKpiGoalDto,
} from './dto/kpi-settings.dto';

@Injectable()
export class KpiService {
  constructor(
    private prisma: PrismaService,
    private feedbackAggregationService: FeedbackAggregationService
  ) { }

  async getOverview(filter?: KpiFilterDto): Promise<KpiOverviewResponseDto> {
    // Получаем реальные данные преподавателей с нагрузкой
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: true,
        workloads: {
          include: {
            subjectWorkloads: true,
            monthlyHours: true,
          },
        },
      },
    });

    const totalTeachers = teachers.length;

    // Рассчитываем метрики на основе реальных данных
    const teachersWithWorkload = teachers.filter(t => t.workloads.length > 0);
    const avgWorkloadHours = teachers.reduce((sum, teacher) => {
      const totalHours = teacher.workloads.reduce((h, w) => h + w.standardHours, 0);
      return sum + totalHours;
    }, 0) / totalTeachers || 0;

    // Процент выполнения нагрузки
    const workloadCompliance = totalTeachers > 0 ? (teachersWithWorkload.length / totalTeachers) * 100 : 0;

    // Рассчитываем изменения на основе сравнения с целевыми показателями
    const workloadChange = workloadCompliance > 0 ? Math.round(workloadCompliance - 85) : 0;
    const teacherChange = teachersWithWorkload.length > 0 ? teachersWithWorkload.length - Math.round(totalTeachers * 0.9) : 0;
    const workloadHoursChange = avgWorkloadHours > 0 ? Math.round(avgWorkloadHours - 18) : 0;

    const metrics: KpiMetricDto[] = [
      {
        name: 'Выполнение нагрузки',
        value: Math.round(workloadCompliance),
        target: 90,
        change: workloadChange,
        unit: '%',
        status: workloadCompliance >= 90 ? 'success' : workloadCompliance >= 75 ? 'warning' : 'danger',
      },
      {
        name: 'Активных преподавателей',
        value: teachersWithWorkload.length,
        target: totalTeachers,
        change: teacherChange,
        unit: '',
        status: teachersWithWorkload.length === totalTeachers ? 'success' : 'warning',
      },
      {
        name: 'Средняя нагрузка',
        value: Math.round(avgWorkloadHours),
        target: 20,
        change: workloadHoursChange,
        unit: 'ч/нед',
        status: avgWorkloadHours >= 18 ? 'success' : avgWorkloadHours >= 15 ? 'warning' : 'danger',
      },
    ];

    const overallKpi = totalTeachers > 0 ? Math.round(metrics.reduce((sum, m) => {
      const percentage = m.target > 0 ? (m.value / m.target * 100) : 0;
      return sum + Math.min(percentage, 100);
    }, 0) / metrics.length) : 0;

    return {
      metrics,
      overallKpi,
      goalAchievement: overallKpi > 0 ? Math.round(overallKpi * 0.85) : 0,
      activeGoals: 0,
      totalTeachers,
    };
  }

  async getTeacherKpi(filter?: KpiFilterDto): Promise<TeacherKpiResponseDto> {
    // Получаем настройки KPI
    const settings = await this.getSettings();

    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: true,
        workloads: {
          include: {
            subjectWorkloads: true,
            monthlyHours: true,
          },
        },
        studyPlans: true,
        schedules: true,
      },
    });

    // Рассчитываем реальные KPI на основе данных и настроек
    const teacherKpis: TeacherKpiDto[] = await Promise.all(
      teachers.map(async (teacher, index) => {
        // Рассчитываем каждую метрику по отдельности
        const controlWorksProgress = await this.calculateStudentControlWorksProgress(teacher.id);
        const journalFilling = await this.calculateJournalFilling(teacher.id);
        const workPlanFilling = await this.calculateWorkPlanFilling(teacher.id);
        const lessonMaterials = await this.calculateLessonMaterials(teacher.id);
        const studentRetention = await this.calculateStudentRetention(teacher.id);

        // Рассчитываем общий балл на основе весов (только активные метрики)
        const weights = { 
          controlWorks: 20, 
          journal: 15, 
          workPlan: 15, 
          materials: 15, 
          retention: 10 
        };
        
        let totalScore = 0;
        let totalWeight = 0;

        if (controlWorksProgress >= 0) {
          totalScore += controlWorksProgress * (weights.controlWorks / 100);
          totalWeight += weights.controlWorks;
        }
        if (journalFilling >= 0) {
          totalScore += journalFilling * (weights.journal / 100);
          totalWeight += weights.journal;
        }
        if (workPlanFilling >= 0) {
          totalScore += workPlanFilling * (weights.workPlan / 100);
          totalWeight += weights.workPlan;
        }
        if (lessonMaterials >= 0) {
          totalScore += lessonMaterials * (weights.materials / 100);
          totalWeight += weights.materials;
        }
        if (studentRetention >= 0) {
          totalScore += studentRetention * (weights.retention / 100);
          totalWeight += weights.retention;
        }

        const overallScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

        // Тренд - базируется на соотношении плановой и фактической нагрузки
        const totalWorkloadHours = teacher.workloads.reduce((sum, w) => sum + w.standardHours, 0);
        const actualHours = teacher.workloads.reduce((sum, w) => sum + w.actualHours, 0);
        const trend = totalWorkloadHours > 0 ? Math.round((actualHours - totalWorkloadHours) / totalWorkloadHours * 10) : 0;

        return {
          id: teacher.id,
          name: `${teacher.user.name} ${teacher.user.surname}`,
          overallScore: Math.round(overallScore),
          teachingQuality: controlWorksProgress, // Прогресс по контрольным работам
          studentSatisfaction: studentRetention, // Удержание учеников
          classAttendance: journalFilling, // Заполнение журнала
          workloadCompliance: workPlanFilling, // Выполнение КТП
          professionalDevelopment: lessonMaterials, // Материалы к урокам
          trend: Math.max(-10, Math.min(10, trend)),
          rank: index + 1,
        };
      })
    );

    // Сортируем по общему KPI
    teacherKpis.sort((a, b) => b.overallScore - a.overallScore);
    teacherKpis.forEach((teacher, index) => {
      teacher.rank = index + 1;
    });

    const averageKpi = teacherKpis.reduce((sum, t) => sum + t.overallScore, 0) / teacherKpis.length || 0;
    const topPerformers = teacherKpis.filter(t => t.overallScore >= 85).length;
    const needsImprovement = teacherKpis.filter(t => t.overallScore < 70).length;
    const onTrack = teacherKpis.filter(t => t.overallScore >= 70 && t.overallScore < 85).length;

    return {
      teachers: teacherKpis,
      statistics: {
        averageKpi: Math.round(averageKpi),
        topPerformers,
        needsImprovement,
        onTrack,
      },
    };
  }

  async getDepartmentKpi(filter?: KpiFilterDto): Promise<DepartmentKpiResponseDto> {
    // Получаем реальные данные учебных планов и преподавателей
    const studyPlans = await this.prisma.studyPlan.findMany({
      include: {
        teacher: {
          include: {
            user: true,
            workloads: true,
          },
        },
      },
    });

    // Группируем по предметам (условно отделы)
    const departmentMap = new Map<string, {
      teachers: Set<number>;
      totalKpi: number;
      goalAchievement: number;
    }>();

    studyPlans.forEach((plan) => {
      const subjectName = plan.name.split(' ')[0] || 'Общий'; // Берем первое слово как отдел

      if (!departmentMap.has(subjectName)) {
        departmentMap.set(subjectName, {
          teachers: new Set(),
          totalKpi: 0,
          goalAchievement: 0,
        });
      }

      const dept = departmentMap.get(subjectName);
      dept.teachers.add(plan.teacher.id);

      // Рассчитываем KPI на основе нагрузки
      const workloadHours = plan.teacher.workloads.reduce((sum, w) => sum + w.standardHours, 0);
      const kpi = Math.min((workloadHours / 20) * 100, 100); // 20 часов = 100%

      dept.totalKpi += kpi;
      dept.goalAchievement += kpi * 0.9; // Цель - 90% от KPI
    });

    const departments: DepartmentKpiDto[] = Array.from(departmentMap.entries()).map(([name, data]) => {
      const teacherCount = data.teachers.size;
      const averageKpi = teacherCount > 0 ? Math.round(data.totalKpi / teacherCount) : 0;

      // Рассчитываем тренд на основе отклонения от целевого KPI
      const targetKpi = 80;
      const trendValue = averageKpi > 0 ? Math.round((averageKpi - targetKpi) / 10) : 0;

      return {
        name,
        averageKpi,
        teacherCount,
        goalAchievement: Math.round(data.goalAchievement / teacherCount || 0),
        trend: Math.max(-10, Math.min(10, trendValue)),
      };
    });

    const topDepartment = departments.length > 0
      ? departments.reduce((top, dept) => dept.averageKpi > top.averageKpi ? dept : top)
      : { name: 'Нет данных', averageKpi: 0, teacherCount: 0, goalAchievement: 0, trend: 0 };

    return {
      departments,
      topDepartment,
    };
  }

  async getTrends(filter?: KpiFilterDto): Promise<KpiTrendsResponseDto> {
    // Получаем данные нагрузки за последние месяцы
    const currentDate = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        name: date.toLocaleDateString('ru', { month: 'short' }),
      });
    }

    const trends: KpiTrendDto[] = [];

    for (const period of months) {
      // Получаем данные нагрузки за каждый месяц
      const monthlyData = await this.prisma.monthlyWorkload.findMany({
        where: {
          month: period.month,
          year: period.year,
        },
        include: {
          teacherWorkload: {
            include: {
              teacher: true,
            },
          },
        },
      });

      // Рассчитываем средний KPI за месяц
      const avgKpi = monthlyData.length > 0
        ? monthlyData.reduce((sum, data) => {
          const compliance = data.standardHours > 0
            ? Math.min((data.actualHours / data.standardHours) * 100, 100)
            : 0;
          return sum + compliance;
        }, 0) / monthlyData.length
        : 0;

      trends.push({
        period: period.name,
        value: Math.round(avgKpi),
        target: 80,
      });
    }

    // Если нет данных, оставляем 0

    const firstValue = trends[0]?.value || 0;
    const lastValue = trends[trends.length - 1]?.value || 0;
    const totalChange = lastValue - firstValue;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (totalChange > 2) direction = 'up';
    else if (totalChange < -2) direction = 'down';

    return {
      trends,
      analysis: {
        direction,
        strength: Math.abs(totalChange),
        projection: lastValue + Math.round(totalChange * 0.3),
      },
    };
  }

  async getGoals(filter?: KpiFilterDto): Promise<KpiGoalsResponseDto> {
    // Получаем реальные данные для формирования целей
    const teachers = await this.prisma.teacher.findMany({
      include: {
        workloads: true,
        studyPlans: true,
      },
    });

    const totalTeachers = teachers.length;
    const teachersWithWorkload = teachers.filter(t => t.workloads.length > 0);
    const avgWorkloadCompliance = teachersWithWorkload.length > 0
      ? teachersWithWorkload.reduce((sum, t) => {
        const totalHours = t.workloads.reduce((h, w) => h + w.standardHours, 0);
        const actualHours = t.workloads.reduce((h, w) => h + w.actualHours, 0);
        return sum + (totalHours > 0 ? (actualHours / totalHours) * 100 : 0);
      }, 0) / teachersWithWorkload.length
      : 0;

    // Формируем цели на основе реальных данных
    const goals: KpiGoalDto[] = [
      {
        id: 1,
        title: 'Увеличение активности преподавателей',
        description: `Довести количество преподавателей с назначенной нагрузкой до ${totalTeachers}`,
        target: totalTeachers,
        current: teachersWithWorkload.length,
        progress: Math.round((teachersWithWorkload.length / totalTeachers) * 100),
        deadline: '2024-06-30',
        status: teachersWithWorkload.length >= totalTeachers * 0.9 ? 'on_track' :
          teachersWithWorkload.length >= totalTeachers * 0.7 ? 'at_risk' : 'behind',
        responsible: 'Администрация',
      },
      {
        id: 2,
        title: 'Оптимизация нагрузки преподавателей',
        description: 'Достижение 90% выполнения плановой нагрузки',
        target: 90,
        current: Math.round(avgWorkloadCompliance),
        progress: Math.round((avgWorkloadCompliance / 90) * 100),
        deadline: '2024-08-31',
        status: avgWorkloadCompliance >= 80 ? 'on_track' :
          avgWorkloadCompliance >= 60 ? 'at_risk' : 'behind',
        responsible: 'HR отдел',
      },
      {
        id: 3,
        title: 'Развитие учебных программ',
        description: `Обеспечить каждого преподавателя минимум 2 учебными планами`,
        target: totalTeachers * 2,
        current: teachers.reduce((sum, t) => sum + t.studyPlans.length, 0),
        progress: Math.round((teachers.reduce((sum, t) => sum + t.studyPlans.length, 0) / (totalTeachers * 2)) * 100),
        deadline: '2024-12-31',
        status: 'on_track',
        responsible: 'Учебный отдел',
      },
    ];

    const total = goals.length;
    const onTrack = goals.filter(g => g.status === 'on_track').length;
    const atRisk = goals.filter(g => g.status === 'at_risk').length;
    const behind = goals.filter(g => g.status === 'behind').length;
    const completed = goals.filter(g => g.progress >= 100).length;

    return {
      goals,
      summary: {
        total,
        onTrack,
        atRisk,
        behind,
        completed,
      },
    };
  }

  async getComparison(filter?: KpiFilterDto): Promise<KpiComparisonResponseDto> {
    // Получаем текущие данные
    const currentTeachers = await this.prisma.teacher.findMany({
      include: {
        workloads: true,
        studyPlans: true,
        schedules: true,
      },
    });

    // Получаем данные за предыдущий месяц для сравнения
    const currentDate = new Date();
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const previousMonthData = await this.prisma.monthlyWorkload.findMany({
      where: {
        month: previousMonth.getMonth() + 1,
        year: previousMonth.getFullYear(),
      },
      include: {
        teacherWorkload: {
          include: {
            teacher: true,
          },
        },
      },
    });

    // Рассчитываем текущие показатели
    const currentWorkloadCompliance = currentTeachers.reduce((sum, teacher) => {
      const totalHours = teacher.workloads.reduce((h, w) => h + w.standardHours, 0);
      const actualHours = teacher.workloads.reduce((h, w) => h + w.actualHours, 0);
      return sum + (totalHours > 0 ? (actualHours / totalHours) * 100 : 0);
    }, 0) / currentTeachers.length || 0;

    const currentTeachingQuality = currentTeachers.reduce((sum, teacher) => {
      return sum + Math.min(50 + teacher.studyPlans.length * 10, 100);
    }, 0) / currentTeachers.length || 0;

    const currentScheduleActivity = currentTeachers.reduce((sum, teacher) => {
      return sum + Math.min(teacher.schedules.length * 5 + 60, 100);
    }, 0) / currentTeachers.length || 0;

    // Рассчитываем предыдущие показатели
    const previousWorkloadCompliance = previousMonthData.length > 0
      ? previousMonthData.reduce((sum, data) => {
        const compliance = data.standardHours > 0
          ? (data.actualHours / data.standardHours) * 100
          : 0;
        return sum + compliance;
      }, 0) / previousMonthData.length
      : 0; // Если нет данных, показываем 0

    // Создаем сравнение только на основе реальных данных
    const comparison: KpiComparisonDto[] = [
      {
        category: 'Качество преподавания',
        current: Math.round(currentTeachingQuality),
        previous: 0, // Нет исторических данных
        change: 0,
        changePercent: 0,
      },
      {
        category: 'Активность в расписании',
        current: Math.round(currentScheduleActivity),
        previous: 0, // Нет исторических данных
        change: 0,
        changePercent: 0,
      },
      {
        category: 'Выполнение нагрузки',
        current: Math.round(currentWorkloadCompliance),
        previous: Math.round(previousWorkloadCompliance),
        change: previousWorkloadCompliance > 0 ? Math.round(currentWorkloadCompliance - previousWorkloadCompliance) : 0,
        changePercent: previousWorkloadCompliance > 0 ? Number((((currentWorkloadCompliance - previousWorkloadCompliance) / previousWorkloadCompliance) * 100).toFixed(1)) : 0,
      },
    ];

    const overallChange = comparison.reduce((sum, item) => sum + item.changePercent, 0) / comparison.length;

    return {
      comparison,
      overallChange: Math.round(overallChange * 10) / 10,
    };
  }

  async exportKpi(filter: KpiFilterDto, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Buffer> {
    // Получаем все KPI данные
    const [overview, teacherKpi, departmentKpi, trends, goals, comparison] = await Promise.all([
      this.getOverview(filter),
      this.getTeacherKpi(filter),
      this.getDepartmentKpi(filter),
      this.getTrends(filter),
      this.getGoals(filter),
      this.getComparison(filter),
    ]);

    // Подготавливаем данные для экспорта
    const exportData = [
      // Общие метрики
      ...overview.metrics.map(metric => ({
        'Категория': 'Общие показатели',
        'Показатель': metric.name,
        'Значение': metric.value,
        'Цель': metric.target,
        'Единица': metric.unit,
        'Изменение': metric.change,
        'Статус': metric.status,
        'Дополнительно': '',
      })),

      // KPI преподавателей
      ...teacherKpi.teachers.slice(0, 10).map(teacher => ({
        'Категория': 'KPI преподавателей',
        'Показатель': teacher.name,
        'Значение': teacher.overallScore,
        'Цель': 85,
        'Единица': 'балл',
        'Изменение': teacher.trend,
        'Статус': teacher.overallScore >= 85 ? 'success' : teacher.overallScore >= 70 ? 'warning' : 'danger',
        'Дополнительно': `Место: ${teacher.rank}`,
      })),

      // KPI отделов
      ...departmentKpi.departments.map(dept => ({
        'Категория': 'KPI отделов',
        'Показатель': dept.name,
        'Значение': dept.averageKpi,
        'Цель': 80,
        'Единица': 'балл',
        'Изменение': dept.trend,
        'Статус': dept.averageKpi >= 80 ? 'success' : dept.averageKpi >= 60 ? 'warning' : 'danger',
        'Дополнительно': `Преподавателей: ${dept.teacherCount}`,
      })),

      // Цели
      ...goals.goals.map(goal => ({
        'Категория': 'Цели KPI',
        'Показатель': goal.title,
        'Значение': goal.current,
        'Цель': goal.target,
        'Единица': '',
        'Изменение': goal.progress,
        'Статус': goal.status,
        'Дополнительно': `Ответственный: ${goal.responsible}`,
      })),
    ];

    if (format === 'csv') {
      return this.generateCSV(exportData);
    } else if (format === 'pdf') {
      return await this.generatePDF(exportData);
    } else {
      return await this.generateXLSX(exportData);
    }
  }

  async exportTeacherReport(teacherId: number, filter: KpiFilterDto, format: 'xlsx' | 'pdf' = 'xlsx'): Promise<Buffer> {
    const teacherKpi = await this.getTeacherKpi(filter);
    const teacher = teacherKpi.teachers.find(t => t.id === teacherId);

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    // Получаем детальные данные преподавателя
    const teacherData = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        workloads: {
          include: {
            subjectWorkloads: true,
            monthlyHours: true,
            additionalActivities: true,
          },
        },
        studyPlans: true,
        schedules: true,
      },
    });

    if (!teacherData) {
      throw new NotFoundException('Данные преподавателя не найдены');
    }

    // Подготавливаем детальный отчет
    const exportData = [
      // Основная информация
      {
        'Раздел': 'Общая информация',
        'Показатель': 'ФИО',
        'Значение': `${teacherData.user.surname} ${teacherData.user.name} ${teacherData.user.middlename || ''}`.trim(),
        'Дополнительно': '',
      },
      {
        'Раздел': 'Общая информация',
        'Показатель': 'Email',
        'Значение': teacherData.user.email,
        'Дополнительно': '',
      },
      {
        'Раздел': 'Общая информация',
        'Показатель': 'Общий KPI',
        'Значение': teacher.overallScore,
        'Дополнительно': `Место в рейтинге: ${teacher.rank}`,
      },

      // KPI показатели
      {
        'Раздел': 'KPI показатели',
        'Показатель': 'Качество преподавания',
        'Значение': teacher.teachingQuality >= 0 ? teacher.teachingQuality : 'В разработке',
        'Дополнительно': 'Основано на количестве предметов',
      },
      {
        'Раздел': 'KPI показатели',
        'Показатель': 'Выполнение нагрузки',
        'Значение': teacher.workloadCompliance >= 0 ? teacher.workloadCompliance : 'В разработке',
        'Дополнительно': 'Процент выполнения плановой нагрузки',
      },
      {
        'Раздел': 'KPI показатели',
        'Показатель': 'Посещаемость занятий',
        'Значение': teacher.classAttendance >= 0 ? teacher.classAttendance : 'В разработке',
        'Дополнительно': 'Процент проведенных занятий',
      },
      {
        'Раздел': 'KPI показатели',
        'Показатель': 'Удовлетворенность студентов',
        'Значение': teacher.studentSatisfaction >= 0 ? teacher.studentSatisfaction : 'В разработке',
        'Дополнительно': 'Требуется система оценок студентами',
      },
      {
        'Раздел': 'KPI показатели',
        'Показатель': 'Профессиональное развитие',
        'Значение': teacher.professionalDevelopment >= 0 ? teacher.professionalDevelopment : 'В разработке',
        'Дополнительно': 'Требуется система сертификации/курсов',
      },

      // Нагрузка
      ...teacherData.workloads.map((workload, index) => ({
        'Раздел': 'Нагрузка',
        'Показатель': `Учебный год ${workload.academicYear}`,
        'Значение': `${workload.actualHours}/${workload.standardHours} часов`,
        'Дополнительно': `Выполнение: ${Math.round((workload.actualHours / workload.standardHours) * 100)}%`,
      })),

      // Предметы
      ...teacherData.studyPlans.map(plan => ({
        'Раздел': 'Учебные планы',
        'Показатель': plan.name,
        'Значение': `${plan.normativeWorkload} часов`,
        'Дополнительно': plan.description || '',
      })),
    ];

    if (format === 'pdf') {
      return await this.generatePDF(exportData);
    } else {
      return await this.generateXLSX(exportData);
    }
  }

  private async generateXLSX(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KPI Отчет');

    if (data.length === 0) {
      return Buffer.from('');
    }

    const headers = Object.keys(data[0]);

    // Добавляем заголовки
    worksheet.addRow(headers);

    // Стилизуем заголовки
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };

    // Добавляем данные
    data.forEach(row => {
      const values = headers.map(header => row[header] || '');
      worksheet.addRow(values);
    });

    // Автоподгонка ширины колонок
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      let maxLength = header.length;

      data.forEach(row => {
        const value = String(row[header] || '');
        if (value.length > maxLength) {
          maxLength = value.length;
        }
      });

      column.width = Math.min(maxLength + 2, 50);
    });

    // Генерируем buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private generateCSV(data: any[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return Buffer.from('' + csvContent, 'utf-8');
  }

  private async generatePDF(data: any[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Заголовок документа
      doc.fontSize(16).text('Отчет KPI', { align: 'center' });
      doc.moveDown();

      if (data.length === 0) {
        doc.text('Нет данных для отображения');
        doc.end();
        return;
      }

      // Настройки таблицы
      const headers = Object.keys(data[0]);
      const startX = 50;
      let currentY = doc.y;
      const rowHeight = 25;
      const colWidth = (doc.page.width - 100) / headers.length;

      // Рисуем заголовки
      doc.fontSize(10);
      headers.forEach((header, index) => {
        const x = startX + (index * colWidth);
        doc.rect(x, currentY, colWidth, rowHeight).fillAndStroke('#4CAF50', '#000');
        doc.fillColor('#fff').text(header, x + 2, currentY + 8, {
          width: colWidth - 4,
          height: rowHeight - 16,
          ellipsis: true
        });
      });

      currentY += rowHeight;

      // Рисуем данные
      data.forEach((row, rowIndex) => {
        if (currentY + rowHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }

        headers.forEach((header, index) => {
          const x = startX + (index * colWidth);
          const value = String(row[header] || '');

          // Чередуем цвета строк
          const fillColor = rowIndex % 2 === 0 ? '#f9f9f9' : '#ffffff';
          doc.rect(x, currentY, colWidth, rowHeight).fillAndStroke(fillColor, '#ddd');

          doc.fillColor('#000').text(value, x + 2, currentY + 5, {
            width: colWidth - 4,
            height: rowHeight - 10,
            ellipsis: true
          });
        });

        currentY += rowHeight;
      });

      doc.end();
    });
  }

  /**
   * Рассчитывает посещаемость для конкретного преподавателя на основе LessonResult
   */
  private async calculateAttendanceForTeacher(teacherId: number): Promise<number> {
    try {
      // Получаем все результаты уроков для преподавателя
      const lessonResults = await this.prisma.lessonResult.findMany({
        include: {
          Lesson: {
            include: {
              studyPlan: true,
            },
          },
        },
        where: {
          Lesson: {
            studyPlan: {
              teacherId: teacherId,
            },
          },
          attendance: {
            not: null, // Только записи где отмечена посещаемость
          },
        },
      });

      if (lessonResults.length === 0) {
        return -1; // Нет данных о посещаемости
      }

      // Подсчитываем процент посещаемости
      const attendedLessons = lessonResults.filter(result => result.attendance === true).length;
      const totalLessons = lessonResults.length;

      const attendancePercentage = (attendedLessons / totalLessons) * 100;

      return Math.round(attendancePercentage);
    } catch (error) {
      console.error('Error calculating attendance for teacher:', teacherId, error);
      return -1; // В случае ошибки возвращаем "в разработке"
    }
  }

  // Settings management methods
  getSettings(): Promise<KpiSettingsResponseDto> {
    const defaultSettings: KpiSettingsDto = {
      metrics: [
        // Постоянные метрики (автоматический расчет)
        {
          name: 'Прогресс ученика по контрольным работам',
          weight: 20,
          target: 85,
          successThreshold: 90,
          warningThreshold: 75,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Заполнение журнала',
          weight: 15,
          target: 95,
          successThreshold: 98,
          warningThreshold: 90,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Заполнение плана работ',
          weight: 15,
          target: 90,
          successThreshold: 95,
          warningThreshold: 85,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Заполнение уроков дополнительным материалом',
          weight: 15,
          target: 80,
          successThreshold: 90,
          warningThreshold: 70,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Обратная связь родителю',
          weight: 15,
          target: 85,
          successThreshold: 90,
          warningThreshold: 75,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Отзывы от родителей',
          weight: 10,
          target: 80,
          successThreshold: 85,
          warningThreshold: 70,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Процент удержания учеников',
          weight: 10,
          target: 90,
          successThreshold: 95,
          warningThreshold: 85,
          isActive: true,
          type: 'constant',
        },
        // Периодические метрики (ручное заполнение)
        {
          name: 'Призовые места на олимпиадах',
          weight: 0, // Бонус
          target: 70,
          successThreshold: 80,
          warningThreshold: 60,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Поступление в РФМШ/НИШ/БИЛ',
          weight: 0, // Бонус
          target: 60,
          successThreshold: 75,
          warningThreshold: 50,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Поступление в лицеи/частные школы',
          weight: 0, // Бонус
          target: 65,
          successThreshold: 75,
          warningThreshold: 55,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Повышение квалификации', 
          weight: 0, // Бонус
          target: 70,
          successThreshold: 80,
          warningThreshold: 60,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Участие в командных мероприятиях',
          weight: 0, // Бонус
          target: 75,
          successThreshold: 85,
          warningThreshold: 65,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Помощь в проектах',
          weight: 0, // Бонус
          target: 70,
          successThreshold: 80,
          warningThreshold: 60,
          isActive: true,
          type: 'periodic',
        },
      ],
      calculationPeriod: 'monthly',
      autoNotifications: true,
      notificationThreshold: 70,
    };

    return Promise.resolve({
      settings: defaultSettings,
      lastUpdated: new Date(),
      updatedBy: 'Администратор',
    });
  }

  updateSettings(settings: KpiSettingsDto): Promise<KpiSettingsResponseDto> {
    // В реальном приложении здесь должно быть сохранение в базу данных
    // Пока просто возвращаем обновленные настройки

    // Валидация настроек
    const totalWeight = settings.metrics.reduce((sum, metric) => sum + metric.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      throw new Error('Сумма весов метрик должна равняться 100%');
    }

    return Promise.resolve({
      settings,
      lastUpdated: new Date(),
      updatedBy: 'Администратор',
    });
  }

  // Goals management methods
  createGoal(goalData: CreateKpiGoalDto) {
    // В реальном приложении здесь должно быть создание записи в базе данных
    // Пока возвращаем мокированный ответ
    const newGoal = {
      id: Math.floor(Math.random() * 1000),
      title: goalData.title,
      description: goalData.description,
      target: goalData.target,
      current: 0,
      progress: 0,
      deadline: goalData.deadline,
      status: 'on_track' as const,
      responsible: goalData.responsible,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Promise.resolve({
      message: 'Цель успешно создана',
      goal: newGoal,
    });
  }

  updateGoal(goalId: number, goalData: UpdateKpiGoalDto) {
    // В реальном приложении здесь должно быть обновление записи в базе данных
    // Пока возвращаем мокированный ответ
    const updatedGoal = {
      id: goalId,
      ...goalData,
      updatedAt: new Date(),
    };

    return Promise.resolve({
      message: 'Цель успешно обновлена',
      goal: updatedGoal,
    });
  }

  deleteGoal(goalId: number) {
    // В реальном приложении здесь должно быть удаление записи из базы данных
    // Пока возвращаем мокированный ответ
    return Promise.resolve({
      message: 'Цель успешно удалена',
      goalId,
    });
  }

  /**
   * Рассчитывает все метрики KPI для преподавателя
   */
  private async calculateTeacherMetrics(teacher: any, settings: KpiSettingsDto) {
    // Рассчитываем каждую метрику напрямую
    const controlWorksProgress = await this.calculateStudentControlWorksProgress(teacher.id);
    const journalFilling = await this.calculateJournalFilling(teacher.id);
    const workPlanFilling = await this.calculateWorkPlanFilling(teacher.id);
    const lessonMaterials = await this.calculateLessonMaterials(teacher.id);
    const studentRetention = await this.calculateStudentRetention(teacher.id);

    return {
      controlWorksProgress,
      journalFilling,
      workPlanFilling,
      lessonMaterials,
      parentResponse: -1, // Пока в разработке
      parentFeedback: -1, // Пока в разработке
      studentRetention,
      // Для совместимости со старым API
      teachingQuality: controlWorksProgress,
      studentSatisfaction: studentRetention,
      classAttendance: journalFilling,
      workloadCompliance: workPlanFilling,
      professionalDevelopment: lessonMaterials,
    };
  }

  /**
   * Рассчитывает общий балл KPI на основе весов из настроек
   */
  private calculateOverallScore(metrics: any, settings: KpiSettingsDto): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const metricSetting of settings.metrics) {
      if (!metricSetting.isActive) continue;

      const metricKey = this.getMetricKey(metricSetting.name);
      const metricValue = metrics[metricKey];

      if (metricValue >= 0) { // Только если метрика доступна
        totalScore += metricValue * (metricSetting.weight / 100);
        totalWeight += metricSetting.weight;
      }
    }

    // Нормализуем если не все метрики доступны
    if (totalWeight === 0) return 0;
    return totalWeight < 100 ? (totalScore / totalWeight) * 100 : totalScore;
  }

  /**
   * Преобразует название метрики в ключ
   */
  private getMetricKey(metricName: string): string {
    const keyMap: Record<string, string> = {
      'Качество преподавания': 'teachingQuality',
      'Удовлетворенность студентов': 'studentSatisfaction',
      'Посещаемость занятий': 'classAttendance',
      'Выполнение нагрузки': 'workloadCompliance',
      'Профессиональное развитие': 'professionalDevelopment',
    };
    return keyMap[metricName] || 'unknown';
  }

  /**
   * Рассчитывает качество преподавания
   */
  private calculateTeachingQuality(teacher: any): Promise<number> {
    try {
      // Базовые показатели
      const subjectCount = teacher.studyPlans.length;
      const scheduleCount = teacher.schedules.length;

      // Базовый балл 40 + количество предметов * 15 + активность в расписании
      let score = 40;
      score += Math.min(subjectCount * 15, 40); // Максимум 40 баллов за предметы
      score += Math.min(scheduleCount * 5, 20); // Максимум 20 баллов за расписание

      return Promise.resolve(Math.min(score, 100));
    } catch (error) {
      console.error('Error calculating teaching quality:', error);
      return Promise.resolve(-1);
    }
  }

  /**
   * Рассчитывает удовлетворенность студентов
   */
  private calculateStudentSatisfaction(teacher: any): Promise<number> {
    try {
      // В будущем здесь должны быть оценки студентов
      // Пока возвращаем -1 (в разработке)
      return Promise.resolve(-1);
    } catch (error) {
      console.error('Error calculating student satisfaction:', error);
      return Promise.resolve(-1);
    }
  }

  /**
   * Рассчитывает выполнение нагрузки
   */
  private calculateWorkloadCompliance(teacher: any): Promise<number> {
    try {
      const totalWorkloadHours = teacher.workloads.reduce((sum: number, w: any) => sum + w.standardHours, 0);
      const actualHours = teacher.workloads.reduce((sum: number, w: any) => sum + w.actualHours, 0);

      if (totalWorkloadHours === 0) return Promise.resolve(0);

      const compliance = (actualHours / totalWorkloadHours) * 100;
      return Promise.resolve(Math.min(compliance, 100));
    } catch (error) {
      console.error('Error calculating workload compliance:', error);
      return Promise.resolve(0);
    }
  }

  /**
   * Рассчитывает профессиональное развитие
   */
  private calculateProfessionalDevelopment(teacher: any): Promise<number> {
    try {
      // В будущем здесь должны быть данные о курсах, сертификатах и т.д.
      // Пока возвращаем -1 (в разработке)
      return Promise.resolve(-1);
    } catch (error) {
      console.error('Error calculating professional development:', error);
      return Promise.resolve(-1);
    }
  }

  /**
   * Ручной пересчет KPI для всех преподавателей
   */
  async manualKpiRecalculation() {
    try {
      const startTime = Date.now();

      // Получаем все данные преподавателей
      const teachers = await this.prisma.teacher.findMany({
        include: {
          user: true,
          workloads: {
            include: {
              subjectWorkloads: true,
              monthlyHours: true,
            },
          },
          studyPlans: true,
          schedules: true,
        },
      });

      const settings = await this.getSettings();
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Пересчитываем KPI для каждого преподавателя
      for (const teacher of teachers) {
        try {
          const metrics = await this.calculateTeacherMetrics(teacher, settings.settings);
          const overallScore = this.calculateOverallScore(metrics, settings.settings);

          // В реальном приложении здесь должно быть сохранение в таблицу KPI
          console.log(`KPI пересчитан для ${teacher.user.name} ${teacher.user.surname}: ${Math.round(overallScore)}`);

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Ошибка для преподавателя ${teacher.user.name}: ${error.message}`);
          console.error(`Ошибка при пересчете KPI для преподавателя ${teacher.id}:`, error);
        }
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: true,
        message: 'Пересчет KPI завершен',
        statistics: {
          totalTeachers: teachers.length,
          successfulUpdates: successCount,
          failedUpdates: errorCount,
          processingTime: `${processingTime}ms`,
          errors: errors.slice(0, 10), // Показываем только первые 10 ошибок
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Критическая ошибка при пересчете KPI:', error);
      throw new Error('Не удалось выполнить пересчет KPI');
    }
  }

  /**
   * Получает статус последнего обновления KPI
   */
  async getCalculationStatus() {
    try {
      // В реальном приложении здесь должен быть запрос к таблице статистики обновлений
      const totalTeachers = await this.prisma.teacher.count();

      return {
        lastUpdate: new Date(), // В реальности - из таблицы статистики
        nextScheduledUpdate: await this.getNextScheduledUpdate(),
        totalTeachers,
        successfulUpdates: totalTeachers, // Заглушка
        failedUpdates: 0,
        averageProcessingTime: '2.3 секунд',
        systemStatus: 'active',
        calculationPeriod: (await this.getSettings()).settings.calculationPeriod,
        autoNotifications: (await this.getSettings()).settings.autoNotifications,
      };
    } catch (error) {
      console.error('Ошибка при получении статуса обновления:', error);
      throw new Error('Не удалось получить статус обновления');
    }
  }

  /**
   * Вычисляет время следующего запланированного обновления
   */
  private async getNextScheduledUpdate(): Promise<Date> {
    const now = new Date();
    const settings = await this.getSettings(); // Получаем настройки асинхронно

    // Упрощенная логика для демонстрации
    const nextUpdate = new Date(now);

    // В зависимости от периода пересчета
    switch (settings.settings.calculationPeriod) {
      case 'daily':
        nextUpdate.setDate(nextUpdate.getDate() + 1);
        nextUpdate.setHours(2, 0, 0, 0);
        break;
      case 'weekly': {
        const daysUntilMonday = (8 - nextUpdate.getDay()) % 7;
        nextUpdate.setDate(nextUpdate.getDate() + daysUntilMonday);
        nextUpdate.setHours(3, 0, 0, 0);
        break;
      }
      case 'monthly':
        nextUpdate.setMonth(nextUpdate.getMonth() + 1);
        nextUpdate.setDate(1);
        nextUpdate.setHours(4, 0, 0, 0);
        break;
      case 'quarterly': {
        const currentQuarter = Math.floor(nextUpdate.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3;
        if (nextQuarterMonth >= 12) {
          nextUpdate.setFullYear(nextUpdate.getFullYear() + 1);
          nextUpdate.setMonth(0);
        } else {
          nextUpdate.setMonth(nextQuarterMonth);
        }
        nextUpdate.setDate(1);
        nextUpdate.setHours(5, 0, 0, 0);
        break;
      }
      default:
        // По умолчанию используем monthly
        nextUpdate.setMonth(nextUpdate.getMonth() + 1);
        nextUpdate.setDate(1);
        nextUpdate.setHours(4, 0, 0, 0);
        break;
    }

    return nextUpdate;
  }

  /**
   * Получает детальную информацию о KPI конкретного преподавателя
   */
  async getTeacherKpiDetails(teacherId: number) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: true,
          workloads: {
            include: {
              subjectWorkloads: true,
              monthlyHours: true,
            },
          },
          studyPlans: true,
          schedules: true,
        },
      });

      if (!teacher) {
        throw new NotFoundException('Преподаватель не найден');
      }

      const settings = await this.getSettings();
      const metrics = await this.calculateTeacherMetrics(teacher, settings.settings);
      const overallScore = this.calculateOverallScore(metrics, settings.settings);

      return {
        teacher: {
          id: teacher.id,
          name: `${teacher.user.name} ${teacher.user.surname}`,
          email: teacher.user.email,
        },
        metrics: {
          teachingQuality: {
            value: metrics.teachingQuality,
            weight: settings.settings.metrics.find(m => m.name === 'Качество преподавания')?.weight || 0,
            isActive: settings.settings.metrics.find(m => m.name === 'Качество преподавания')?.isActive || false,
          },
          workloadCompliance: {
            value: metrics.workloadCompliance,
            weight: settings.settings.metrics.find(m => m.name === 'Выполнение нагрузки')?.weight || 0,
            isActive: settings.settings.metrics.find(m => m.name === 'Выполнение нагрузки')?.isActive || false,
          },
          classAttendance: {
            value: metrics.classAttendance,
            weight: settings.settings.metrics.find(m => m.name === 'Посещаемость занятий')?.weight || 0,
            isActive: settings.settings.metrics.find(m => m.name === 'Посещаемость занятий')?.isActive || false,
          },
          studentSatisfaction: {
            value: metrics.studentSatisfaction,
            weight: settings.settings.metrics.find(m => m.name === 'Удовлетворенность студентов')?.weight || 0,
            isActive: settings.settings.metrics.find(m => m.name === 'Удовлетворенность студентов')?.isActive || false,
          },
          professionalDevelopment: {
            value: metrics.professionalDevelopment,
            weight: settings.settings.metrics.find(m => m.name === 'Профессиональное развитие')?.weight || 0,
            isActive: settings.settings.metrics.find(m => m.name === 'Профессиональное развитие')?.isActive || false,
          },
        },
        overallScore: Math.round(overallScore),
        lastCalculated: new Date(),
        rawData: {
          subjectsCount: teacher.studyPlans.length,
          schedulesCount: teacher.schedules.length,
          totalWorkloadHours: teacher.workloads.reduce((sum, w) => sum + w.standardHours, 0),
          actualWorkloadHours: teacher.workloads.reduce((sum, w) => sum + w.actualHours, 0),
        },
      };
    } catch (error) {
      console.error('Ошибка при получении детальной информации KPI:', error);
      throw error;
    }
  }

  /**
   * НОВЫЕ МЕТОДЫ РАСЧЕТА KPI МЕТРИК
   */

  /**
   * Прогресс ученика по контрольным работам
   */
  private async calculateStudentControlWorksProgress(teacherId: number): Promise<number> {
    try {
      const controlWorksResults = await this.prisma.lessonResult.findMany({
        include: {
          Lesson: {
            include: {
              studyPlan: true,
            },
          },
        },
        where: {
          Lesson: {
            type: 'CONTROL_WORK',
            studyPlan: {
              teacherId: teacherId,
            },
            deletedAt: null,
          },
          lessonScore: {
            not: null,
          },
          deletedAt: null,
        },
      });

      if (controlWorksResults.length === 0) {
        return 0; // Нет данных о контрольных работах, показываем 0
      }

      // Считаем процент положительных оценок (>= 4 из 5)
      const positiveScores = controlWorksResults.filter(result => result.lessonScore && result.lessonScore >= 4).length;
      const progressPercentage = (positiveScores / controlWorksResults.length) * 100;

      return Math.round(progressPercentage);
    } catch (error) {
      console.error('Error calculating control works progress:', error);
      return 0;
    }
  }

  /**
   * Заполнение журнала
   */
  private async calculateJournalFilling(teacherId: number): Promise<number> {
    try {
      const totalLessons = await this.prisma.lesson.count({
        where: {
          studyPlan: {
            teacherId: teacherId,
          },
          deletedAt: null,
        },
      });

      if (totalLessons === 0) {
        return 0; // Нет уроков, показываем 0
      }

      const lessonsWithResults = await this.prisma.lesson.count({
        where: {
          studyPlan: {
            teacherId: teacherId,
          },
          deletedAt: null,
          LessonResult: {
            some: {
              OR: [
                { lessonScore: { not: null } },
                { attendance: { not: null } },
              ],
              deletedAt: null,
            },
          },
        },
      });

      const fillingPercentage = (lessonsWithResults / totalLessons) * 100;
      return Math.round(fillingPercentage);
    } catch (error) {
      console.error('Error calculating journal filling:', error);
      return 0;
    }
  }

  /**
   * Заполнение плана работ (КТП)
   */
  private async calculateWorkPlanFilling(teacherId: number): Promise<number> {
    try {
      const curriculumPlans = await this.prisma.curriculumPlan.findMany({
        where: {
          studyPlan: {
            teacherId: teacherId,
          },
          deletedAt: null,
        },
      });

      if (curriculumPlans.length === 0) {
        return 0; // Нет КТП, показываем 0
      }

      // Считаем средний процент выполнения КТП
      const avgCompletion = curriculumPlans.reduce((sum, plan) => sum + plan.completionRate, 0) / curriculumPlans.length;
      return Math.round(avgCompletion);
    } catch (error) {
      console.error('Error calculating work plan filling:', error);
      return 0;
    }
  }

  /**
   * Заполнение уроков дополнительным материалом
   */
  private async calculateLessonMaterials(teacherId: number): Promise<number> {
    try {
      const totalLessons = await this.prisma.lesson.count({
        where: {
          studyPlan: {
            teacherId: teacherId,
          },
          deletedAt: null,
        },
      });

      if (totalLessons === 0) {
        return 0; // Нет уроков, показываем 0
      }

      const lessonsWithMaterials = await this.prisma.lesson.count({
        where: {
          studyPlan: {
            teacherId: teacherId,
          },
          deletedAt: null,
          materialsId: {
            not: null,
          },
        },
      });

      const materialsPercentage = (lessonsWithMaterials / totalLessons) * 100;
      return Math.round(materialsPercentage);
    } catch (error) {
      console.error('Error calculating lesson materials:', error);
      return 0;
    }
  }

  /**
   * Обратная связь родителю
   */
  private async calculateParentResponse(teacherId: number): Promise<number> {
    try {
      // Находим студентов данного преподавателя
      const studentsOfTeacher = await this.prisma.student.findMany({
        where: {
          group: {
            studyPlans: {
              some: {
                teacherId: teacherId,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          Parents: {
            include: {
              user: true,
            },
          },
        },
      });

      if (studentsOfTeacher.length === 0) {
        return -1; // Нет студентов у преподавателя
      }

      // Получаем ID всех родителей студентов этого преподавателя
      const parentUserIds = studentsOfTeacher.flatMap(student => 
        student.Parents.map(parent => parent.user.id)
      );

      if (parentUserIds.length === 0) {
        return -1; // Нет родителей
      }

      // Находим чаты где участвуют и преподаватель, и родители
      const teacherUser = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true },
      });

      if (!teacherUser) {
        return -1;
      }

      const relevantChats = await this.prisma.chatRoom.findMany({
        where: {
          participants: {
            some: {
              userId: teacherUser.user.id,
            },
          },
          AND: {
            participants: {
              some: {
                userId: {
                  in: parentUserIds,
                },
              },
            },
          },
        },
        include: {
          messages: {
            include: {
              sender: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 50, // Последние 50 сообщений в каждом чате
          },
        },
      });

      if (relevantChats.length === 0) {
        return 0; // Нет чатов с родителями, но это не ошибка
      }

      // Анализируем время ответа преподавателя
      let totalResponseTime = 0;
      let responseCount = 0;

      for (const chat of relevantChats) {
        const messages = chat.messages;
        
        for (let i = 0; i < messages.length - 1; i++) {
          const currentMsg = messages[i];
          const nextMsg = messages[i + 1];

          // Если текущее сообщение от родителя, а следующее от преподавателя
          if (parentUserIds.includes(currentMsg.sender.id) && 
              currentMsg.sender.id !== teacherUser.user.id &&
              nextMsg.sender.id === teacherUser.user.id) {
            
            const responseTime = nextMsg.createdAt.getTime() - currentMsg.createdAt.getTime();
            const responseHours = responseTime / (1000 * 60 * 60);
            
            if (responseHours <= 48 && responseHours > 0) { // Учитываем ответы в течение 48 часов
              totalResponseTime += responseHours;
              responseCount++;
            }
          }
        }
      }

      if (responseCount === 0) {
        return 50; // Базовый балл если есть чаты, но нет измеримых ответов
      }

      const avgResponseTime = totalResponseTime / responseCount;
      
      // Оценка: чем быстрее ответ, тем выше балл
      // <= 2 часа = 100 баллов, <= 6 часов = 90 баллов, <= 12 часов = 80 баллов, <= 24 часа = 70 баллов
      let score = 50;
      if (avgResponseTime <= 2) {
        score = 100;
      } else if (avgResponseTime <= 6) {
        score = 90;
      } else if (avgResponseTime <= 12) {
        score = 80;
      } else if (avgResponseTime <= 24) {
        score = 70;
      } else if (avgResponseTime <= 48) {
        score = 60;
      }

      return Math.round(score);
    } catch (error) {
      console.error('Error calculating parent response:', error);
      return -1;
    }
  }

  /**
   * Отзывы от родителей
   */
  private async calculateParentFeedback(teacherId: number): Promise<number> {
    try {
      // Получаем студентов данного преподавателя
      const studentsOfTeacher = await this.prisma.student.findMany({
        where: {
          group: {
            studyPlans: {
              some: {
                teacherId: teacherId,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          Parents: {
            include: {
              user: true,
            },
          },
        },
      });

      if (studentsOfTeacher.length === 0) {
        return -1; // Нет студентов у преподавателя
      }

      // Получаем ID всех родителей студентов этого преподавателя
      const parentUserIds = studentsOfTeacher.flatMap(student => 
        student.Parents.map(parent => parent.user.id)
      );

      if (parentUserIds.length === 0) {
        return -1; // Нет родителей
      }

      // Получаем отзывы только от родителей студентов этого преподавателя
      const feedbacks = await this.prisma.feedbackResponse.findMany({
        include: {
          user: true,
          template: true,
        },
        where: {
          userId: {
            in: parentUserIds,
          },
          user: {
            role: 'PARENT',
          },
          isCompleted: true,
          // Получаем отзывы за последние 6 месяцев
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (feedbacks.length === 0) {
        return 0; // Нет отзывов от родителей данного преподавателя
      }

      // Анализируем ответы родителей
      let totalRating = 0;
      let ratingCount = 0;

      feedbacks.forEach(feedback => {
        const answers = feedback.answers as any;
        if (answers && typeof answers === 'object') {
          // Ищем вопросы об оценке преподавателя/качества обучения
          Object.entries(answers).forEach(([questionKey, answer]: [string, any]) => {
            // Проверяем, относится ли вопрос к оценке качества обучения
            const isTeacherRating = questionKey.toLowerCase().includes('преподават') ||
                                   questionKey.toLowerCase().includes('качеств') ||
                                   questionKey.toLowerCase().includes('удовлетворен') ||
                                   questionKey.toLowerCase().includes('оценка');

            if (isTeacherRating && typeof answer === 'number' && answer >= 1 && answer <= 5) {
              totalRating += answer;
              ratingCount++;
            }
          });
        }
      });

      if (ratingCount === 0) {
        // Если нет специфических оценок, анализируем все числовые ответы
        feedbacks.forEach(feedback => {
          const answers = feedback.answers as any;
          if (answers && typeof answers === 'object') {
            Object.values(answers).forEach((answer: any) => {
              if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
                totalRating += answer;
                ratingCount++;
              }
            });
          }
        });
      }

      if (ratingCount === 0) {
        return 50; // Базовый балл если есть фидбеки, но нет числовых оценок
      }

      const avgRating = totalRating / ratingCount;
      const feedbackScore = (avgRating / 5) * 100; // Приводим к шкале 0-100

      return Math.round(feedbackScore);
    } catch (error) {
      console.error('Error calculating parent feedback:', error);
      return -1;
    }
  }

  /**
   * Процент удержания учеников (только фидбеки)
   */
  private async calculateStudentRetention(teacherId: number): Promise<number> {
    try {
      // Получаем данные только из агрегации фидбеков
      const feedbackResult = await this.feedbackAggregationService.aggregateStudentRetentionKpi(teacherId);
      
      // Если есть фидбеки с достаточной уверенностью (>= 0.3), используем их
      if (feedbackResult.confidence >= 0.3 && feedbackResult.responseCount > 0) {
        return feedbackResult.score;
      }

      // Если фидбеков недостаточно - возвращаем 0 (нет данных)
      return 0;
    } catch (error) {
      console.error('Error calculating student retention:', error);
      return 0;
    }
  }

  /**
   * МЕТОДЫ ДЛЯ РАБОТЫ С ДОСТИЖЕНИЯМИ
   */

  /**
   * Создание достижения преподавателя
   */
  async createAchievement(achievementData: any) {
    try {
      const achievement = await this.prisma.teacherAchievement.create({
        data: {
          teacherId: achievementData.teacherId,
          type: achievementData.type,
          title: achievementData.title,
          description: achievementData.description,
          date: new Date(achievementData.date),
          points: achievementData.points || 0,
          evidenceUrl: achievementData.evidenceUrl,
        },
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        message: 'Достижение успешно добавлено',
        achievement: {
          id: achievement.id,
          teacherId: achievement.teacherId,
          teacherName: `${achievement.teacher.user.name} ${achievement.teacher.user.surname}`,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          date: achievement.date,
          points: achievement.points,
          isVerified: achievement.isVerified,
          createdAt: achievement.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw new Error('Не удалось создать достижение');
    }
  }

  /**
   * Создание результата олимпиады
   */
  async createOlympiadResult(resultData: any) {
    try {
      const result = await this.prisma.olympiadResult.create({
        data: {
          studentId: resultData.studentId,
          teacherId: resultData.teacherId,
          olympiadName: resultData.olympiadName,
          subject: resultData.subject,
          level: resultData.level,
          place: resultData.place,
          date: new Date(resultData.date),
          certificateUrl: resultData.certificateUrl,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      // Автоматически создаем достижение для преподавателя
      await this.createAchievement({
        teacherId: resultData.teacherId,
        type: 'OLYMPIAD_WIN',
        title: `Призовое место на олимпиаде: ${resultData.olympiadName}`,
        description: `Ученик занял ${resultData.place} место по предмету ${resultData.subject}`,
        date: resultData.date,
        points: this.calculateOlympiadPoints(resultData.level, resultData.place),
      });

      return {
        message: 'Результат олимпиады успешно добавлен',
        result: {
          id: result.id,
          studentName: `${result.student.user.name} ${result.student.user.surname}`,
          teacherName: `${result.teacher.user.name} ${result.teacher.user.surname}`,
          olympiadName: result.olympiadName,
          subject: result.subject,
          level: result.level,
          place: result.place,
          date: result.date,
          createdAt: result.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating olympiad result:', error);
      throw new Error('Не удалось создать результат олимпиады');
    }
  }

  /**
   * Создание записи о поступлении ученика
   */
  async createStudentAdmission(admissionData: any) {
    try {
      const admission = await this.prisma.studentAdmission.create({
        data: {
          studentId: admissionData.studentId,
          teacherId: admissionData.teacherId,
          schoolType: admissionData.schoolType,
          schoolName: admissionData.schoolName,
          admissionYear: admissionData.admissionYear,
          documentUrl: admissionData.documentUrl,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      // Автоматически создаем достижение для преподавателя
      await this.createAchievement({
        teacherId: admissionData.teacherId,
        type: 'SCHOOL_ADMISSION',
        title: `Поступление ученика в ${admissionData.schoolName}`,
        description: `Ученик поступил в ${this.getSchoolTypeLabel(admissionData.schoolType)}`,
        date: `${admissionData.admissionYear}-09-01`,
        points: this.calculateAdmissionPoints(admissionData.schoolType),
      });

      return {
        message: 'Поступление ученика успешно добавлено',
        admission: {
          id: admission.id,
          studentName: `${admission.student.user.name} ${admission.student.user.surname}`,
          teacherName: `${admission.teacher.user.name} ${admission.teacher.user.surname}`,
          schoolType: admission.schoolType,
          schoolName: admission.schoolName,
          admissionYear: admission.admissionYear,
          createdAt: admission.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating student admission:', error);
      throw new Error('Не удалось создать запись о поступлении');
    }
  }

  /**
   * Получение списка достижений с фильтрацией
   */
  async getAchievements(teacherId?: number, type?: string, limit: number = 20, offset: number = 0) {
    try {
      const where: any = {};
      if (teacherId) where.teacherId = teacherId;
      if (type) where.type = type;

      const [achievements, total] = await Promise.all([
        this.prisma.teacherAchievement.findMany({
          where,
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.teacherAchievement.count({ where }),
      ]);

      return {
        achievements: achievements.map(achievement => ({
          id: achievement.id,
          teacherId: achievement.teacherId,
          teacherName: `${achievement.teacher.user.name} ${achievement.teacher.user.surname}`,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          date: achievement.date,
          points: achievement.points,
          isVerified: achievement.isVerified,
          createdAt: achievement.createdAt,
        })),
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw new Error('Не удалось получить список достижений');
    }
  }

  /**
   * Получение результатов олимпиад
   */
  async getOlympiadResults(teacherId?: number, limit: number = 20, offset: number = 0) {
    try {
      const where: any = {};
      if (teacherId) where.teacherId = teacherId;

      const [results, total] = await Promise.all([
        this.prisma.olympiadResult.findMany({
          where,
          include: {
            student: {
              include: {
                user: true,
              },
            },
            teacher: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.olympiadResult.count({ where }),
      ]);

      return {
        results: results.map(result => ({
          id: result.id,
          studentName: `${result.student.user.name} ${result.student.user.surname}`,
          teacherName: `${result.teacher.user.name} ${result.teacher.user.surname}`,
          olympiadName: result.olympiadName,
          subject: result.subject,
          level: result.level,
          place: result.place,
          date: result.date,
          createdAt: result.createdAt,
        })),
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting olympiad results:', error);
      throw new Error('Не удалось получить результаты олимпиад');
    }
  }

  /**
   * Получение поступлений учеников
   */
  async getStudentAdmissions(teacherId?: number, limit: number = 20, offset: number = 0) {
    try {
      const where: any = {};
      if (teacherId) where.teacherId = teacherId;

      const [admissions, total] = await Promise.all([
        this.prisma.studentAdmission.findMany({
          where,
          include: {
            student: {
              include: {
                user: true,
              },
            },
            teacher: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            admissionYear: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.studentAdmission.count({ where }),
      ]);

      return {
        admissions: admissions.map(admission => ({
          id: admission.id,
          studentName: `${admission.student.user.name} ${admission.student.user.surname}`,
          teacherName: `${admission.teacher.user.name} ${admission.teacher.user.surname}`,
          schoolType: admission.schoolType,
          schoolName: admission.schoolName,
          admissionYear: admission.admissionYear,
          createdAt: admission.createdAt,
        })),
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting student admissions:', error);
      throw new Error('Не удалось получить список поступлений');
    }
  }

  /**
   * Расчет баллов за олимпиаду
   */
  private calculateOlympiadPoints(level: string, place: number): number {
    const levelMultiplier = {
      'Международный': 50,
      'Республиканский': 30,
      'Городской': 20,
      'Школьный': 10,
    };

    const placeMultiplier = {
      1: 1.0,
      2: 0.8,
      3: 0.6,
    };

    const basePoints = levelMultiplier[level] || 10;
    const modifier = placeMultiplier[place] || 0.5;

    return Math.round(basePoints * modifier);
  }

  /**
   * Расчет баллов за поступление
   */
  private calculateAdmissionPoints(schoolType: string): number {
    const points = {
      'RFMSH': 40,
      'NISH': 35,
      'BIL': 30,
      'LYCEUM': 20,
      'PRIVATE_SCHOOL': 15,
    };

    return points[schoolType] || 10;
  }

  /**
   * Получение названия типа школы
   */
  private getSchoolTypeLabel(schoolType: string): string {
    const labels = {
      'RFMSH': 'РФМШ',
      'NISH': 'НИШ',
      'BIL': 'БИЛ',
      'LYCEUM': 'лицей',
      'PRIVATE_SCHOOL': 'частную школу',
    };

    return labels[schoolType] || 'учебное заведение';
  }

  /**
   * Обновление достижения преподавателя
   */
  async updateAchievement(achievementId: number, achievementData: any) {
    try {
      const achievement = await this.prisma.teacherAchievement.update({
        where: { id: achievementId },
        data: {
          type: achievementData.type,
          title: achievementData.title,
          description: achievementData.description,
          date: achievementData.date ? new Date(achievementData.date) : undefined,
          points: achievementData.points,
          evidenceUrl: achievementData.evidenceUrl,
        },
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        message: 'Достижение успешно обновлено',
        achievement: {
          id: achievement.id,
          teacherId: achievement.teacherId,
          teacherName: `${achievement.teacher.user.name} ${achievement.teacher.user.surname}`,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
          date: achievement.date,
          points: achievement.points,
          isVerified: achievement.isVerified,
          updatedAt: achievement.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw new Error('Не удалось обновить достижение');
    }
  }

  /**
   * Обновление результата олимпиады
   */
  async updateOlympiadResult(resultId: number, resultData: any) {
    try {
      const result = await this.prisma.olympiadResult.update({
        where: { id: resultId },
        data: {
          olympiadName: resultData.olympiadName,
          subject: resultData.subject,
          level: resultData.level,
          place: resultData.place,
          date: resultData.date ? new Date(resultData.date) : undefined,
          certificateUrl: resultData.certificateUrl,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        message: 'Результат олимпиады успешно обновлен',
        result: {
          id: result.id,
          studentName: `${result.student.user.name} ${result.student.user.surname}`,
          teacherName: `${result.teacher.user.name} ${result.teacher.user.surname}`,
          olympiadName: result.olympiadName,
          subject: result.subject,
          level: result.level,
          place: result.place,
          date: result.date,
          updatedAt: result.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error updating olympiad result:', error);
      throw new Error('Не удалось обновить результат олимпиады');
    }
  }

  /**
   * Обновление записи о поступлении ученика
   */
  async updateStudentAdmission(admissionId: number, admissionData: any) {
    try {
      const admission = await this.prisma.studentAdmission.update({
        where: { id: admissionId },
        data: {
          schoolType: admissionData.schoolType,
          schoolName: admissionData.schoolName,
          admissionYear: admissionData.admissionYear,
          documentUrl: admissionData.documentUrl,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        message: 'Поступление ученика успешно обновлено',
        admission: {
          id: admission.id,
          studentName: `${admission.student.user.name} ${admission.student.user.surname}`,
          teacherName: `${admission.teacher.user.name} ${admission.teacher.user.surname}`,
          schoolType: admission.schoolType,
          schoolName: admission.schoolName,
          admissionYear: admission.admissionYear,
          updatedAt: admission.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error updating student admission:', error);
      throw new Error('Не удалось обновить запись о поступлении');
    }
  }

  /**
   * Получение студентов преподавателя для форм
   */
  async getStudents(teacherId: number) {
    try {
      const students = await this.prisma.student.findMany({
        where: {
          group: {
            studyPlans: {
              some: {
                teacherId: teacherId,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          user: true,
        },
        orderBy: {
          user: {
            name: 'asc',
          },
        },
      });

      return students.map(student => ({
        id: student.id,
        name: `${student.user.name} ${student.user.surname}`.trim(),
        email: student.user.email,
      }));
    } catch (error) {
      console.error('Error getting students for teacher:', error);
      throw new Error('Не удалось получить список студентов');
    }
  }

  /**
   * РАСЧЕТ ОБЩЕГО БАЛЛА KPI ПО ПЕРИОДИЧЕСКИМ ДОСТИЖЕНИЯМ
   */

  /**
   * Рассчитывает общий балл KPI по периодическим достижениям для преподавателя
   */
  async calculatePeriodicKpiScore(teacherId: number, period?: { start: Date; end: Date }) {
    try {
      // Устанавливаем период по умолчанию (последний год)
      const defaultPeriod = {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const calculationPeriod = period || defaultPeriod;

      console.log(`🧮 Расчет KPI для преподавателя ${teacherId}:`, {
        период: {
          start: calculationPeriod.start.toISOString(),
          end: calculationPeriod.end.toISOString()
        }
      });

      // Получаем все периодические достижения преподавателя за период
      const achievements = await this.prisma.teacherAchievement.findMany({
        where: {
          teacherId,
          date: {
            gte: calculationPeriod.start,
            lte: calculationPeriod.end,
          },
          deletedAt: null,
        },
        orderBy: {
          date: 'desc',
        },
      });

      console.log(`📝 Найдено достижений: ${achievements.length}`, achievements.map(a => ({
        id: a.id,
        title: a.title,
        date: a.date.toISOString(),
        points: a.points
      })));

      // Получаем результаты олимпиад за период
      const olympiadResults = await this.prisma.olympiadResult.findMany({
        where: {
          teacherId,
          date: {
            gte: calculationPeriod.start,
            lte: calculationPeriod.end,
          },
          deletedAt: null,
        },
        orderBy: {
          date: 'desc',
        },
      });

      console.log(`🏆 Найдено результатов олимпиад: ${olympiadResults.length}`, olympiadResults.map(o => ({
        id: o.id,
        olympiadName: o.olympiadName,
        date: o.date.toISOString(),
        place: o.place
      })));

      // Получаем поступления учеников за период
      const studentAdmissions = await this.prisma.studentAdmission.findMany({
        where: {
          teacherId,
          // Для поступлений учитываем учебный год
          admissionYear: {
            gte: calculationPeriod.start.getFullYear(),
            lte: calculationPeriod.end.getFullYear(),
          },
          deletedAt: null,
        },
        orderBy: {
          admissionYear: 'desc',
        },
      });

      console.log(`🎓 Найдено поступлений: ${studentAdmissions.length}`, studentAdmissions.map(s => ({
        id: s.id,
        schoolName: s.schoolName,
        admissionYear: s.admissionYear
      })));

      // Рассчитываем баллы по каждой категории
      const scores = {
        olympiadWins: this.calculateOlympiadKpiScore(olympiadResults),
        schoolAdmissions: this.calculateSchoolAdmissionKpiScore(studentAdmissions),
        qualifications: this.calculateQualificationKpiScore(achievements),
        teamEvents: this.calculateTeamEventKpiScore(achievements),
        projectHelp: this.calculateProjectHelpKpiScore(achievements),
        totalPoints: achievements.reduce((sum, ach) => sum + ach.points, 0),
      };

      // Получаем настройки для расчета общего балла
      const settings = await this.getSettings();
      const periodicMetrics = settings.settings.metrics.filter(m => m.type === 'periodic' && m.isActive);

      // Рассчитываем общий балл по периодическим метрикам
      let totalScore = 0;
      let totalWeight = 0;

      for (const metric of periodicMetrics) {
        let metricScore = 0;
        
        switch (metric.name) {
          case 'Призовые места на олимпиадах':
            metricScore = scores.olympiadWins;
            break;
          case 'Поступление в РФМШ/НИШ/БИЛ':
            metricScore = scores.schoolAdmissions.elite;
            break;
          case 'Поступление в лицеи/частные школы':
            metricScore = scores.schoolAdmissions.regular;
            break;
          case 'Повышение квалификации':
            metricScore = scores.qualifications;
            break;
          case 'Участие в командных мероприятиях':
            metricScore = scores.teamEvents;
            break;
          case 'Помощь в проектах':
            metricScore = scores.projectHelp;
            break;
        }

        // Учитываем вес метрики только если она имеет бонусные баллы
        if (metric.weight > 0) {
          totalScore += metricScore * (metric.weight / 100);
          totalWeight += metric.weight;
        }
      }

      // Бонусные баллы (не входят в основной расчет, но добавляются сверху)
      const bonusPoints = Math.min(scores.totalPoints / 10, 20); // Максимум 20 бонусных баллов

      return {
        teacherId,
        period: calculationPeriod,
        scores,
        totalPeriodicScore: totalWeight > 0 ? Math.round(totalScore) : 0,
        bonusPoints: Math.round(bonusPoints),
        overallPeriodicKpi: Math.min(Math.round(totalScore + bonusPoints), 100),
        achievements: {
          total: achievements.length,
          olympiads: olympiadResults.length,
          admissions: studentAdmissions.length,
        },
        breakdown: {
          olympiadWins: scores.olympiadWins,
          eliteSchoolAdmissions: scores.schoolAdmissions.elite,
          regularSchoolAdmissions: scores.schoolAdmissions.regular,
          qualifications: scores.qualifications,
          teamEvents: scores.teamEvents,
          projectHelp: scores.projectHelp,
        },
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error calculating periodic KPI score:', error);
      throw new Error('Не удалось рассчитать периодический KPI');
    }
  }

  /**
   * Рассчитывает балл по олимпиадам
   */
  private calculateOlympiadKpiScore(olympiadResults: any[]): number {
    if (olympiadResults.length === 0) return 0;

    let totalScore = 0;
    const levelWeights = {
      'Международный': 100,
      'Республиканский': 80,
      'Городской': 60,
      'Школьный': 40,
    };

    const placeWeights = {
      1: 1.0,
      2: 0.8,
      3: 0.6,
    };

    olympiadResults.forEach(result => {
      const levelWeight = levelWeights[result.level] || 20;
      const placeWeight = placeWeights[result.place] || 0.4;
      totalScore += levelWeight * placeWeight;
    });

    // Нормализуем к шкале 0-100
    return Math.min(Math.round(totalScore / 2), 100);
  }

  /**
   * Рассчитывает балл по поступлениям в учебные заведения
   */
  private calculateSchoolAdmissionKpiScore(admissions: any[]): { elite: number; regular: number } {
    if (admissions.length === 0) return { elite: 0, regular: 0 };

    const eliteSchools = ['RFMSH', 'NISH', 'BIL'];
    const regularSchools = ['LYCEUM', 'PRIVATE_SCHOOL'];

    const eliteAdmissions = admissions.filter(adm => eliteSchools.includes(adm.schoolType));
    const regularAdmissions = admissions.filter(adm => regularSchools.includes(adm.schoolType));

    // Элитные школы: каждое поступление = 25 баллов (максимум 100)
    const eliteScore = Math.min(eliteAdmissions.length * 25, 100);

    // Обычные школы: каждое поступление = 15 баллов (максимум 75)
    const regularScore = Math.min(regularAdmissions.length * 15, 75);

    return {
      elite: eliteScore,
      regular: regularScore,
    };
  }

  /**
   * Рассчитывает балл по повышению квалификации
   */
  private calculateQualificationKpiScore(achievements: any[]): number {
    const qualificationAchievements = achievements.filter(ach => ach.type === 'QUALIFICATION');
    
    if (qualificationAchievements.length === 0) return 0;

    // Каждое повышение квалификации = 20 баллов (максимум 100)
    return Math.min(qualificationAchievements.length * 20, 100);
  }

  /**
   * Рассчитывает балл по участию в командных мероприятиях
   */
  private calculateTeamEventKpiScore(achievements: any[]): number {
    const teamEventAchievements = achievements.filter(ach => ach.type === 'TEAM_EVENT');
    
    if (teamEventAchievements.length === 0) return 0;

    // Каждое мероприятие = 15 баллов (максимум 90)
    return Math.min(teamEventAchievements.length * 15, 90);
  }

  /**
   * Рассчитывает балл по помощи в проектах
   */
  private calculateProjectHelpKpiScore(achievements: any[]): number {
    const projectHelpAchievements = achievements.filter(ach => ach.type === 'PROJECT_HELP');
    
    if (projectHelpAchievements.length === 0) return 0;

    // Каждый проект = 10 баллов (максимум 80)
    return Math.min(projectHelpAchievements.length * 10, 80);
  }

  /**
   * Получает периодический KPI для всех преподавателей
   */
  async getAllTeachersPeriodicKpi(period?: { start: Date; end: Date }) {
    try {
      const teachers = await this.prisma.teacher.findMany({
        include: {
          user: true,
        },
        where: {
          deletedAt: null,
        },
      });

      // Логируем период для отладки
      console.log('📅 Период фильтрации KPI:', {
        start: period?.start?.toISOString(),
        end: period?.end?.toISOString(),
        isPeriodProvided: !!period
      });

      const results = await Promise.all(
        teachers.map(async teacher => {
          const periodicKpi = await this.calculatePeriodicKpiScore(teacher.id, period);
          return {
            teacherId: teacher.id,
            teacherName: `${teacher.user.name} ${teacher.user.surname}`,
            email: teacher.user.email,
            rank: 0, // Будет установлен после сортировки
            ...periodicKpi,
          };
        })
      );

      // Сортируем по общему периодическому KPI
      results.sort((a, b) => b.overallPeriodicKpi - a.overallPeriodicKpi);

      // Добавляем ранги
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      return {
        teachers: results,
        summary: {
          totalTeachers: results.length,
          averageScore: Math.round(results.reduce((sum, r) => sum + r.overallPeriodicKpi, 0) / results.length),
          topPerformers: results.filter(r => r.overallPeriodicKpi >= 80).length,
          hasAchievements: results.filter(r => r.achievements.total > 0).length,
        },
        period: period || {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
      };
    } catch (error) {
      console.error('Error getting all teachers periodic KPI:', error);
      throw new Error('Не удалось получить периодический KPI для всех преподавателей');
    }
  }

  /**
   * Получает топ достижений по периоду
   */
  async getTopPeriodicAchievements(period?: { start: Date; end: Date }, limit: number = 10) {
    try {
      const calculationPeriod = period || {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      // Получаем топ достижения
      const topAchievements = await this.prisma.teacherAchievement.findMany({
        where: {
          date: {
            gte: calculationPeriod.start,
            lte: calculationPeriod.end,
          },
          points: {
            gt: 0,
          },
          deletedAt: null,
        },
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          points: 'desc',
        },
        take: limit,
      });

      // Получаем топ олимпиады
      const topOlympiads = await this.prisma.olympiadResult.findMany({
        where: {
          date: {
            gte: calculationPeriod.start,
            lte: calculationPeriod.end,
          },
          deletedAt: null,
        },
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          { level: 'desc' },
          { place: 'asc' },
        ],
        take: limit,
      });

      // Получаем топ поступления
      const topAdmissions = await this.prisma.studentAdmission.findMany({
        where: {
          admissionYear: {
            gte: calculationPeriod.start.getFullYear(),
            lte: calculationPeriod.end.getFullYear(),
          },
          deletedAt: null,
        },
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          { schoolType: 'asc' }, // RFMSH, NISH, BIL идут первыми
          { admissionYear: 'desc' },
        ],
        take: limit,
      });

      return {
        period: calculationPeriod,
        topAchievements: topAchievements.map(ach => ({
          id: ach.id,
          teacherName: `${ach.teacher.user.name} ${ach.teacher.user.surname}`,
          type: ach.type,
          title: ach.title,
          points: ach.points,
          date: ach.date,
        })),
        topOlympiads: topOlympiads.map(olympiad => ({
          id: olympiad.id,
          teacherName: `${olympiad.teacher.user.name} ${olympiad.teacher.user.surname}`,
          studentName: `${olympiad.student.user.name} ${olympiad.student.user.surname}`,
          olympiadName: olympiad.olympiadName,
          subject: olympiad.subject,
          level: olympiad.level,
          place: olympiad.place,
          date: olympiad.date,
        })),
        topAdmissions: topAdmissions.map(admission => ({
          id: admission.id,
          teacherName: `${admission.teacher.user.name} ${admission.teacher.user.surname}`,
          studentName: `${admission.student.user.name} ${admission.student.user.surname}`,
          schoolType: admission.schoolType,
          schoolName: admission.schoolName,
          admissionYear: admission.admissionYear,
        })),
      };
    } catch (error) {
      console.error('Error getting top periodic achievements:', error);
      throw new Error('Не удалось получить топ достижений');
    }
  }

  // Новые методы для периодических KPI
  async getPeriodicKpi(filter: {
    teacherId?: number;
    period?: string;
    year?: number;
    month?: number;
    quarter?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const period = this.buildPeriodFromFilter(filter);
    
    if (filter.teacherId) {
      return this.calculatePeriodicKpiScore(filter.teacherId, period);
    } else {
      return this.getAllTeachersPeriodicKpi(period);
    }
  }

  async getPeriodicStats(filter: {
    teacherId?: number;
    year?: number;
    period?: 'monthly' | 'quarterly' | 'yearly';
  }) {
    const year = filter.year || new Date().getFullYear();
    
    // Базовая статистика - пока возвращаем заглушку
    return {
      year,
      period: filter.period || 'yearly',
      teacherId: filter.teacherId,
      stats: {
        totalAchievements: 0,
        averageScore: 0,
        bestMonth: 'Январь',
        improvement: '+5%'
      }
    };
  }

  async getPeriodicTrends(filter: {
    teacherId?: number;
    startYear?: number;
    endYear?: number;
    achievementType?: string;
  }) {
    // Возвращаем данные для трендов
    const currentYear = new Date().getFullYear();
    const startYear = filter.startYear || (currentYear - 2);
    const endYear = filter.endYear || currentYear;
    
    const trends = [];
    for (let year = startYear; year <= endYear; year++) {
      trends.push({
        year,
        achievements: Math.floor(Math.random() * 10),
        score: Math.floor(Math.random() * 100)
      });
    }
    
    return { trends };
  }

  async getPeriodicComparison(filter: {
    teacherIds?: number[];
    period?: string;
    year?: number;
    comparisonType?: 'achievements' | 'olympiads' | 'admissions';
  }) {
    // Заглушка для сравнения
    return {
      comparison: filter.teacherIds?.map(id => ({
        teacherId: id,
        score: Math.floor(Math.random() * 100),
        achievements: Math.floor(Math.random() * 5)
      })) || []
    };
  }

  async exportPeriodicKpi(filter: {
    teacherId?: number;
    period?: string;
    year?: number;
    format?: 'xlsx' | 'csv' | 'pdf';
  }): Promise<Buffer> {
    const format = filter.format || 'xlsx';
    const data = await this.getPeriodicKpi(filter);
    
    // Преобразуем в формат для экспорта
    const exportData = [{
      'Преподаватель': 'Данные',
      'Период': filter.period || 'год',
      'Баллы': JSON.stringify(data)
    }];
    
    return this.generateExportFile(exportData, format);
  }

  // Методы верификации
  async verifyAchievement(achievementId: number, verified: boolean, comment?: string) {
    return this.prisma.teacherAchievement.update({
      where: { id: achievementId },
      data: { 
        isVerified: verified,
        verifiedAt: verified ? new Date() : null
      }
    });
  }

  async verifyOlympiadResult(resultId: number, verified: boolean, comment?: string) {
    // Пока возвращаем заглушку, так как нет поля isVerified в OlympiadResult
    return { message: 'Верификация результата олимпиады', verified, comment };
  }

  async verifyStudentAdmission(admissionId: number, verified: boolean, comment?: string) {
    // Пока возвращаем заглушку, так как нет поля isVerified в StudentAdmission
    return { message: 'Верификация поступления', verified, comment };
  }

  // Методы удаления
  async deleteAchievement(achievementId: number) {
    return this.prisma.teacherAchievement.update({
      where: { id: achievementId },
      data: { deletedAt: new Date() }
    });
  }

  async deleteOlympiadResult(resultId: number) {
    return this.prisma.olympiadResult.update({
      where: { id: resultId },
      data: { deletedAt: new Date() }
    });
  }

  async deleteStudentAdmission(admissionId: number) {
    return this.prisma.studentAdmission.update({
      where: { id: admissionId },
      data: { deletedAt: new Date() }
    });
  }

  // Массовые операции
  async bulkCreateAchievements(achievements: any[]) {
    const results = await Promise.all(
      achievements.map(achievement => this.createAchievement(achievement))
    );
    return { message: 'Достижения созданы', count: results.length };
  }

  async bulkUpdateAchievements(updates: { id: number; data: any }[]) {
    const results = await Promise.all(
      updates.map(update => this.updateAchievement(update.id, update.data))
    );
    return { message: 'Достижения обновлены', count: results.length };
  }

  async bulkDeleteAchievements(ids: number[]) {
    const results = await Promise.all(
      ids.map(id => this.deleteAchievement(id))
    );
    return { message: 'Достижения удалены', count: results.length };
  }

  // Сводка и метаданные
  async getKpiSummary(teacherId?: number, period?: string) {
    const summary = {
      totalTeachers: await this.prisma.teacher.count(),
      averageKpi: 75,
      topPerformers: 5,
      recentAchievements: 12
    };

    if (teacherId) {
      const teacherKpi = await this.calculatePeriodicKpiScore(teacherId);
      return { ...summary, teacherKpi };
    }

    return summary;
  }

  async getAchievementTypes() {
    return [
      { value: 'OLYMPIAD_WIN', label: 'Призовое место на олимпиаде' },
      { value: 'SCHOOL_ADMISSION', label: 'Поступление в школу' },
      { value: 'QUALIFICATION', label: 'Повышение квалификации' },
      { value: 'TEAM_EVENT', label: 'Участие в командных мероприятиях' },
      { value: 'PROJECT_HELP', label: 'Помощь в проектах' }
    ];
  }

  async getSchoolTypes() {
    return [
      { value: 'RFMSH', label: 'РФМШ' },
      { value: 'NISH', label: 'НИШ' },
      { value: 'BIL', label: 'БИЛ' },
      { value: 'LYCEUM', label: 'Лицей' },
      { value: 'PRIVATE_SCHOOL', label: 'Частная школа' }
    ];
  }

  // Периодические цели
  async getPeriodicGoals(teacherId?: number, year?: number) {
    // Заглушка для целей
    return {
      goals: [],
      teacherId,
      year: year || new Date().getFullYear()
    };
  }

  async setPeriodicGoals(goals: {
    teacherId: number;
    year: number;
    achievements?: number;
    olympiadWins?: number;
    studentAdmissions?: number;
  }) {
    // Заглушка для установки целей
    return {
      message: 'Цели установлены',
      goals
    };
  }

  async updatePeriodicGoals(goalId: number, goals: any) {
    // Заглушка для обновления целей
    return {
      message: 'Цели обновлены',
      goalId,
      goals
    };
  }

  // Вспомогательные методы
  private buildPeriodFromFilter(filter: any): { start: Date; end: Date } | undefined {
    if (filter.startDate && filter.endDate) {
      return {
        start: new Date(filter.startDate),
        end: new Date(filter.endDate)
      };
    }

    if (filter.year) {
      if (filter.month) {
        const start = new Date(filter.year, filter.month - 1, 1);
        const end = new Date(filter.year, filter.month, 0);
        return { start, end };
      }
      if (filter.quarter) {
        const start = new Date(filter.year, (filter.quarter - 1) * 3, 1);
        const end = new Date(filter.year, filter.quarter * 3, 0);
        return { start, end };
      }
      return {
        start: new Date(filter.year, 0, 1),
        end: new Date(filter.year, 11, 31)
      };
    }

    return undefined;
  }

  private async generateExportFile(data: any[], format: string): Promise<Buffer> {
    if (format === 'csv') {
      return this.generateCSV(data);
    } else if (format === 'pdf') {
      return await this.generatePDF(data);
    } else {
      return await this.generateXLSX(data);
    }
  }
}
