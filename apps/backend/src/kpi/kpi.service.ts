import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) { }

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
    const workloadChange = Math.round(workloadCompliance - 85); // отклонение от среднего целевого значения
    const teacherChange = teachersWithWorkload.length - Math.round(totalTeachers * 0.9); // отклонение от 90% активности
    const workloadHoursChange = Math.round(avgWorkloadHours - 18); // отклонение от целевых 18 часов

    const metrics: KpiMetricDto[] = [
      {
        name: 'Выполнение нагрузки',
        value: Math.round(workloadCompliance),
        target: 90,
        change: Math.max(-10, Math.min(10, workloadChange)),
        unit: '%',
        status: workloadCompliance >= 90 ? 'success' : workloadCompliance >= 75 ? 'warning' : 'danger',
      },
      {
        name: 'Активных преподавателей',
        value: teachersWithWorkload.length,
        target: totalTeachers,
        change: Math.max(-5, Math.min(5, teacherChange)),
        unit: '',
        status: teachersWithWorkload.length === totalTeachers ? 'success' : 'warning',
      },
      {
        name: 'Средняя нагрузка',
        value: Math.round(avgWorkloadHours),
        target: 20,
        change: Math.max(-5, Math.min(5, workloadHoursChange)),
        unit: 'ч/нед',
        status: avgWorkloadHours >= 18 ? 'success' : avgWorkloadHours >= 15 ? 'warning' : 'danger',
      },
    ];

    const overallKpi = Math.round(metrics.reduce((sum, m) => {
      const percentage = m.target > 0 ? (m.value / m.target * 100) : 0;
      return sum + Math.min(percentage, 100);
    }, 0) / metrics.length || 0);

    return {
      metrics,
      overallKpi,
      goalAchievement: Math.round(overallKpi * 0.85),
      activeGoals: 3,
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
        // Получаем все метрики KPI из настроек
        const metrics = await this.calculateTeacherMetrics(teacher, settings.settings);

        // Рассчитываем общий балл на основе весов из настроек
        const overallScore = this.calculateOverallScore(metrics, settings.settings);

        // Тренд - базируется на соотношении плановой и фактической нагрузки
        const totalWorkloadHours = teacher.workloads.reduce((sum, w) => sum + w.standardHours, 0);
        const actualHours = teacher.workloads.reduce((sum, w) => sum + w.actualHours, 0);
        const trend = totalWorkloadHours > 0 ? Math.round((actualHours - totalWorkloadHours) / totalWorkloadHours * 10) : 0;

        return {
          id: teacher.id,
          name: `${teacher.user.name} ${teacher.user.surname}`,
          overallScore: Math.round(overallScore),
          teachingQuality: Math.round(metrics.teachingQuality),
          studentSatisfaction: Math.round(metrics.studentSatisfaction),
          classAttendance: Math.round(metrics.classAttendance),
          workloadCompliance: Math.round(metrics.workloadCompliance),
          professionalDevelopment: Math.round(metrics.professionalDevelopment),
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

    // Если нет данных, создаем базовые значения
    if (trends.every(t => t.value === 0)) {
      trends.forEach((trend, index) => {
        trend.value = Math.round(75 + index * 2);
      });
    }

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
      : currentWorkloadCompliance * 0.95; // Если нет данных, считаем на 5% ниже

    // Создаем сравнение
    const comparison: KpiComparisonDto[] = [
      {
        category: 'Качество преподавания',
        current: Math.round(currentTeachingQuality),
        previous: Math.round(currentTeachingQuality * 0.97), // примерно на 3% ниже
        change: Math.round(currentTeachingQuality * 0.03),
        changePercent: Number((3.0).toFixed(1)),
      },
      {
        category: 'Активность в расписании',
        current: Math.round(currentScheduleActivity),
        previous: Math.round(currentScheduleActivity * 0.95),
        change: Math.round(currentScheduleActivity * 0.05),
        changePercent: Number((5.0).toFixed(1)),
      },
      {
        category: 'Выполнение нагрузки',
        current: Math.round(currentWorkloadCompliance),
        previous: Math.round(previousWorkloadCompliance),
        change: Math.round(currentWorkloadCompliance - previousWorkloadCompliance),
        changePercent: Number((((currentWorkloadCompliance - previousWorkloadCompliance) / previousWorkloadCompliance) * 100).toFixed(1)),
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
    // В реальном приложении настройки должны храниться в базе данных
    // Пока возвращаем дефолтные настройки с новыми метриками
    const defaultSettings: KpiSettingsDto = {
      metrics: [
        // Постоянные метрики
        {
          name: 'Прогресс ученика по контрольным работам',
          weight: 15,
          target: 85,
          successThreshold: 90,
          warningThreshold: 75,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Заполнение журнала',
          weight: 10,
          target: 95,
          successThreshold: 98,
          warningThreshold: 90,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Заполнение плана работ',
          weight: 10,
          target: 90,
          successThreshold: 95,
          warningThreshold: 85,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Заполнение уроков дополнительным материалом',
          weight: 10,
          target: 80,
          successThreshold: 90,
          warningThreshold: 70,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Обратная связь родителю',
          weight: 10,
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
          weight: 15,
          target: 90,
          successThreshold: 95,
          warningThreshold: 85,
          isActive: true,
          type: 'constant',
        },
        {
          name: 'Стабильность/постоянность',
          weight: 10,
          target: 85,
          successThreshold: 90,
          warningThreshold: 80,
          isActive: true,
          type: 'constant',
        },
        // Периодические метрики
        {
          name: 'Призовые места на олимпиадах',
          weight: 5,
          target: 70,
          successThreshold: 80,
          warningThreshold: 60,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Поступление в РФМШ/НИШ/БИЛ',
          weight: 2,
          target: 60,
          successThreshold: 75,
          warningThreshold: 50,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Поступление в лицеи/частные школы',
          weight: 1,
          target: 65,
          successThreshold: 75,
          warningThreshold: 55,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Повышение квалификации',
          weight: 1,
          target: 70,
          successThreshold: 80,
          warningThreshold: 60,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Участие в командных мероприятиях',
          weight: 1,
          target: 75,
          successThreshold: 85,
          warningThreshold: 65,
          isActive: true,
          type: 'periodic',
        },
        {
          name: 'Помощь в проектах',
          weight: 0, // Дополнительно к 100%
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
    const metrics: Record<string, number> = {};

    // Получаем все активные метрики из настроек
    for (const metricSetting of settings.metrics) {
      if (!metricSetting.isActive) {
        metrics[this.getMetricKey(metricSetting.name)] = -1; // В разработке
        continue;
      }

      let value: number;

      switch (metricSetting.name) {
        case 'Качество преподавания':
          value = await this.calculateTeachingQuality(teacher);
          break;
        case 'Удовлетворенность студентов':
          value = await this.calculateStudentSatisfaction(teacher);
          break;
        case 'Посещаемость занятий':
          value = await this.calculateAttendanceForTeacher(teacher.id);
          break;
        case 'Выполнение нагрузки':
          value = await this.calculateWorkloadCompliance(teacher);
          break;
        case 'Профессиональное развитие':
          value = await this.calculateProfessionalDevelopment(teacher);
          break;
        default:
          value = -1; // Неизвестная метрика
      }

      metrics[this.getMetricKey(metricSetting.name)] = value;
    }

    return {
      teachingQuality: metrics.teachingQuality || -1,
      studentSatisfaction: metrics.studentSatisfaction || -1,
      classAttendance: metrics.classAttendance || -1,
      workloadCompliance: metrics.workloadCompliance || -1,
      professionalDevelopment: metrics.professionalDevelopment || -1,
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
}
