import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { SalaryFilterDto } from './dto/salary-filter.dto';
import { Prisma } from '../../generated/prisma';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

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

  async exportSalaries(filterDto: SalaryFilterDto, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Buffer> {
    // Получаем все данные без пагинации для экспорта
    const { page, limit, ...filters } = filterDto;
    
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
      },
    });

    let updatedCount = 0;

    for (const salary of salaries) {
      const totalBonuses = salary.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      const totalDeductions = salary.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      const totalGross = salary.baseSalary + totalBonuses;
      const totalNet = totalGross - totalDeductions;

      // Обновляем только если изменились расчеты
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
        // Проверяем, помещается ли строка на страницу
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
}
