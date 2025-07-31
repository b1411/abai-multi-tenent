import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherSalaryRateService } from './teacher-salary-rate.service';
import { TeacherWorkedHoursService } from './teacher-worked-hours.service';
import { PayrollNotificationsService } from './payroll-notifications.service';

interface PayrollCalculationParams {
  teacherId?: number;
  month: number;
  year: number;
}

@Injectable()
export class PayrollCalculationService {
  constructor(
    private prisma: PrismaService,
    private salaryRateService: TeacherSalaryRateService,
    private workedHoursService: TeacherWorkedHoursService,
    private notificationsService: PayrollNotificationsService,
  ) {}

  async calculateSalaryForTeacher(teacherId: number, month: number, year: number) {
    // Получаем ставку преподавателя
    const rate = await this.salaryRateService.findByTeacher(teacherId);
    if (!rate) {
      throw new NotFoundException(`Ставка для преподавателя ${teacherId} не найдена`);
    }

    // Рассчитываем отработанные часы
    const workedHours = await this.workedHoursService.calculateAndSaveWorkedHours({
      teacherId,
      month,
      year,
    });

    // Базовая зарплата = отработанные часы * почасовая ставка
    const baseSalary = Math.round(workedHours.workedHours * rate.totalRate);

    // Проверяем, существует ли уже зарплата за этот период
    const existingSalary = await this.prisma.salary.findUnique({
      where: {
        teacherId_month_year: {
          teacherId,
          month,
          year,
        },
      },
    });

    if (existingSalary) {
      // Обновляем существующую зарплату
      return await this.prisma.salary.update({
        where: { id: existingSalary.id },
        data: {
          baseSalary,
          totalGross: baseSalary, // будет пересчитано при добавлении бонусов/удержаний
          totalNet: baseSalary,
          updatedAt: new Date(),
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true,
                },
              },
            },
          },
          bonuses: true,
          deductions: true,
        },
      });
    } else {
      // Создаем новую запись зарплаты
      const newSalary = await this.prisma.salary.create({
        data: {
          teacherId,
          month,
          year,
          baseSalary,
          totalGross: baseSalary,
          totalNet: baseSalary,
          status: 'DRAFT',
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true,
                },
              },
            },
          },
          bonuses: true,
          deductions: true,
        },
      });

      // Отправляем уведомление о расчете зарплаты
      await this.notificationsService.notifyPayrollCalculated(teacherId, month, year);

      return newSalary;
    }
  }

  async recalculatePayroll(params: PayrollCalculationParams) {
    const { teacherId, month, year } = params;

    if (teacherId) {
      // Пересчитываем для одного преподавателя
      return [await this.calculateSalaryForTeacher(teacherId, month, year)];
    } else {
      // Пересчитываем для всех преподавателей
      const teachers = await this.prisma.teacher.findMany({
        where: { deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
      });

      const results = [];
      const errors = [];

      for (const teacher of teachers) {
        try {
          const salary = await this.calculateSalaryForTeacher(teacher.id, month, year);
          results.push(salary);
        } catch (error) {
          console.error(`Ошибка при расчете зарплаты для преподавателя ${teacher.id}:`, error);
          errors.push({
            teacherId: teacher.id,
            teacherName: `${teacher.user.surname} ${teacher.user.name}`,
            error: error.message,
          });
        }
      }

      // Отправляем уведомление о завершении массового расчета
      await this.notificationsService.notifyBulkPayrollCalculated(month, year, {
        successful: results.length,
        failed: errors.length,
      });

      // Уведомляем финансистов о новых зарплатах для подтверждения
      if (results.length > 0) {
        await this.notificationsService.notifyFinancistsAboutPendingApprovals();
      }

      return {
        successful: results,
        errors,
        summary: {
          total: teachers.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    }
  }

  async getPayrollSummary(month: number, year: number) {
    const salaries = await this.prisma.salary.findMany({
      where: {
        month,
        year,
        deletedAt: null,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        bonuses: true,
        deductions: true,
      },
      orderBy: [
        { teacher: { user: { surname: 'asc' } } },
        { teacher: { user: { name: 'asc' } } },
      ],
    });

    const summary = {
      totalEmployees: salaries.length,
      totalBaseSalary: salaries.reduce((sum, s) => sum + s.baseSalary, 0),
      totalBonuses: salaries.reduce((sum, s) => 
        sum + s.bonuses.reduce((bonusSum, b) => bonusSum + b.amount, 0), 0),
      totalDeductions: salaries.reduce((sum, s) => 
        sum + s.deductions.reduce((deductionSum, d) => deductionSum + d.amount, 0), 0),
      totalGross: salaries.reduce((sum, s) => sum + s.totalGross, 0),
      totalNet: salaries.reduce((sum, s) => sum + s.totalNet, 0),
      statusBreakdown: {
        draft: salaries.filter(s => s.status === 'DRAFT').length,
        approved: salaries.filter(s => s.status === 'APPROVED').length,
        paid: salaries.filter(s => s.status === 'PAID').length,
        cancelled: salaries.filter(s => s.status === 'CANCELLED').length,
      },
    };

    return {
      salaries,
      summary,
    };
  }

  async getTeacherPayrollHistory(teacherId: number, year?: number) {
    const where: any = {
      teacherId,
      deletedAt: null,
    };

    if (year) {
      where.year = year;
    }

    return await this.prisma.salary.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        bonuses: true,
        deductions: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }

  async getPayrollDetails(teacherId: number, month: number, year: number) {
    const salary = await this.prisma.salary.findUnique({
      where: {
        teacherId_month_year: {
          teacherId,
          month,
          year,
        },
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        bonuses: true,
        deductions: true,
      },
    });

    if (!salary) {
      throw new NotFoundException('Зарплата не найдена');
    }

    // Получаем дополнительную информацию
    const workedHours = await this.workedHoursService.getWorkedHours(teacherId, month, year);
    const salaryRate = await this.salaryRateService.findByTeacher(teacherId);

    return {
      salary,
      workedHours,
      salaryRate,
      calculation: {
        hourlyRate: salaryRate?.totalRate || 0,
        workedHours: workedHours?.workedHours || 0,
        baseSalaryCalculation: (workedHours?.workedHours || 0) * (salaryRate?.totalRate || 0),
      },
    };
  }
}
