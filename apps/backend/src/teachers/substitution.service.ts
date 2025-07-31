import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateSubstitutionDto {
  scheduleId: string;
  substituteTeacherId: number;
  reason: string;
}

interface AvailableTeacherFilters {
  date: Date;
  startTime: string;
  endTime: string;
  excludeTeacherId?: number;
}

@Injectable()
export class SubstitutionService {
  constructor(private prisma: PrismaService) {}

  async createSubstitution(dto: CreateSubstitutionDto) {
    const { scheduleId, substituteTeacherId, reason } = dto;

    // Проверяем существование расписания
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        group: true,
        studyPlan: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Расписание не найдено');
    }

    if (schedule.substituteId) {
      throw new BadRequestException('У этого занятия уже есть замещающий');
    }

    // Проверяем существование замещающего преподавателя
    const substitute = await this.prisma.teacher.findUnique({
      where: { id: substituteTeacherId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!substitute) {
      throw new NotFoundException('Замещающий преподаватель не найден');
    }

    // Проверяем, что замещающий не занят в это время
    const conflict = await this.checkTeacherAvailability({
      teacherId: substituteTeacherId,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });

    if (!conflict.isAvailable) {
      throw new BadRequestException(`Замещающий преподаватель занят в это время: ${conflict.reason}`);
    }

    // Назначаем замещение
    const updatedSchedule = await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        substituteId: substituteTeacherId,
        substituteReason: reason,
        type: 'SUBSTITUTE',
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        substitute: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        group: true,
        studyPlan: true,
        classroom: true,
      },
    });

    return updatedSchedule;
  }

  async removeSubstitution(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Расписание не найдено');
    }

    if (!schedule.substituteId) {
      throw new BadRequestException('У этого занятия нет замещающего');
    }

    return await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        substituteId: null,
        substituteReason: null,
        type: 'REGULAR',
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        group: true,
        studyPlan: true,
        classroom: true,
      },
    });
  }

  async getAvailableTeachers(filters: AvailableTeacherFilters) {
    const { date, startTime, endTime, excludeTeacherId } = filters;

    // Получаем всех преподавателей
    const allTeachers = await this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        ...(excludeTeacherId && { id: { not: excludeTeacherId } }),
      },
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

    // Проверяем доступность каждого преподавателя
    const availableTeachers = [];

    for (const teacher of allTeachers) {
      const availability = await this.checkTeacherAvailability({
        teacherId: teacher.id,
        date,
        startTime,
        endTime,
      });

      if (availability.isAvailable) {
        availableTeachers.push({
          ...teacher,
          availability,
        });
      }
    }

    return availableTeachers;
  }

  async checkTeacherAvailability(params: {
    teacherId: number;
    date: Date;
    startTime: string;
    endTime: string;
  }) {
    const { teacherId, date, startTime, endTime } = params;

    // Проверяем конфликты в расписании
    const conflicts = await this.prisma.schedule.findMany({
      where: {
        AND: [
          {
            OR: [
              { teacherId: teacherId },
              { substituteId: teacherId },
            ],
          },
          { date: date },
          { deletedAt: null },
          { status: { not: 'CANCELLED' } },
          {
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } },
                ],
              },
            ],
          },
        ],
      },
      include: {
        studyPlan: true,
        group: true,
      },
    });

    if (conflicts.length > 0) {
      return {
        isAvailable: false,
        reason: `Занят: ${conflicts[0].studyPlan.name} (${conflicts[0].group.name}) ${conflicts[0].startTime}-${conflicts[0].endTime}`,
        conflicts,
      };
    }

    // Проверяем отпуска
    const vacation = await this.prisma.vacation.findFirst({
      where: {
        teacherId,
        startDate: { lte: date },
        endDate: { gte: date },
        status: 'approved',
        deletedAt: null,
      },
    });

    if (vacation) {
      return {
        isAvailable: false,
        reason: `В отпуске (${vacation.type}) до ${vacation.endDate.toLocaleDateString()}`,
      };
    }

    return {
      isAvailable: true,
      reason: 'Доступен',
    };
  }

  async getSubstitutions(filters?: {
    teacherId?: number;
    substituteId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      substituteId: { not: null },
      deletedAt: null,
    };

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.substituteId) {
      where.substituteId = filters.substituteId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    return await this.prisma.schedule.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        substitute: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        group: true,
        studyPlan: true,
        classroom: true,
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'asc' },
      ],
    });
  }

  async getSubstitutionStats(teacherId?: number) {
    const where: any = {
      substituteId: { not: null },
      deletedAt: null,
    };

    if (teacherId) {
      where.OR = [
        { teacherId },
        { substituteId: teacherId },
      ];
    }

    const substitutions = await this.prisma.schedule.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
        substitute: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    const stats = {
      totalSubstitutions: substitutions.length,
      byTeacher: {} as Record<string, number>,
      bySubstitute: {} as Record<string, number>,
      byReason: {} as Record<string, number>,
    };

    substitutions.forEach(sub => {
      const teacherName = `${sub.teacher.user.surname} ${sub.teacher.user.name}`;
      const substituteName = `${sub.substitute.user.surname} ${sub.substitute.user.name}`;
      const reason = sub.substituteReason || 'Не указана';

      stats.byTeacher[teacherName] = (stats.byTeacher[teacherName] || 0) + 1;
      stats.bySubstitute[substituteName] = (stats.bySubstitute[substituteName] || 0) + 1;
      stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
    });

    return stats;
  }
}
