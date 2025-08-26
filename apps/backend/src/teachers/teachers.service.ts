import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) { }

  async create(createTeacherDto: CreateTeacherDto) {
    // Проверяем существование пользователя
    const user = await this.prisma.user.findFirst({
      where: {
        id: createTeacherDto.userId,
        role: 'TEACHER',
        deletedAt: null
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createTeacherDto.userId} not found or is not a teacher`);
    }

    // Проверяем, не является ли пользователь уже преподавателем
    const existingTeacher = await this.prisma.teacher.findFirst({
      where: {
        userId: createTeacherDto.userId,
        deletedAt: null
      },
    });

    if (existingTeacher) {
      throw new ConflictException('User is already a teacher');
    }

    return this.prisma.teacher.create({
      data: createTeacherDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                courseNumber: true,
              },
            },
          },
        },
        schedules: {
          where: { deletedAt: null },
          include: {
            studyPlan: {
              select: {
                name: true,
              },
            },
            group: {
              select: {
                name: true,
              },
            },
            classroom: {
              select: {
                name: true,
                building: true,
              },
            },
          },
        },
      },
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id: id,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          include: {
            group: {
              include: {
                students: {
                  where: { deletedAt: null },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        surname: true,
                        middlename: true,
                      },
                    },
                  },
                },
              },
            },
            lessons: {
              where: { deletedAt: null },
              orderBy: { date: 'desc' },
              take: 10,
              include: {
                LessonResult: {
                  where: { deletedAt: null },
                  include: {
                    Student: {
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
                },
              },
            },
          },
        },
        schedules: {
          where: { deletedAt: null },
          include: {
            studyPlan: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                courseNumber: true,
              },
            },
            classroom: {
              select: {
                id: true,
                name: true,
                building: true,
                floor: true,
              },
            },
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
        vacations: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для преподавателей

  async findByUser(userId: number) {
    return this.prisma.teacher.findFirst({
      where: {
        userId,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          include: {
            group: true,
          },
        },
      },
    });
  }

  async getTeacherWorkload(teacherId: number) {
    await this.findOne(teacherId); // Проверяем существование

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          include: {
            group: {
              include: {
                _count: {
                  select: {
                    students: {
                      where: { deletedAt: null },
                    },
                  },
                },
              },
            },
            schedules: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!teacher) return null;

    // Подсчитываем нагрузку
    const workloadStats = teacher.studyPlans.reduce((acc, plan) => {
      const hoursPerWeek = plan.schedules.reduce((total, schedule) => {
        const startTime = new Date(`1970-01-01T${schedule.startTime}:00`);
        const endTime = new Date(`1970-01-01T${schedule.endTime}:00`);
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // в часах
        return total + duration;
      }, 0);

      return {
        totalSubjects: acc.totalSubjects + 1,
        totalGroups: acc.totalGroups + plan.group.length,
        totalStudents: acc.totalStudents + plan.group.reduce((sum, group) => sum + group._count.students, 0),
        totalHoursPerWeek: acc.totalHoursPerWeek + hoursPerWeek,
        normativeWorkload: acc.normativeWorkload + (plan.normativeWorkload || 0),
      };
    }, {
      totalSubjects: 0,
      totalGroups: 0,
      totalStudents: 0,
      totalHoursPerWeek: 0,
      normativeWorkload: 0,
    });

    return {
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        surname: teacher.user.surname,
      },
      workload: workloadStats,
      subjects: teacher.studyPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        groups: plan.group.map(group => ({
          id: group.id,
          name: group.name,
          studentCount: group._count.students,
        })),
        hoursPerWeek: plan.schedules.reduce((total, schedule) => {
          const startTime = new Date(`1970-01-01T${schedule.startTime}:00`);
          const endTime = new Date(`1970-01-01T${schedule.endTime}:00`);
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return total + duration;
        }, 0),
      })),
    };
  }

  async getTeacherSchedule(teacherId: number) {
    await this.findOne(teacherId); // Проверяем существование

    return this.prisma.schedule.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      include: {
        studyPlan: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            courseNumber: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async getTeacherStatistics() {
    const totalTeachers = await this.prisma.teacher.count({
      where: { deletedAt: null },
    });

    const teachersWithSubjects = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          include: {
            group: {
              include: {
                _count: {
                  select: {
                    students: {
                      where: { deletedAt: null },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Временно убираем группировку по experience до добавления поля в схему
    const experienceDistribution: any[] = [];

    const recentTeachers = await this.prisma.teacher.findMany({
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
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalTeachers,
      experienceDistribution,
      recentTeachers,
      workloadSummary: teachersWithSubjects.map(teacher => ({
        id: teacher.id,
        name: `${teacher.user.surname} ${teacher.user.name}`,
        subjectCount: teacher.studyPlans.length,
        groupCount: teacher.studyPlans.reduce((sum, plan) => sum + plan.group.length, 0),
        studentCount: teacher.studyPlans.reduce((sum, plan) =>
          sum + plan.group.reduce((groupSum, group) => groupSum + group._count.students, 0), 0
        ),
        experience: null, // Поле будет добавлено позже
        specialization: null, // Поле будет добавлено позже
      })),
    };
  }

  async findByEmploymentComposition() {
    const baseInclude = {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          middlename: true,
          phone: true,
          avatar: true,
          role: true,
        },
      },
      studyPlans: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          group: {
            select: {
              id: true,
              name: true,
              courseNumber: true,
              students: {
                where: { deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      },
    };

    const [staff, partTime] = await Promise.all([
      this.prisma.teacher.findMany({
        where: { deletedAt: null, employmentType: 'STAFF' },
        include: baseInclude,
        orderBy: [
          { user: { surname: 'asc' } },
          { user: { name: 'asc' } },
        ],
      }),
      this.prisma.teacher.findMany({
        where: { deletedAt: null, employmentType: 'PART_TIME' },
        include: baseInclude,
        orderBy: [
          { user: { surname: 'asc' } },
          { user: { name: 'asc' } },
        ],
      }),
    ]);

    return { staff, partTime };
  }

  async searchTeachers(query: string) {
    return this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        OR: [
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { surname: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          // Временно убираем поиск по specialization и qualification
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            middlename: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 20,
      orderBy: [
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }
}
