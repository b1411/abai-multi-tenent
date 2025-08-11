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

    const groupsByCourseRaw = await this.prisma.group.groupBy({
      by: ['courseNumber'],
      where: { deletedAt: null },
      _count: true,
    });

    const totalStudents = await this.prisma.student.count({
      where: { deletedAt: null },
    });

    // Преобразуем данные в нужный формат
    const groupsByCourse = groupsByCourseRaw.map(item => ({
      courseNumber: item.courseNumber,
      count: item._count,
    }));

    return {
      totalGroups,
      totalStudents,
      groupsByCourse,
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

  async findParentGroups(userId: number) {
    // Находим родителя и его детей
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          where: { deletedAt: null },
          select: {
            groupId: true
          }
        }
      }
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Получаем уникальные ID групп детей
    const childrenGroupIds = [...new Set(parent.students.map(student => student.groupId))];

    if (childrenGroupIds.length === 0) {
      return [];
    }

    // Возвращаем только группы, где учатся дети родителя
    return this.prisma.group.findMany({
      where: { 
        id: { in: childrenGroupIds },
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
      orderBy: [
        { courseNumber: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async getParentGroupStatistics(userId: number) {
    // Сначала получаем группы родителя
    const parentGroups = await this.findParentGroups(userId);
    
    if (parentGroups.length === 0) {
      return {
        totalGroups: 0,
        totalStudents: 0,
        groupsByCourse: [],
        averageStudentsPerGroup: 0,
      };
    }

    const groupIds = parentGroups.map(group => group.id);
    
    const totalGroups = parentGroups.length;
    
    // Подсчитываем студентов только в группах детей родителя
    const totalStudents = await this.prisma.student.count({
      where: { 
        groupId: { in: groupIds },
        deletedAt: null 
      },
    });

    // Группируем по курсам
    const groupsByCourseData = parentGroups.reduce((acc, group) => {
      const existing = acc.find(item => item.courseNumber === group.courseNumber);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ courseNumber: group.courseNumber, count: 1 });
      }
      return acc;
    }, [] as { courseNumber: number; count: number }[]);

    return {
      totalGroups,
      totalStudents,
      groupsByCourse: groupsByCourseData,
      averageStudentsPerGroup: totalStudents / totalGroups || 0,
    };
  }

  async findTeacherGroups(userId: number) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.group.findMany({
      where: {
        deletedAt: null,
        studyPlans: {
          some: {
            teacherId: teacher.id,
            deletedAt: null,
          },
        },
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
      orderBy: [
        { courseNumber: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async getTeacherGroupStatistics(userId: number) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherGroups = await this.prisma.group.findMany({
      where: {
        deletedAt: null,
        studyPlans: {
          some: {
            teacherId: teacher.id,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        courseNumber: true,
      },
    });

    if (teacherGroups.length === 0) {
      return {
        totalGroups: 0,
        totalStudents: 0,
        groupsByCourse: [],
        averageStudentsPerGroup: 0,
      };
    }

    const groupIds = teacherGroups.map(g => g.id);
    const totalGroups = teacherGroups.length;

    const totalStudents = await this.prisma.student.count({
      where: {
        groupId: { in: groupIds },
        deletedAt: null,
      },
    });

    const groupsByCourseData = teacherGroups.reduce((acc, group) => {
      const existing = acc.find(item => item.courseNumber === group.courseNumber);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ courseNumber: group.courseNumber, count: 1 });
      }
      return acc;
    }, [] as { courseNumber: number; count: number }[]);

    return {
      totalGroups,
      totalStudents,
      groupsByCourse: groupsByCourseData,
      averageStudentsPerGroup: totalGroups ? totalStudents / totalGroups : 0,
    };
  }
}
