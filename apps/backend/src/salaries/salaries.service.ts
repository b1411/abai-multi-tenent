import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { SalaryFilterDto } from './dto/salary-filter.dto';
import { Prisma } from '../../generated/prisma';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { PayrollNotificationsService } from '../teachers/payroll-notifications.service';
import { TeacherWorkedHoursService } from '../teachers/teacher-worked-hours.service';

@Injectable()
export class SalariesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: PayrollNotificationsService,
    private teacherWorkedHoursService: TeacherWorkedHoursService,
  ) { }

  async create(createSalaryDto: CreateSalaryDto) {
    const { allowances, bonuses, deductions, hourlyRate, hoursWorked, ...salaryData } = createSalaryDto;

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

    // Вычисляем базовую зарплату
    const baseSalary = Math.round(hourlyRate * hoursWorked);

    // Вычисляем общие суммы
    const totalAllowances = allowances?.reduce((sum, allowance) => {
      if (allowance.isPercentage) {
        return sum + (baseSalary * allowance.amount / 100);
      }
      return sum + allowance.amount;
    }, 0) || 0;

    const totalBonuses = bonuses?.reduce((sum, bonus) => {
      if (bonus.isPercentage) {
        return sum + (baseSalary * bonus.amount / 100);
      }
      return sum + bonus.amount;
    }, 0) || 0;

    const totalDeductions = deductions?.reduce((sum, deduction) => {
      if (deduction.isPercentage) {
        return sum + (baseSalary * deduction.amount / 100);
      }
      return sum + deduction.amount;
    }, 0) || 0;

    const totalGross = baseSalary + totalAllowances + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    return this.prisma.salary.create({
      data: {
        ...salaryData,
        hourlyRate,
        hoursWorked,
        baseSalary,
        totalGross,
        totalNet,
        allowances: allowances ? {
          create: allowances,
        } : undefined,
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
        allowances: true,
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

    const { bonuses, deductions, allowances, hourlyRate, hoursWorked, ...salaryData } = updateSalaryDto;

    // Если меняется учитель, месяц или год, проверяем уникальность
    if (
      updateSalaryDto.teacherId ||
      updateSalaryDto.month ||
      updateSalaryDto.year
    ) {
      const newTeacherId = updateSalaryDto.teacherId || existingSalary.teacherId;
      const month = updateSalaryDto.month || existingSalary.month;
      const year = updateSalaryDto.year || existingSalary.year;

      const conflictingSalary = await this.prisma.salary.findUnique({
        where: {
          teacherId_month_year: {
            teacherId: newTeacherId,
            month,
            year,
          },
        },
      });

      if (conflictingSalary && conflictingSalary.id !== id) {
        throw new BadRequestException('Зарплата за этот период уже существует');
      }
    }

    // Удаляем старые бонусы, удержания и надбавки
    await this.prisma.salaryBonus.deleteMany({
      where: { salaryId: id },
    });

    await this.prisma.salaryDeduction.deleteMany({
      where: { salaryId: id },
    });

    await this.prisma.salaryAllowance.deleteMany({
      where: { salaryId: id },
    });

    // Вычисляем базовую зарплату
    const newHourlyRate = hourlyRate || existingSalary.hourlyRate;
    const newHoursWorked = hoursWorked || existingSalary.hoursWorked;
    const baseSalary = Math.round(newHourlyRate * newHoursWorked);

    // Вычисляем общие суммы
    const totalAllowances = allowances?.reduce((sum, allowance) => {
      if (allowance.isPercentage) {
        return sum + (baseSalary * allowance.amount / 100);
      }
      return sum + allowance.amount;
    }, 0) || 0;

    const totalBonuses = bonuses?.reduce((sum, bonus) => {
      if (bonus.isPercentage) {
        return sum + (baseSalary * bonus.amount / 100);
      }
      return sum + bonus.amount;
    }, 0) || 0;

    const totalDeductions = deductions?.reduce((sum, deduction) => {
      if (deduction.isPercentage) {
        return sum + (baseSalary * deduction.amount / 100);
      }
      return sum + deduction.amount;
    }, 0) || 0;

    const totalGross = baseSalary + totalAllowances + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    return this.prisma.salary.update({
      where: { id },
      data: {
        ...salaryData,
        hourlyRate: newHourlyRate,
        hoursWorked: newHoursWorked,
        baseSalary,
        totalGross,
        totalNet,
        allowances: allowances ? {
          create: allowances,
        } : undefined,
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
        allowances: true,
        bonuses: true,
        deductions: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

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

    const approvedSalary = await this.prisma.salary.update({
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

    // Отправляем уведомление о подтверждении зарплаты
    await this.notificationsService.notifyPayrollApproved(
      approvedSalary.teacherId,
      approvedSalary.month,
      approvedSalary.year
    );

    return approvedSalary;
  }

  async markAsPaid(id: number) {
    const salary = await this.findOne(id);

    if (salary.status !== 'APPROVED') {
      throw new BadRequestException('Можно отметить как выплаченную только утвержденную зарплату');
    }

    const paidSalary = await this.prisma.salary.update({
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

    // Отправляем уведомление о выплате зарплаты
    await this.notificationsService.notifyPayrollPaid(
      paidSalary.teacherId,
      paidSalary.month,
      paidSalary.year
    );

    return paidSalary;
  }

  async editSalaryAdjustments(id: number, adjustments: { bonuses?: any[], deductions?: any[], comment?: string }) {
    const salary = await this.findOne(id);

    if (salary.status === 'PAID') {
      throw new BadRequestException('Нельзя редактировать выплаченную зарплату');
    }

    // Удаляем старые бонусы и удержания
    await this.prisma.salaryBonus.deleteMany({
      where: { salaryId: id },
    });

    await this.prisma.salaryDeduction.deleteMany({
      where: { salaryId: id },
    });

    // Вычисляем новые суммы
    const totalBonuses = adjustments.bonuses?.reduce((sum, bonus) => sum + bonus.amount, 0) || 0;
    const totalDeductions = adjustments.deductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const totalGross = salary.baseSalary + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    return this.prisma.salary.update({
      where: { id },
      data: {
        totalGross,
        totalNet,
        comment: adjustments.comment || salary.comment,
        bonuses: adjustments.bonuses ? {
          create: adjustments.bonuses.map(bonus => ({
            type: 'OTHER',
            name: bonus.name,
            amount: bonus.amount,
            comment: bonus.comment,
          })),
        } : undefined,
        deductions: adjustments.deductions ? {
          create: adjustments.deductions.map(deduction => ({
            name: deduction.name,
            amount: deduction.amount,
            comment: deduction.comment,
          })),
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

  async getPendingApprovals() {
    return this.prisma.salary.findMany({
      where: {
        status: 'DRAFT',
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
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async getApprovedSalaries(filters?: { month?: number; year?: number }) {
    const where: any = {
      status: 'APPROVED',
      deletedAt: null,
    };

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    return this.prisma.salary.findMany({
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
        { approvedAt: 'desc' },
      ],
    });
  }

  async rejectSalary(id: number, rejectedBy: number, reason: string) {
    const salary = await this.findOne(id);

    if (salary.status !== 'DRAFT') {
      throw new BadRequestException('Можно отклонять только черновики зарплат');
    }

    return this.prisma.salary.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        comment: `Отклонено: ${reason}. ${salary.comment || ''}`.trim(),
        updatedAt: new Date(),
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

  async getSalaryWorkflow(id: number) {
    const salary = await this.findOne(id);

    // Получаем информацию о том, кто может подтверждать
    const approvers = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'FINANCIST'] },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
      },
    });

    // Информация о текущем статусе workflow
    const workflow = {
      currentStatus: salary.status,
      canEdit: salary.status === 'DRAFT',
      canApprove: salary.status === 'DRAFT',
      canReject: salary.status === 'DRAFT',
      canMarkAsPaid: salary.status === 'APPROVED',
      approvers,
      timeline: [
        {
          status: 'DRAFT',
          date: salary.createdAt,
          completed: true,
          description: 'Зарплата создана',
        },
        {
          status: 'APPROVED',
          date: salary.approvedAt,
          completed: salary.status === 'APPROVED' || salary.status === 'PAID',
          description: 'Зарплата утверждена',
          approver: salary.approvedBy ? {
            id: salary.approvedBy,
            // Здесь можно добавить информацию о том, кто утвердил
          } : null,
        },
        {
          status: 'PAID',
          date: salary.paidAt,
          completed: salary.status === 'PAID',
          description: 'Зарплата выплачена',
        },
      ],
    };

    return {
      salary,
      workflow,
    };
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

  async exportSalaries(filterDto: SalaryFilterDto, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Buffer> {
    // Получаем все данные без пагинации для экспорта
    const { ...filters } = filterDto;
    delete (filters as any).page;
    delete (filters as any).limit;

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

    const salaries = await this.prisma.salary.findMany({
      where,
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
    });

    // Подготавливаем данные для экспорта
    const exportData = salaries.map(salary => ({
      'ID': salary.id,
      'Преподаватель': `${salary.teacher.user.surname} ${salary.teacher.user.name} ${salary.teacher.user.middlename || ''}`.trim(),
      'Email': salary.teacher.user.email,
      'Период': `${salary.month}/${salary.year}`,
      'Оклад': salary.baseSalary,
      'Бонусы': salary.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
      'Удержания': salary.deductions.reduce((sum, deduction) => sum + deduction.amount, 0),
      'Общая сумма': salary.totalGross,
      'К выплате': salary.totalNet,
      'Статус': salary.status,
      'Дата создания': salary.createdAt.toLocaleDateString('ru-RU'),
      'Дата утверждения': salary.approvedAt?.toLocaleDateString('ru-RU') || '',
      'Дата выплаты': salary.paidAt?.toLocaleDateString('ru-RU') || '',
    }));

    if (format === 'csv') {
      return this.generateCSV(exportData);
    } else if (format === 'pdf') {
      return await this.generatePDF(exportData);
    } else {
      return await this.generateXLSX(exportData);
    }
  }

  async recalculateSalaries(filters?: { month?: number; year?: number }): Promise<{ updated: number }> {
    const where: Prisma.SalaryWhereInput = {
      deletedAt: null,
      status: 'DRAFT', // Пересчитываем только черновики
    };

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    const salaries = await this.prisma.salary.findMany({
      where,
      include: {
        bonuses: true,
        deductions: true,
        teacher: {
          include: {
            salaryRates: {
              where: { isActive: true },
              take: 1,
            },
            workedHours: {
              where: {
                month: filters?.month,
                year: filters?.year,
              },
              take: 1,
            },
          },
        },
      },
    });

    let updatedCount = 0;

    for (const salary of salaries) {
      // Получаем актуальную ставку и отработанные часы
      const currentRate = salary.teacher.salaryRates[0];
      const workedHours = salary.teacher.workedHours[0];

      if (currentRate && workedHours) {
        // Пересчитываем базовую зарплату на основе отработанных часов и ставки
        // Fallback: если фактически отработанных (COMPLETED) часов нет, используем запланированные (scheduledHours)
        const hoursValue = workedHours.workedHours && workedHours.workedHours > 0 ? workedHours.workedHours : workedHours.scheduledHours;
        const newBaseSalary = Math.round(hoursValue * currentRate.totalRate);

        const totalBonuses = salary.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
        const totalDeductions = salary.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
        const totalGross = newBaseSalary + totalBonuses;
        const totalNet = totalGross - totalDeductions;

        // Обновляем если изменились расчеты
        if (salary.baseSalary !== newBaseSalary || salary.totalGross !== totalGross || salary.totalNet !== totalNet) {
          await this.prisma.salary.update({
            where: { id: salary.id },
            data: {
              // сохраняем часы с fallback (worked или scheduled)
              hoursWorked: hoursValue,
              baseSalary: newBaseSalary,
              totalGross,
              totalNet,
            },
          });
          updatedCount++;
        }
      } else {
        // Старый способ расчета, если нет данных о ставке или часах
        const totalBonuses = salary.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
        const totalDeductions = salary.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
        const totalGross = salary.baseSalary + totalBonuses;
        const totalNet = totalGross - totalDeductions;

        if (salary.totalGross !== totalGross || salary.totalNet !== totalNet) {
          await this.prisma.salary.update({
            where: { id: salary.id },
            data: {
              totalGross,
              totalNet,
            },
          });
          updatedCount++;
        }
      }
    }

    return { updated: updatedCount };
  }

  private async generateXLSX(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Зарплаты');

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
          // Экранируем кавычки и переносы строк
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return Buffer.from('\uFEFF' + csvContent, 'utf-8'); // BOM для корректного отображения кириллицы
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
      doc.fontSize(16).text('Отчет по зарплатам', { align: 'center' });
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

  // Генерация зарплат за месяц для всех преподавателей (если отсутствуют)
  async generateSalariesForMonth(month: number, year: number) {
    if (!month || !year) {
      throw new BadRequestException('month и year обязательны');
    }

    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        salaryRates: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        workedHours: {
          where: { month, year },
          take: 1,
        },
      },
    });

    const results: any[] = [];
    let created = 0;
    let skipped = 0;

    for (const teacher of teachers) {
      const rate = teacher.salaryRates[0];
      let hours = teacher.workedHours[0];

      // Авторасчет часов для будущего месяца (если запись отсутствует) на основе расписания
      if (rate && !hours) {
        try {
          hours = await this.teacherWorkedHoursService.calculateAndSaveWorkedHours({
            teacherId: teacher.id,
            month,
            year,
          });
        } catch {
          // игнорируем ошибки авторасчета, перейдем к обычной проверке
        }
      }

      // Проверяем существование зарплаты
      const existing = await this.prisma.salary.findUnique({
        where: {
          teacherId_month_year: {
            teacherId: teacher.id,
            month,
            year,
          },
        },
      });

      if (existing) {
        skipped++;
        results.push({
          teacherId: teacher.id,
          reason: 'exists',
        });
        continue;
      }

      if (!rate || !hours) {
        skipped++;
        results.push({
          teacherId: teacher.id,
          reason: !rate ? 'no_active_rate' : 'no_worked_hours_after_auto_calc',
        });
        continue;
      }

      // Fallback: если нет completed часов, берём scheduledHours (для будущих месяцев)
      const hoursValue = hours.workedHours && hours.workedHours > 0 ? hours.workedHours : hours.scheduledHours;
      const baseSalary = Math.round(hoursValue * rate.totalRate);

      await this.prisma.salary.create({
        data: {
          teacherId: teacher.id,
          month,
          year,
          hourlyRate: rate.totalRate,
          // сохраняем fallback часы (если нет completed берем scheduled)
          hoursWorked: hoursValue,
          baseSalary,
          totalGross: baseSalary,
          totalNet: baseSalary,
          // пустые наборы allowances/bonuses/deductions
        },
      });

      created++;
      results.push({
        teacherId: teacher.id,
        status: 'created',
        baseSalary,
        hoursWorked: hoursValue, // fallback сохранен
        hourlyRate: rate.totalRate,
      });
    }

    return {
      month,
      year,
      created,
      skipped,
      total: teachers.length,
      details: results,
    };
  }

  // Сводка по месяцам за год
  async getMonthlySummary(year: number) {
    if (!year) {
      throw new BadRequestException('year обязателен');
    }

    const grouped = await this.prisma.salary.groupBy({
      by: ['month'],
      where: {
        year,
        deletedAt: null,
      },
      _sum: {
        totalNet: true,
        totalGross: true,
        baseSalary: true,
      },
      _count: {
        id: true,
      },
    });

    const map = new Map<number, any>();
    for (const g of grouped) {
      map.set(g.month, {
        month: g.month,
        totalNet: g._sum.totalNet || 0,
        totalGross: g._sum.totalGross || 0,
        baseSalary: g._sum.baseSalary || 0,
        count: g._count.id,
      });
    }

    // возвращаем 1..12
    const result = [];
    for (let m = 1; m <= 12; m++) {
      if (map.has(m)) {
        result.push(map.get(m));
      } else {
        result.push({
          month: m,
          totalNet: 0,
          totalGross: 0,
          baseSalary: 0,
          count: 0,
        });
      }
    }

    return {
      year,
      months: result,
      totalPayroll: result.reduce((s, r) => s + r.totalNet, 0),
    };
  }
}
