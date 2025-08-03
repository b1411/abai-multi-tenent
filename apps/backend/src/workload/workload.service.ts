import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherWorkedHoursService } from '../teachers/teacher-worked-hours.service';
import { CreateWorkloadDto } from './dto/create-workload.dto';
import { UpdateWorkloadDto } from './dto/update-workload.dto';
import { WorkloadFilterDto } from './dto/workload-filter.dto';
import { PaginateResponseDto } from '../common/dtos/paginate.dto';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class WorkloadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workedHoursService: TeacherWorkedHoursService,
  ) { }

  async create(createWorkloadDto: CreateWorkloadDto) {
    const {
      monthlyHours = [],
      quarterlyHours = [],
      dailyHours = [],
      subjectWorkloads = [],
      additionalActivities = [],
      ...workloadData
    } = createWorkloadDto;

    return await this.prisma.teacherWorkload.create({
      data: {
        ...workloadData,
        monthlyHours: monthlyHours.length > 0 ? {
          create: monthlyHours,
        } : undefined,
        quarterlyHours: quarterlyHours.length > 0 ? {
          create: quarterlyHours,
        } : undefined,
        dailyHours: dailyHours.length > 0 ? {
          create: dailyHours.map(dh => ({
            ...dh,
            date: new Date(dh.date),
          })),
        } : undefined,
        subjectWorkloads: subjectWorkloads.length > 0 ? {
          create: subjectWorkloads,
        } : undefined,
        additionalActivities: additionalActivities.length > 0 ? {
          create: additionalActivities,
        } : undefined,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        monthlyHours: true,
        quarterlyHours: true,
        dailyHours: {
          orderBy: { date: 'desc' },
        },
        subjectWorkloads: {
          include: {
            studyPlan: true,
          },
        },
        additionalActivities: true,
      },
    });
  }

  async findAll(filter: WorkloadFilterDto): Promise<PaginateResponseDto<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      academicYear,
      teacherId,
      period,
      periodValue,
      semester,
      startDate,
      endDate,
      year
    } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.teacher = {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { surname: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    // Приоритет: year > academicYear
    if (year) {
      where.academicYear = `${year}-${year + 1}`;
    } else if (academicYear) {
      where.academicYear = academicYear;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    const [data, totalItems] = await Promise.all([
      this.prisma.teacherWorkload.findMany({
        where,
        skip,
        take: limit,
        include: this.getIncludeOptions(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacherWorkload.count({ where }),
    ]);

    // Обогащаем данные реальными отработанными часами
    const enrichedData = await Promise.all(
      data.map(async (workload) => {
        const currentYear = new Date().getFullYear();
        const workedHoursData = await this.workedHoursService.getWorkedHoursByYear(workload.teacherId, currentYear);

        // Рассчитываем реальные данные из TeacherWorkedHours
        const totalScheduledHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.scheduledHours), 0);
        const totalWorkedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.workedHours), 0);
        const totalSubstitutedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.substitutedHours), 0);

        // Обновляем месячные данные из реальных расчетов
        const realMonthlyHours = workedHoursData.map(wh => ({
          id: wh.id,
          month: wh.month,
          year: wh.year,
          standardHours: Number(wh.scheduledHours),
          actualHours: Number(wh.workedHours),
          createdAt: wh.createdAt.toISOString(),
          updatedAt: wh.updatedAt.toISOString(),
        }));

        // Генерируем квартальные данные
        const realQuarterlyHours = this.generateQuarterlyFromMonthly(realMonthlyHours);

        return {
          ...workload,
          // Обновляем основные поля реальными данными
          standardHours: totalScheduledHours,
          actualHours: totalWorkedHours,
          overtimeHours: totalSubstitutedHours,
          // Заменяем месячные и квартальные данные реальными
          monthlyHours: realMonthlyHours,
          quarterlyHours: realQuarterlyHours,
        };
      })
    );

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: enrichedData,
      meta: {
        totalItems,
        itemCount: enrichedData.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: number) {
    const workload = await this.prisma.teacherWorkload.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    if (!workload) {
      throw new NotFoundException(`Workload with ID ${id} not found`);
    }

    // Обогащаем данные реальными отработанными часами
    const currentYear = new Date().getFullYear();
    const workedHoursData = await this.workedHoursService.getWorkedHoursByYear(workload.teacherId, currentYear);

    const totalScheduledHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.scheduledHours), 0);
    const totalWorkedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.workedHours), 0);
    const totalSubstitutedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.substitutedHours), 0);

    const realMonthlyHours = workedHoursData.map(wh => ({
      id: wh.id,
      month: wh.month,
      year: wh.year,
      standardHours: Number(wh.scheduledHours),
      actualHours: Number(wh.workedHours),
      createdAt: wh.createdAt.toISOString(),
      updatedAt: wh.updatedAt.toISOString(),
    }));

    const realQuarterlyHours = this.generateQuarterlyFromMonthly(realMonthlyHours);

    return {
      ...workload,
      standardHours: totalScheduledHours,
      actualHours: totalWorkedHours,
      overtimeHours: totalSubstitutedHours,
      monthlyHours: realMonthlyHours,
      quarterlyHours: realQuarterlyHours,
    };
  }

  async findByTeacher(teacherId: number, academicYear?: string) {
    const where: any = { teacherId };
    if (academicYear) {
      where.academicYear = academicYear;
    }

    const workloads = await this.prisma.teacherWorkload.findMany({
      where,
      include: this.getIncludeOptions(),
      orderBy: { academicYear: 'desc' },
    });

    // Обогащаем каждую нагрузку реальными данными
    const enrichedWorkloads = await Promise.all(
      workloads.map(async (workload) => {
        const currentYear = new Date().getFullYear();
        const workedHoursData = await this.workedHoursService.getWorkedHoursByYear(workload.teacherId, currentYear);

        const totalScheduledHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.scheduledHours), 0);
        const totalWorkedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.workedHours), 0);
        const totalSubstitutedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.substitutedHours), 0);

        const realMonthlyHours = workedHoursData.map(wh => ({
          id: wh.id,
          month: wh.month,
          year: wh.year,
          standardHours: Number(wh.scheduledHours),
          actualHours: Number(wh.workedHours),
          createdAt: wh.createdAt.toISOString(),
          updatedAt: wh.updatedAt.toISOString(),
        }));

        const realQuarterlyHours = this.generateQuarterlyFromMonthly(realMonthlyHours);

        return {
          ...workload,
          standardHours: totalScheduledHours,
          actualHours: totalWorkedHours,
          overtimeHours: totalSubstitutedHours,
          monthlyHours: realMonthlyHours,
          quarterlyHours: realQuarterlyHours,
        };
      })
    );

    return enrichedWorkloads;
  }

  async update(id: number, updateWorkloadDto: UpdateWorkloadDto) {
    const existingWorkload = await this.findOne(id);

    const {
      monthlyHours,
      quarterlyHours,
      dailyHours,
      subjectWorkloads,
      additionalActivities,
      ...workloadData
    } = updateWorkloadDto;

    // Update main workload data
    const updatedWorkload = await this.prisma.teacherWorkload.update({
      where: { id },
      data: workloadData,
      include: this.getIncludeOptions(),
    });

    // Update related data if provided
    if (monthlyHours) {
      await this.prisma.monthlyWorkload.deleteMany({ where: { teacherWorkloadId: id } });
      await this.prisma.monthlyWorkload.createMany({
        data: monthlyHours.map(mh => ({ ...mh, teacherWorkloadId: id })),
      });
    }

    if (quarterlyHours) {
      await this.prisma.quarterlyWorkload.deleteMany({ where: { teacherWorkloadId: id } });
      await this.prisma.quarterlyWorkload.createMany({
        data: quarterlyHours.map(qh => ({ ...qh, teacherWorkloadId: id })),
      });
    }

    if (dailyHours) {
      await this.prisma.dailyWorkload.deleteMany({ where: { teacherWorkloadId: id } });
      await this.prisma.dailyWorkload.createMany({
        data: dailyHours.map(dh => ({
          ...dh,
          date: new Date(dh.date),
          teacherWorkloadId: id,
        })),
      });
    }

    if (subjectWorkloads) {
      await this.prisma.subjectWorkload.deleteMany({ where: { teacherWorkloadId: id } });
      await this.prisma.subjectWorkload.createMany({
        data: subjectWorkloads.map(sw => ({ ...sw, teacherWorkloadId: id })),
      });
    }

    if (additionalActivities) {
      await this.prisma.additionalActivity.deleteMany({ where: { teacherWorkloadId: id } });
      await this.prisma.additionalActivity.createMany({
        data: additionalActivities.map(aa => ({ ...aa, teacherWorkloadId: id })),
      });
    }

    // Return updated workload with all relations
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists
    return this.prisma.teacherWorkload.delete({
      where: { id },
    });
  }

  async addDailyHours(teacherWorkloadId: number, dailyHoursData: any) {
    const result = await this.prisma.dailyWorkload.create({
      data: {
        ...dailyHoursData,
        date: new Date(dailyHoursData.date),
        teacherWorkloadId,
      },
    });

    // Автоматически пересчитываем нагрузку
    await this.recalculateWorkload(teacherWorkloadId);

    return result;
  }

  // Автоматический пересчет нагрузки на основе данных
  async recalculateWorkload(teacherWorkloadId: number) {
    const workload = await this.prisma.teacherWorkload.findUnique({
      where: { id: teacherWorkloadId },
      include: {
        dailyHours: true,
        subjectWorkloads: true,
        additionalActivities: true,
        monthlyHours: true,
        quarterlyHours: true,
      },
    });

    if (!workload) return;

    // 1. Рассчитываем actualHours из daily + subjects + activities
    const dailyHoursSum = workload.dailyHours
      .filter(dh => dh.type === 'REGULAR' || dh.type === 'OVERTIME')
      .reduce((sum, dh) => sum + dh.hours, 0);

    const subjectHoursSum = workload.subjectWorkloads
      .reduce((sum, sw) => sum + sw.hours, 0);

    const additionalHoursSum = workload.additionalActivities
      .reduce((sum, aa) => sum + aa.hours, 0);

    const calculatedActualHours = dailyHoursSum + subjectHoursSum + additionalHoursSum;

    // 2. Рассчитываем сверхурочные
    const overtimeHours = workload.dailyHours
      .filter(dh => dh.type === 'OVERTIME')
      .reduce((sum, dh) => sum + dh.hours, 0);

    // 3. Рассчитываем дни отпуска и больничного
    const vacationDays = workload.dailyHours
      .filter(dh => dh.type === 'VACATION')
      .reduce((sum, dh) => sum + (dh.hours / 8), 0); // Считаем 8 часов = 1 день

    const sickLeaveDays = workload.dailyHours
      .filter(dh => dh.type === 'SICK')
      .reduce((sum, dh) => sum + (dh.hours / 8), 0);

    // 4. Пересчитываем месячную разбивку
    await this.recalculateMonthlyHours(teacherWorkloadId);

    // 5. Пересчитываем квартальную разбивку
    await this.recalculateQuarterlyHours(teacherWorkloadId);

    // 6. Обновляем основную запись
    await this.prisma.teacherWorkload.update({
      where: { id: teacherWorkloadId },
      data: {
        actualHours: calculatedActualHours,
        overtimeHours: Math.round(overtimeHours),
        vacationDays: Math.round(vacationDays),
        sickLeaveDays: Math.round(sickLeaveDays),
      },
    });
  }

  // Пересчет месячных данных
  private async recalculateMonthlyHours(teacherWorkloadId: number) {
    const dailyHours = await this.prisma.dailyWorkload.findMany({
      where: { teacherWorkloadId },
    });

    const monthlyData = new Map<number, { standard: number; actual: number }>();

    // Инициализируем все месяцы
    for (let month = 1; month <= 12; month++) {
      monthlyData.set(month, { standard: 0, actual: 0 });
    }

    // Группируем daily hours по месяцам
    dailyHours.forEach(dh => {
      const month = new Date(dh.date).getMonth() + 1;
      const current = monthlyData.get(month);

      if (dh.type === 'REGULAR' || dh.type === 'OVERTIME') {
        current.actual += dh.hours;
      }
    });

    // Получаем standardHours и распределяем по месяцам равномерно
    const workload = await this.prisma.teacherWorkload.findUnique({
      where: { id: teacherWorkloadId },
      select: { standardHours: true },
    });

    const monthlyStandardHours = workload ? workload.standardHours / 12 : 0;

    // Удаляем старые данные
    await this.prisma.monthlyWorkload.deleteMany({
      where: { teacherWorkloadId },
    });

    // Создаем новые месячные записи
    const monthlyRecords = Array.from(monthlyData.entries()).map(([month, data]) => ({
      teacherWorkloadId,
      month,
      year: new Date().getFullYear(),
      standardHours: Math.round(monthlyStandardHours),
      actualHours: Math.round(data.actual),
    }));

    await this.prisma.monthlyWorkload.createMany({
      data: monthlyRecords,
    });
  }

  // Пересчет квартальных данных
  private async recalculateQuarterlyHours(teacherWorkloadId: number) {
    const monthlyHours = await this.prisma.monthlyWorkload.findMany({
      where: { teacherWorkloadId },
    });

    const quarterlyData = new Map<number, { standard: number; actual: number }>();

    // Инициализируем кварталы
    for (let quarter = 1; quarter <= 4; quarter++) {
      quarterlyData.set(quarter, { standard: 0, actual: 0 });
    }

    // Группируем по кварталам
    monthlyHours.forEach(mh => {
      const quarter = Math.ceil(mh.month / 3);
      const current = quarterlyData.get(quarter);
      current.standard += mh.standardHours;
      current.actual += mh.actualHours;
    });

    // Удаляем старые данные
    await this.prisma.quarterlyWorkload.deleteMany({
      where: { teacherWorkloadId },
    });

    // Создаем новые квартальные записи
    const quarterlyRecords = Array.from(quarterlyData.entries()).map(([quarter, data]) => ({
      teacherWorkloadId,
      quarter,
      year: new Date().getFullYear(),
      standardHours: Math.round(data.standard),
      actualHours: Math.round(data.actual),
    }));

    await this.prisma.quarterlyWorkload.createMany({
      data: quarterlyRecords,
    });
  }

  // Автоматический расчет нагрузки из расписания используя TeacherWorkedHoursService
  async calculateWorkloadFromSchedule(teacherId: number, academicYear: string) {
    const currentYear = parseInt(academicYear);

    // Получаем реальные данные по отработанным часам за год
    const workedHoursData = await this.workedHoursService.getWorkedHoursByYear(teacherId, currentYear);

    // Получаем расписание преподавателя для расчета предметов
    const schedules = await this.prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: teacherId },
          { substituteId: teacherId },
        ],
        deletedAt: null,
      },
      include: {
        studyPlan: true,
        lesson: true,
      },
    });

    // Группируем по предметам
    const subjectWorkloads = schedules.reduce((acc, schedule) => {
      const subjectName = schedule.studyPlan?.name || schedule.lesson?.name || 'Неизвестный предмет';
      const existing = acc.find(sw => sw.subjectName === subjectName);

      if (existing) {
        existing.hours += 1; // 1 академический час на занятие
      } else {
        acc.push({
          subjectName,
          hours: 1,
          studyPlanId: schedule.studyPlanId,
        });
      }

      return acc;
    }, [] as any[]);

    // Рассчитываем общую нагрузку из реальных данных
    const totalScheduledHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.scheduledHours), 0);
    const totalWorkedHours = workedHoursData.reduce((sum, wh) => sum + Number(wh.workedHours), 0);

    return {
      calculatedStandardHours: totalScheduledHours,
      calculatedActualHours: totalWorkedHours,
      subjectWorkloads,
      monthlyBreakdown: workedHoursData.map(wh => ({
        month: wh.month,
        year: wh.year,
        scheduledHours: Number(wh.scheduledHours),
        workedHours: Number(wh.workedHours),
        substitutedHours: Number(wh.substitutedHours),
      })),
    };
  }

  // Автоматическое создание нагрузки из расписания
  async generateWorkloadFromSchedule(teacherId: number, academicYear: string) {
    const { calculatedStandardHours, subjectWorkloads } = await this.calculateWorkloadFromSchedule(teacherId, academicYear);

    // Проверяем, есть ли уже нагрузка для этого преподавателя и года
    const existingWorkload = await this.prisma.teacherWorkload.findFirst({
      where: {
        teacherId,
        academicYear,
      },
    });

    if (existingWorkload) {
      throw new Error('Workload for this teacher and academic year already exists');
    }

    // Создаем новую нагрузку
    return await this.create({
      teacherId,
      academicYear,
      standardHours: calculatedStandardHours,
      actualHours: 0, // Будет рассчитано автоматически
      subjectWorkloads,
    });
  }

  async getAnalytics(filter: WorkloadFilterDto) {
    const { academicYear, period = 'year', periodValue } = filter;
    const currentYear = academicYear ? parseInt(academicYear.split('-')[0]) : new Date().getFullYear();

    // Получаем всех преподавателей
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
      },
    });

    // Получаем реальные данные по всем преподавателям
    const realStatsPromises = teachers.map(async (teacher) => {
      const workedHoursData = await this.workedHoursService.getWorkedHoursByYear(teacher.id, currentYear);
      return {
        teacherId: teacher.id,
        teacherName: `${teacher.user.name} ${teacher.user.surname}`,
        totalScheduledHours: workedHoursData.reduce((sum, wh) => sum + Number(wh.scheduledHours), 0),
        totalWorkedHours: workedHoursData.reduce((sum, wh) => sum + Number(wh.workedHours), 0),
        totalSubstitutedHours: workedHoursData.reduce((sum, wh) => sum + Number(wh.substitutedHours), 0),
        monthlyData: workedHoursData,
      };
    });

    const realStats = await Promise.all(realStatsPromises);

    // Calculate summary statistics from real data
    const summary = {
      totalTeachers: realStats.length,
      totalStandardHours: realStats.reduce((sum, stats) => sum + stats.totalScheduledHours, 0),
      totalActualHours: realStats.reduce((sum, stats) => sum + stats.totalWorkedHours, 0),
      averageLoad: 0,
      overloaded: 0,
      underloaded: 0,
    };

    summary.averageLoad = summary.totalStandardHours / summary.totalTeachers || 0;
    summary.overloaded = realStats.filter(stats => stats.totalWorkedHours > stats.totalScheduledHours).length;
    summary.underloaded = realStats.filter(stats => stats.totalWorkedHours < stats.totalScheduledHours).length;

    // Получаем распределение по предметам напрямую из расписания
    const schedules = await this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
        },
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    // Получаем учебные планы отдельно
    const studyPlans = await this.prisma.studyPlan.findMany({
      where: { deletedAt: null },
    });

    const studyPlanMap = new Map(studyPlans.map(sp => [sp.id, sp]));

    // Группируем расписание по предметам
    const subjectMap = new Map<string, { hours: number; teacherIds: Set<number> }>();

    schedules.forEach(schedule => {
      const studyPlan = studyPlanMap.get(schedule.studyPlanId);
      const subjectName = studyPlan?.name || 'Неизвестный предмет';
      const teacherId = schedule.teacherId;

      if (subjectMap.has(subjectName)) {
        const existing = subjectMap.get(subjectName);
        existing.hours += 1; // 1 академический час за занятие
        existing.teacherIds.add(teacherId);
      } else {
        subjectMap.set(subjectName, {
          hours: 1,
          teacherIds: new Set([teacherId])
        });
      }
    });

    const subjectDistribution = Array.from(subjectMap.entries())
      .map(([name, data]) => ({
        name,
        hours: data.hours,
        teachers: data.teacherIds.size,
      }))
      .sort((a, b) => b.hours - a.hours); // Сортируем по убыванию часов

    console.log('[WorkloadService] Subject distribution:', subjectDistribution);

    // Calculate trends based on period from real data
    let trends: any[] = [];
    if (period === 'month') {
      trends = realStats
        .flatMap(stats => stats.monthlyData)
        .reduce((acc, mh) => {
          const existing = acc.find(item => item.period === mh.month);
          if (existing) {
            existing.standardHours += Number(mh.scheduledHours);
            existing.actualHours += Number(mh.workedHours);
          } else {
            acc.push({
              period: mh.month,
              standardHours: Number(mh.scheduledHours),
              actualHours: Number(mh.workedHours),
            });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => a.period - b.period);
    } else if (period === 'quarter') {
      // Группируем месячные данные по кварталам
      const monthlyTrends = realStats
        .flatMap(stats => stats.monthlyData)
        .reduce((acc, mh) => {
          const quarter = Math.ceil(mh.month / 3);
          const existing = acc.find(item => item.period === quarter);
          if (existing) {
            existing.standardHours += Number(mh.scheduledHours);
            existing.actualHours += Number(mh.workedHours);
          } else {
            acc.push({
              period: quarter,
              standardHours: Number(mh.scheduledHours),
              actualHours: Number(mh.workedHours),
            });
          }
          return acc;
        }, [] as any[]);

      trends = monthlyTrends.sort((a, b) => a.period - b.period);
    }

    return {
      summary,
      subjectDistribution,
      trends,
    };
  }

  async exportWorkloads(filter: WorkloadFilterDto, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Buffer> {
    // Получаем данные без пагинации
    const { page, limit, ...filters } = filter;

    const where: any = {};

    if (filters.search) {
      where.teacher = {
        user: {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { surname: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (filters.academicYear) {
      where.academicYear = filters.academicYear;
    }

    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    const workloads = await this.prisma.teacherWorkload.findMany({
      where,
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'desc' },
    });

    // Подготавливаем данные для экспорта
    const exportData = workloads.map(workload => ({
      'ID': workload.id,
      'Преподаватель': `${workload.teacher.user.surname} ${workload.teacher.user.name} ${workload.teacher.user.middlename || ''}`.trim(),
      'Email': workload.teacher.user.email,
      'Учебный год': workload.academicYear,
      'Нормативная нагрузка': workload.standardHours,
      'Фактическая нагрузка': workload.actualHours,
      'Сверхурочные часы': workload.overtimeHours,
      'Дни отпуска': workload.vacationDays,
      'Дни больничного': workload.sickLeaveDays,
      'Предметы': workload.subjectWorkloads.map(sw => sw.subjectName).join(', '),
      'Дополнительные активности': workload.additionalActivities.map(aa => aa.name).join(', '),
      'Дата создания': workload.createdAt.toLocaleDateString('ru-RU'),
    }));

    if (format === 'csv') {
      return this.generateCSV(exportData);
    } else if (format === 'pdf') {
      return await this.generatePDF(exportData);
    } else {
      return await this.generateXLSX(exportData);
    }
  }

  async downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<Buffer> {
    // Создаем шаблон с заголовками и примером данных
    const templateData = [
      {
        'ID преподавателя': '1',
        'Учебный год': '2024-2025',
        'Нормативная нагрузка': '720',
        'Предмет 1': 'Математика',
        'Часы предмета 1': '120',
        'Предмет 2': 'Алгебра',
        'Часы предмета 2': '100',
        'Дополнительная активность 1': 'Классное руководство',
        'Часы активности 1': '50',
        'Комментарий': 'Пример записи',
      }
    ];

    if (format === 'csv') {
      return Promise.resolve(this.generateCSV(templateData));
    } else {
      return Promise.resolve(this.generateXLSX(templateData));
    }
  }

  async exportTeacherWorkload(teacherId: number, academicYear?: string, format: 'xlsx' | 'pdf' = 'xlsx'): Promise<Buffer> {
    const where: any = { teacherId };
    if (academicYear) {
      where.academicYear = academicYear;
    }

    const workloads = await this.prisma.teacherWorkload.findMany({
      where,
      include: this.getIncludeOptions(),
      orderBy: { academicYear: 'desc' },
    });

    if (workloads.length === 0) {
      throw new NotFoundException('Нагрузка преподавателя не найдена');
    }

    const teacher = workloads[0].teacher;

    // Подготавливаем детальные данные
    const exportData = workloads.flatMap(workload => [
      // Основная информация
      {
        'Тип': 'Основная информация',
        'Преподаватель': `${teacher.user.surname} ${teacher.user.name} ${teacher.user.middlename || ''}`.trim(),
        'Email': teacher.user.email,
        'Учебный год': workload.academicYear,
        'Нормативная нагрузка': workload.standardHours,
        'Фактическая нагрузка': workload.actualHours,
        'Отклонение': workload.actualHours - workload.standardHours,
      },
      // Предметы
      ...workload.subjectWorkloads.map(subject => ({
        'Тип': 'Предмет',
        'Название': subject.subjectName,
        'Часы': subject.hours,
        'Учебный план': subject.studyPlan?.name || '',
        'Описание': subject.studyPlan?.description || '',
      })),
      // Дополнительные активности
      ...workload.additionalActivities.map(activity => ({
        'Тип': 'Дополнительная активность',
        'Название': activity.name,
        'Часы': activity.hours,
        'Описание': activity.description || '',
      })),
    ]);

    if (format === 'pdf') {
      return this.generatePDF(exportData);
    } else {
      return this.generateXLSX(exportData);
    }
  }

  private async generateXLSX(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Нагрузки');

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
      fgColor: { argb: 'FFE0E0E0' },
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
      doc.fontSize(16).text('Отчет по нагрузкам преподавателей', { align: 'center' });
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
      const rowHeight = 20;
      const colWidth = (doc.page.width - 100) / headers.length;

      // Рисуем заголовки
      doc.fontSize(10);
      headers.forEach((header, index) => {
        const x = startX + (index * colWidth);
        doc.rect(x, currentY, colWidth, rowHeight).stroke();
        doc.text(header, x + 2, currentY + 5, {
          width: colWidth - 4,
          height: rowHeight - 10,
          ellipsis: true
        });
      });

      currentY += rowHeight;

      // Рисуем данные
      data.forEach((row) => {
        if (currentY + rowHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }

        headers.forEach((header, index) => {
          const x = startX + (index * colWidth);
          const value = String(row[header] || '');

          doc.rect(x, currentY, colWidth, rowHeight).stroke();
          doc.text(value, x + 2, currentY + 5, {
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

  // Генерация квартальных данных из месячных
  private generateQuarterlyFromMonthly(monthlyHours: any[]): any[] {
    const quarterlyData = new Map<number, { standardHours: number; actualHours: number; year: number }>();

    monthlyHours.forEach(mh => {
      const quarter = Math.ceil(mh.month / 3);
      const existing = quarterlyData.get(quarter);

      if (existing) {
        existing.standardHours += mh.standardHours;
        existing.actualHours += mh.actualHours;
      } else {
        quarterlyData.set(quarter, {
          standardHours: mh.standardHours,
          actualHours: mh.actualHours,
          year: mh.year,
        });
      }
    });

    return Array.from(quarterlyData.entries()).map(([quarter, data]) => ({
      id: quarter,
      quarter,
      year: data.year,
      standardHours: data.standardHours,
      actualHours: data.actualHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  // Новые методы для интеграции с TeacherWorkedHoursService

  async recalculateAllWorkedHours(year: number, month: number) {
    console.log(`[WorkloadService] Пересчет отработанных часов для всех преподавателей за ${month}/${year}`);

    // Используем TeacherWorkedHoursService для пересчета всех преподавателей
    const result = await this.workedHoursService.recalculateAllForMonth(month, year);

    // Обновляем соответствующие workload записи
    const workloads = await this.prisma.teacherWorkload.findMany({
      where: {
        academicYear: year.toString(),
      },
    });

    let updatedCount = 0;
    for (const workload of workloads) {
      try {
        const workedHoursData = await this.workedHoursService.getWorkedHours(workload.teacherId, month, year);
        if (workedHoursData) {
          // Обновляем данные в workload на основе реальных расчетов
          await this.prisma.teacherWorkload.update({
            where: { id: workload.id },
            data: {
              actualHours: Number(workedHoursData.workedHours),
              overtimeHours: Number(workedHoursData.substitutedHours),
            },
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Ошибка обновления workload для преподавателя ${workload.teacherId}:`, error);
      }
    }

    return {
      message: 'Пересчет завершен',
      teachersProcessed: result.processed,
      workloadsUpdated: updatedCount,
      totalWorkloads: workloads.length,
    };
  }

  async syncTeacherWorkedHours(teacherId: number, year: number, month: number) {
    console.log(`[WorkloadService] Синхронизация часов преподавателя ${teacherId} за ${month}/${year}`);

    // Пересчитываем часы через TeacherWorkedHoursService
    const workedHoursResult = await this.workedHoursService.calculateAndSaveWorkedHours({
      teacherId,
      month,
      year,
    });

    // Находим соответствующую workload запись
    const workload = await this.prisma.teacherWorkload.findFirst({
      where: {
        teacherId,
        academicYear: year.toString(),
      },
    });

    if (workload) {
      // Получаем все месячные данные для этого года
      const yearlyData = await this.workedHoursService.getWorkedHoursByYear(teacherId, year);

      const totalScheduledHours = yearlyData.reduce((sum, wh) => sum + Number(wh.scheduledHours), 0);
      const totalWorkedHours = yearlyData.reduce((sum, wh) => sum + Number(wh.workedHours), 0);
      const totalSubstitutedHours = yearlyData.reduce((sum, wh) => sum + Number(wh.substitutedHours), 0);

      // Обновляем workload
      const updatedWorkload = await this.prisma.teacherWorkload.update({
        where: { id: workload.id },
        data: {
          standardHours: totalScheduledHours,
          actualHours: totalWorkedHours,
          overtimeHours: totalSubstitutedHours,
        },
        include: this.getIncludeOptions(),
      });

      return {
        message: 'Синхронизация завершена',
        workedHoursResult,
        updatedWorkload,
      };
    } else {
      return {
        message: 'Workload запись не найдена, создайте её сначала',
        workedHoursResult,
      };
    }
  }

  async getRealTimeStats(filter: WorkloadFilterDto) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Получаем всех активных преподавателей
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, name: true, surname: true } },
      },
    });

    // Получаем реальные данные по отработанным часам за текущий месяц
    const realTimeData = await Promise.all(
      teachers.map(async (teacher) => {
        try {
          const workedHours = await this.workedHoursService.getWorkedHours(teacher.id, currentMonth, currentYear);
          const workedHoursDetails = await this.workedHoursService.getTeacherWorkedHoursDetails(teacher.id, currentMonth, currentYear);

          return {
            teacherId: teacher.id,
            teacherName: `${teacher.user.name} ${teacher.user.surname}`,
            currentMonth: {
              scheduledHours: workedHours ? Number(workedHours.scheduledHours) : 0,
              workedHours: workedHours ? Number(workedHours.workedHours) : 0,
              substitutedHours: workedHours ? Number(workedHours.substitutedHours) : 0,
              substitutedByOthers: workedHours ? Number(workedHours.substitutedByOthers) : 0,
            },
            statistics: workedHoursDetails?.statistics || {
              totalSchedules: 0,
              completedSchedules: 0,
              cancelledSchedules: 0,
              rescheduledSchedules: 0,
              substitutionSchedules: 0,
            },
            lastUpdated: workedHours?.updatedAt || null,
          };
        } catch (error) {
          console.error(`Ошибка получения данных для преподавателя ${teacher.id}:`, error);
          return {
            teacherId: teacher.id,
            teacherName: `${teacher.user.name} ${teacher.user.surname}`,
            currentMonth: {
              scheduledHours: 0,
              workedHours: 0,
              substitutedHours: 0,
              substitutedByOthers: 0,
            },
            statistics: {
              totalSchedules: 0,
              completedSchedules: 0,
              cancelledSchedules: 0,
              rescheduledSchedules: 0,
              substitutionSchedules: 0,
            },
            lastUpdated: null,
            error: error.message,
          };
        }
      })
    );

    // Вычисляем общую статистику
    const totalStats = realTimeData.reduce(
      (acc, teacher) => {
        acc.totalScheduledHours += teacher.currentMonth.scheduledHours;
        acc.totalWorkedHours += teacher.currentMonth.workedHours;
        acc.totalSubstitutedHours += teacher.currentMonth.substitutedHours;
        acc.totalSchedules += teacher.statistics.totalSchedules;
        acc.totalCompletedSchedules += teacher.statistics.completedSchedules;
        return acc;
      },
      {
        totalScheduledHours: 0,
        totalWorkedHours: 0,
        totalSubstitutedHours: 0,
        totalSchedules: 0,
        totalCompletedSchedules: 0,
      }
    );

    return {
      period: {
        month: currentMonth,
        year: currentYear,
        monthName: new Date(currentYear, currentMonth - 1).toLocaleString('ru-RU', { month: 'long' }),
      },
      summary: {
        totalTeachers: teachers.length,
        activeTeachers: realTimeData.filter(t => t.currentMonth.scheduledHours > 0).length,
        ...totalStats,
        completionRate: totalStats.totalSchedules > 0
          ? ((totalStats.totalCompletedSchedules / totalStats.totalSchedules) * 100).toFixed(1)
          : '0',
        workloadEfficiency: totalStats.totalScheduledHours > 0
          ? ((totalStats.totalWorkedHours / totalStats.totalScheduledHours) * 100).toFixed(1)
          : '0',
      },
      teachers: realTimeData,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Методы для интеграции с фронтендом (делегируем в TeacherWorkedHoursService)
  async getAllTeachersWorkedHours(month: number, year: number) {
    return this.workedHoursService.getAllTeachersWorkedHours(month, year);
  }

  async getTeacherWorkedHoursDetails(teacherId: number, month: number, year: number) {
    return this.workedHoursService.getTeacherWorkedHoursDetails(teacherId, month, year);
  }

  private getIncludeOptions() {
    return {
      teacher: {
        include: {
          user: true,
        },
      },
      monthlyHours: true,
      quarterlyHours: true,
      dailyHours: {
        orderBy: { date: 'desc' as const },
      },
      subjectWorkloads: {
        include: {
          studyPlan: true,
        },
      },
      additionalActivities: true,
    };
  }
}
