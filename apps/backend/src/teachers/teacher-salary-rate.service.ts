import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherSalaryRateDto } from './dto/create-teacher-salary-rate.dto';
import { UpdateTeacherSalaryRateDto } from './dto/update-teacher-salary-rate.dto';

@Injectable()
export class TeacherSalaryRateService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTeacherSalaryRateDto) {
    // Проверяем существование преподавателя
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: createDto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Преподаватель не найден');
    }

    // Деактивируем старые ставки
    await this.prisma.teacherSalaryRate.updateMany({
      where: { 
        teacherId: createDto.teacherId,
        isActive: true 
      },
      data: { isActive: false },
    });

    // Вычисляем итоговую ставку
    const factorsTotal = createDto.factors?.reduce((sum, factor) => sum + factor.amount, 0) || 0;
    const totalRate = createDto.baseRate + factorsTotal;

    return this.prisma.teacherSalaryRate.create({
      data: {
        teacherId: createDto.teacherId,
        baseRate: createDto.baseRate,
        factors: (createDto.factors || []) as any,
        totalRate,
        isActive: true,
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
      },
    });
  }

  async findByTeacher(teacherId: number) {
    return await this.prisma.teacherSalaryRate.findFirst({
      where: { 
        teacherId,
        isActive: true,
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
      },
    });
  }

  async findHistoryByTeacher(teacherId: number) {
    return await this.prisma.teacherSalaryRate.findMany({
      where: { 
        teacherId,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: number, updateDto: UpdateTeacherSalaryRateDto) {
    const existingRate = await this.prisma.teacherSalaryRate.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
    });

    if (!existingRate) {
      throw new NotFoundException('Ставка не найдена');
    }

    if (!existingRate.isActive) {
      throw new BadRequestException('Нельзя редактировать неактивную ставку');
    }

    // Вычисляем новую итоговую ставку
    const newBaseRate = updateDto.baseRate ?? existingRate.baseRate;
    const newFactors = updateDto.factors ?? (existingRate.factors as any[]);
    const factorsTotal = newFactors.reduce((sum, factor) => sum + factor.amount, 0);
    const totalRate = newBaseRate + factorsTotal;

    return this.prisma.teacherSalaryRate.update({
      where: { id },
      data: {
        baseRate: newBaseRate,
        factors: newFactors,
        totalRate,
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
      },
    });
  }

  async remove(id: number) {
    const rate = await this.prisma.teacherSalaryRate.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
    });

    if (!rate) {
      throw new NotFoundException('Ставка не найдена');
    }

    return this.prisma.teacherSalaryRate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAllRates() {
    return await this.prisma.teacherSalaryRate.findMany({
      where: { 
        isActive: true,
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
      },
      orderBy: [
        { teacher: { user: { surname: 'asc' } } },
        { teacher: { user: { name: 'asc' } } },
      ],
    });
  }

  async getTeacherCurrentRate(teacherId: number): Promise<number> {
    const rate = await this.findByTeacher(teacherId);
    return rate?.totalRate || 0;
  }
}
