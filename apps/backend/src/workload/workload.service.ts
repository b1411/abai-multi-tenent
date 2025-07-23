import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkloadDto } from './dto/create-workload.dto';
import { UpdateWorkloadDto } from './dto/update-workload.dto';
import { WorkloadFilterDto } from './dto/workload-filter.dto';
import { PaginateResponseDto } from '../common/dtos/paginate.dto';

@Injectable()
export class WorkloadService {
  constructor(private readonly prisma: PrismaService) { }

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
        monthlyHours: {
          create: monthlyHours,
        },
        quarterlyHours: {
          create: quarterlyHours,
        },
        dailyHours: {
          create: dailyHours.map(dh => ({
            ...dh,
            date: new Date(dh.date),
          })),
        },
        subjectWorkloads: {
          create: subjectWorkloads,
        },
        additionalActivities: {
          create: additionalActivities,
        },
      },
      include: this.getIncludeOptions(),
    });
  }

  async findAll(filter: WorkloadFilterDto): Promise<PaginateResponseDto<any>> {
    const { page = 1, limit = 10, search, academicYear, teacherId, period, periodValue } = filter;
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

    if (academicYear) {
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

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
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

    return workload;
  }

  async findByTeacher(teacherId: number, academicYear?: string) {
    const where: any = { teacherId };
    if (academicYear) {
      where.academicYear = academicYear;
    }

    return await this.prisma.teacherWorkload.findMany({
      where,
      include: this.getIncludeOptions(),
      orderBy: { academicYear: 'desc' },
    });
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

  // Автоматический расчет нагрузки из расписания
  async calculateWorkloadFromSchedule(teacherId: number, academicYear: string) {
    // Получаем все уроки преподавателя из расписания
    // Поскольку в модели Lesson нет teacherId, получаем уроки по studyPlan
    const lessons = await this.prisma.lesson.findMany({
      where: {
        // Фильтр по академическому году можно добавить через дату
        date: {
          gte: new Date(`${academicYear}-01-01`),
          lt: new Date(`${parseInt(academicYear) + 1}-01-01`),
        },
      },
      include: {
        studyPlan: true,
      },
    });

    // Группируем по предметам
    const subjectWorkloads = lessons.reduce((acc, lesson) => {
      const subjectName = lesson.studyPlan?.name || lesson.name;
      const existing = acc.find(sw => sw.subjectName === subjectName);

      if (existing) {
        existing.hours += 1; // по умолчанию 1 час на урок
      } else {
        acc.push({
          subjectName,
          hours: 1,
          studyPlanId: lesson.studyPlanId,
        });
      }

      return acc;
    }, [] as any[]);

    // Рассчитываем общую нагрузку
    const totalHoursFromSchedule = subjectWorkloads.reduce((sum, sw) => sum + sw.hours, 0);

    return {
      calculatedStandardHours: totalHoursFromSchedule,
      subjectWorkloads,
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

    const where: any = {};
    if (academicYear) {
      where.academicYear = academicYear;
    }

    const workloads = await this.prisma.teacherWorkload.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        subjectWorkloads: {
          include: {
            studyPlan: true,
          },
        },
        monthlyHours: true,
        quarterlyHours: true,
      },
    });

    // Calculate summary statistics
    const summary = {
      totalTeachers: workloads.length,
      totalStandardHours: workloads.reduce((sum, w) => sum + w.standardHours, 0),
      totalActualHours: workloads.reduce((sum, w) => sum + w.actualHours, 0),
      averageLoad: 0,
      overloaded: 0,
      underloaded: 0,
    };

    summary.averageLoad = summary.totalStandardHours / summary.totalTeachers || 0;
    summary.overloaded = workloads.filter(w => w.actualHours > w.standardHours).length;
    summary.underloaded = workloads.filter(w => w.actualHours < w.standardHours).length;

    // Calculate subject distribution
    const subjectDistribution = workloads
      .flatMap(w => w.subjectWorkloads)
      .reduce((acc, sw) => {
        const existing = acc.find(item => item.name === sw.subjectName);
        if (existing) {
          existing.hours += sw.hours;
          existing.teachers += 1;
        } else {
          acc.push({
            name: sw.subjectName,
            hours: sw.hours,
            teachers: 1,
          });
        }
        return acc;
      }, [] as any[]);

    // Calculate trends based on period
    let trends: any[] = [];
    if (period === 'month') {
      trends = workloads
        .flatMap(w => w.monthlyHours)
        .reduce((acc, mh) => {
          const existing = acc.find(item => item.period === mh.month);
          if (existing) {
            existing.standardHours += mh.standardHours;
            existing.actualHours += mh.actualHours;
          } else {
            acc.push({
              period: mh.month,
              standardHours: mh.standardHours,
              actualHours: mh.actualHours,
            });
          }
          return acc;
        }, [] as any[]);
    } else if (period === 'quarter') {
      trends = workloads
        .flatMap(w => w.quarterlyHours)
        .reduce((acc, qh) => {
          const existing = acc.find(item => item.period === qh.quarter);
          if (existing) {
            existing.standardHours += qh.standardHours;
            existing.actualHours += qh.actualHours;
          } else {
            acc.push({
              period: qh.quarter,
              standardHours: qh.standardHours,
              actualHours: qh.actualHours,
            });
          }
          return acc;
        }, [] as any[]);
    }

    return {
      summary,
      subjectDistribution,
      trends,
    };
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
