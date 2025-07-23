import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { SalaryFilterDto } from './dto/salary-filter.dto';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class SalariesService {
  constructor(private prisma: PrismaService) {}

  async create(createSalaryDto: CreateSalaryDto) {
    const { bonuses, deductions, ...salaryData } = createSalaryDto;

    // Проверяем, что учитель существует
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: createSalaryDto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Учитель не найден');
    }

    // Проверяем, что зарплата за этот период не существует
    const existingSalary = await this.prisma.salary.findUnique({
      where: {
        teacherId_month_year: {
          teacherId: createSalaryDto.teacherId,
          month: createSalaryDto.month,
          year: createSalaryDto.year,
        },
      },
    });

    if (existingSalary) {
      throw new BadRequestException('Зарплата за этот период уже существует');
    }

    // Вычисляем общие суммы
    const totalBonuses = bonuses?.reduce((sum, bonus) => sum + bonus.amount, 0) || 0;
    const totalDeductions = deductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const totalGross = salaryData.baseSalary + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    return this.prisma.salary.create({
      data: {
        ...salaryData,
        totalGross,
        totalNet,
        bonuses: bonuses ? {
          create: bonuses,
        } : undefined,
        deductions: deductions ? {
          create: deductions,
        } : undefined,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });
  }

  async findAll(filterDto: SalaryFilterDto) {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.SalaryWhereInput = {};

    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.month) {
      where.month = filters.month;
    }

    if (filters.year) {
      where.year = filters.year;
    }

    where.deletedAt = null;

    const [salaries, total] = await Promise.all([
      this.prisma.salary.findMany({
        where,
        skip,
        take: limit,
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
          bonuses: true,
          deductions: true,
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.salary.count({ where }),
    ]);

    return {
      data: salaries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const salary = await this.prisma.salary.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });

    if (!salary) {
      throw new NotFoundException('Зарплата не найдена');
    }

    return salary;
  }

  async update(id: number, updateSalaryDto: UpdateSalaryDto) {
    const existingSalary = await this.findOne(id);

    const { bonuses, deductions, ...salaryData } = updateSalaryDto;

    // Если меняется учитель, месяц или год, проверяем уникальность
    if (
      updateSalaryDto.teacherId ||
      updateSalaryDto.month ||
      updateSalaryDto.year
    ) {
      const teacherId = updateSalaryDto.teacherId || existingSalary.teacherId;
      const month = updateSalaryDto.month || existingSalary.month;
      const year = updateSalaryDto.year || existingSalary.year;

      const conflictingSalary = await this.prisma.salary.findUnique({
        where: {
          teacherId_month_year: {
            teacherId,
            month,
            year,
          },
        },
      });

      if (conflictingSalary && conflictingSalary.id !== id) {
        throw new BadRequestException('Зарплата за этот период уже существует');
      }
    }

    // Удаляем старые бонусы и удержания
    await this.prisma.salaryBonus.deleteMany({
      where: { salaryId: id },
    });

    await this.prisma.salaryDeduction.deleteMany({
      where: { salaryId: id },
    });

    // Вычисляем новые суммы
    const newBaseSalary = updateSalaryDto.baseSalary || existingSalary.baseSalary;
    const totalBonuses = bonuses?.reduce((sum, bonus) => sum + bonus.amount, 0) || 0;
    const totalDeductions = deductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const totalGross = newBaseSalary + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    return this.prisma.salary.update({
      where: { id },
      data: {
        ...salaryData,
        totalGross,
        totalNet,
        bonuses: bonuses ? {
          create: bonuses,
        } : undefined,
        deductions: deductions ? {
          create: deductions,
        } : undefined,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });
  }

  async remove(id: number) {
    const salary = await this.findOne(id);

    return this.prisma.salary.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async approveSalary(id: number, approvedBy: number) {
    const salary = await this.findOne(id);

    if (salary.status !== 'DRAFT') {
      throw new BadRequestException('Можно утверждать только черновики зарплат');
    }

    return this.prisma.salary.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });
  }

  async markAsPaid(id: number) {
    const salary = await this.findOne(id);

    if (salary.status !== 'APPROVED') {
      throw new BadRequestException('Можно отметить как выплаченную только утвержденную зарплату');
    }

    return this.prisma.salary.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });
  }

  async getSalaryStatistics(year?: number, month?: number) {
    const where: Prisma.SalaryWhereInput = {
      deletedAt: null,
    };

    if (year) {
      where.year = year;
    }

    if (month) {
      where.month = month;
    }

    const [
      totalPayroll,
      avgSalary,
      employeeCount,
      statusStats,
    ] = await Promise.all([
      this.prisma.salary.aggregate({
        where,
        _sum: {
          totalNet: true,
        },
      }),
      this.prisma.salary.aggregate({
        where,
        _avg: {
          totalNet: true,
        },
      }),
      this.prisma.salary.count({ where }),
      this.prisma.salary.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          totalNet: true,
        },
      }),
    ]);

    return {
      totalPayroll: totalPayroll._sum.totalNet || 0,
      avgSalary: Math.round(avgSalary._avg.totalNet || 0),
      employeeCount,
      statusStats: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        total: stat._sum.totalNet || 0,
      })),
    };
  }

  async getSalaryHistory(teacherId: number) {
    // Проверяем, что учитель существует
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Учитель не найден');
    }

    return this.prisma.salary.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      include: {
        teacher: {
          include: {
            user: true,
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
}
