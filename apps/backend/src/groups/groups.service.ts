import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto) {
    return this.prisma.group.create({
      data: createGroupDto,
    });
  }

  async findAll() {
    return this.prisma.group.findMany({
      where: { deletedAt: null },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: [
        { courseNumber: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: true,
            Parents: {
              include: {
                user: true,
              },
            },
          },
        },
        studyPlans: {
          where: { deletedAt: null },
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        schedules: {
          where: { deletedAt: null },
          include: {
            studyPlan: true,
            teacher: {
              include: {
                user: true,
              },
            },
            classroom: true,
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
            studyPlans: {
              where: { deletedAt: null },
            },
            schedules: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.group.update({
      where: { id },
      data: updateGroupDto,
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для групп
  async findByCourse(courseNumber: number) {
    return this.prisma.group.findMany({
      where: { 
        courseNumber,
        deletedAt: null 
      },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async addStudentToGroup(groupId: number, studentId: number) {
    // Проверяем существование группы
    await this.findOne(groupId);

    // Проверяем существование студента
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: { groupId },
      include: {
        user: true,
        group: true,
      },
    });
  }

  async removeStudentFromGroup(studentId: number) {
    // Проверяем существование студента
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: { group: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // В нашей схеме groupId обязательное поле, поэтому мы помечаем студента как удаленного
    // или переводим в специальную группу "Без группы"
    return this.prisma.student.update({
      where: { id: studentId },
      data: { deletedAt: new Date() }, // Мягкое удаление студента
      include: {
        user: true,
      },
    });
  }

  async getGroupStatistics() {
    const totalGroups = await this.prisma.group.count({
      where: { deletedAt: null },
    });

    const groupsByCourse = await this.prisma.group.groupBy({
      by: ['courseNumber'],
      where: { deletedAt: null },
      _count: true,
    });

    const studentsPerGroup = await this.prisma.group.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        courseNumber: true,
        _count: {
          select: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: [
        { courseNumber: 'asc' },
        { name: 'asc' },
      ],
    });

    const totalStudents = await this.prisma.student.count({
      where: { deletedAt: null },
    });

    return {
      totalGroups,
      totalStudents,
      groupsByCourse,
      studentsPerGroup,
      averageStudentsPerGroup: totalStudents / totalGroups || 0,
    };
  }

  async getGroupSchedule(groupId: number) {
    await this.findOne(groupId); // Проверяем существование

    return this.prisma.schedule.findMany({
      where: {
        groupId,
        deletedAt: null,
      },
      include: {
        studyPlan: true,
        teacher: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async getGroupStudyPlans(groupId: number) {
    await this.findOne(groupId); // Проверяем существование

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        studyPlans: {
          where: { deletedAt: null },
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
            lessons: {
              where: { deletedAt: null },
              orderBy: { date: 'desc' },
              take: 5, // Последние 5 уроков
            },
            _count: {
              select: {
                lessons: {
                  where: { deletedAt: null },
                },
              },
            },
          },
        },
      },
    });

    return group?.studyPlans || [];
  }
}
