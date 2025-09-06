import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateFullStudentDto } from './dto/create-full-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreatePdpPlanDto } from './dto/create-pdp-plan.dto';
import { UpdatePdpPlanDto } from './dto/update-pdp-plan.dto';
import { CreatePdpGoalDto } from './dto/create-pdp-goal.dto';
import { UpdatePdpGoalDto } from './dto/update-pdp-goal.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) { }

  async create(createStudentDto: CreateStudentDto) {
    // Проверяем существование пользователя
    const user = await this.prisma.user.findFirst({
      where: {
        id: createStudentDto.userId,
        role: 'STUDENT',
        deletedAt: null
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createStudentDto.userId} not found or is not a student`);
    }

    // Проверяем существование группы
    const group = await this.prisma.group.findFirst({
      where: {
        id: createStudentDto.groupId,
        deletedAt: null
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${createStudentDto.groupId} not found`);
    }

    // Проверяем, не является ли пользователь уже студентом
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        userId: createStudentDto.userId,
        deletedAt: null
      },
    });

    if (existingStudent) {
      throw new ConflictException('User is already a student');
    }

    return this.prisma.student.create({
      data: createStudentDto,
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
        group: {
          include: {
            curator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    middlename: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
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
        group: {
          include: {
            curator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    middlename: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                middlename: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        lessonsResults: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            Lesson: {
              include: {
                studyPlan: true,
              },
            },
          },
        },
      },
      orderBy: [
        { group: { courseNumber: 'asc' } },
        { group: { name: 'asc' } },
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    groupId?: number;
    role?: string;
    teacherUserId?: number;
  }) {
    const { page, limit, search, groupId, role, teacherUserId } = params;

    let teacherGroupIds: number[] | undefined;

    if (role === 'TEACHER' && teacherUserId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: teacherUserId, deletedAt: null },
        include: {
          studyPlans: {
            where: { deletedAt: null },
            select: {
              group: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (teacher) {
        teacherGroupIds = Array.from(
          new Set(teacher.studyPlans.flatMap(sp => sp.group.map(g => g.id)))
        );
        if (!teacherGroupIds.length) {
          return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          };
        }
      } else {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    const where: any = {
      deletedAt: null,
    };

    if (groupId) {
      where.groupId = groupId;
    } else if (teacherGroupIds) {
      where.groupId = { in: teacherGroupIds };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { surname: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { group: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [total, students] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
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
          group: true,
          Parents: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  surname: true,
                  middlename: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
          lessonsResults: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              Lesson: {
                include: {
                  studyPlan: true,
                },
              },
            },
          },
        },
        orderBy: [
          { group: { courseNumber: 'asc' } },
            { group: { name: 'asc' } },
            { user: { surname: 'asc' } },
            { user: { name: 'asc' } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
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
        group: {
          include: {
            curator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    middlename: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
            studyPlans: {
              where: { deletedAt: null },
              include: {
                teacher: {
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
          },
        },
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                middlename: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        lessonsResults: {
          orderBy: { createdAt: 'desc' },
          include: {
            Lesson: {
              include: {
                studyPlan: {
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
                  },
                },
              },
            },
          },
        },
        // Убираем несуществующие поля до реализации соответствующих модулей
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id); // Проверяем существование

    // Если обновляется группа, проверяем её существование
    if (updateStudentDto.groupId) {
      const group = await this.prisma.group.findFirst({
        where: {
          id: updateStudentDto.groupId,
          deletedAt: null
        },
      });

      if (!group) {
        throw new NotFoundException(`Group with ID ${updateStudentDto.groupId} not found`);
      }
    }

    return this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
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
          group: {
            include: {
              curator: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                      middlename: true,
                      phone: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createFullStudent(createFullStudentDto: CreateFullStudentDto, currentUserRole?: string) {
    // Проверяем права доступа для учителей
    if (currentUserRole === 'TEACHER') {
      // Учителя могут создавать только студентов
      // Дополнительных ограничений нет, так как роль уже задана как STUDENT
    }

    // Проверяем уникальность email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createFullStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Проверяем существование группы
    const group = await this.prisma.group.findFirst({
      where: {
        id: createFullStudentDto.groupId,
        deletedAt: null
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${createFullStudentDto.groupId} not found`);
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(createFullStudentDto.password, 12);

    // Извлекаем данные для создания пользователя и студента. Поле password не входит в модель User; удаляем его из userData
    const { groupId, classId, ...userData } = createFullStudentDto;
    delete (userData as any).password;

    // Используем транзакцию для создания пользователя и студента
    const result = await this.prisma.$transaction(async (prisma) => {
      // Создаем пользователя
      const user = await prisma.user.create({
        data: {
          ...userData,
          hashedPassword,
          role: 'STUDENT',
        },
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
      });

      // Создаем запись студента
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          groupId,
          classId,
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
          group: {
            include: {
              curator: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                      middlename: true,
                      phone: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return student;
    });

    return {
      success: true,
      message: `Student ${result.user.surname} ${result.user.name} successfully created and enrolled`,
      student: result,
    };
  }

  // Специальные методы для студентов

  async findByGroup(groupId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    return this.prisma.student.findMany({
      where: {
        groupId,
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
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                phone: true,
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

  async findByUser(userId: number) {
    return this.prisma.student.findFirst({
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
        group: {
          include: {
            curator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    middlename: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async getStudentGrades(studentId: number) {
    await this.findOne(studentId); // Проверяем существование

    const grades = await this.prisma.lessonResult.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      include: {
        Lesson: {
          include: {
            studyPlan: {
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
              },
            },
          },
        },
      },
      orderBy: [
        { Lesson: { studyPlan: { name: 'asc' } } },
        { Lesson: { date: 'desc' } },
      ],
    });

    // Группируем оценки по предметам
    const gradesBySubject = grades.reduce((acc: any, grade) => {
      if (!grade.Lesson) return acc;

      const subjectName = grade.Lesson.studyPlan.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: grade.Lesson.studyPlan,
          grades: [],
          statistics: {
            totalLessons: 0,
            averageLessonScore: 0,
            averageHomeworkScore: 0,
            attendanceRate: 0,
          },
        };
      }
      acc[subjectName].grades.push(grade);
      return acc;
    }, {});

    // Вычисляем статистику для каждого предмета
    Object.keys(gradesBySubject).forEach(subjectName => {
      const subject = gradesBySubject[subjectName];
      const grades = subject.grades;

      subject.statistics.totalLessons = grades.length;

      const lessonScores = grades.filter(g => g.lessonScore !== null).map(g => g.lessonScore);
      const homeworkScores = grades.filter(g => g.homeworkScore !== null).map(g => g.homeworkScore);
      const attendanceCount = grades.filter(g => g.attendance === true).length;

      subject.statistics.averageLessonScore = lessonScores.length > 0
        ? lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length
        : 0;

      subject.statistics.averageHomeworkScore = homeworkScores.length > 0
        ? homeworkScores.reduce((a, b) => a + b, 0) / homeworkScores.length
        : 0;

      subject.statistics.attendanceRate = grades.length > 0
        ? Math.round((attendanceCount / grades.length) * 100)
        : 0;
    });

    return gradesBySubject;
  }

  async getStudentStatistics() {
    const totalStudents = await this.prisma.student.count({
      where: { deletedAt: null },
    });

    const studentsByGroup = await this.prisma.student.groupBy({
      by: ['groupId'],
      where: { deletedAt: null },
      _count: true,
      orderBy: {
        groupId: 'asc',
      },
    });

    // Получаем детали групп
    const groupDetails = await Promise.all(
      studentsByGroup.map(async (item) => {
        const group = await this.prisma.group.findUnique({
          where: { id: item.groupId },
          select: { id: true, name: true, courseNumber: true },
        });
        return {
          group,
          studentCount: item._count,
        };
      })
    );

    const recentStudents = await this.prisma.student.findMany({
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
        group: {
          select: {
            id: true,
            name: true,
            courseNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalStudents,
      studentsByGroup: groupDetails,
      recentStudents,
    };
  }

  async findStudentsForTeacher(userId: number) {
    // Находим преподавателя по userId и его группы
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: {
        studyPlans: {
          where: { deletedAt: null },
          select: {
            group: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const groupIds = Array.from(
      new Set(
        teacher.studyPlans.flatMap(sp => sp.group.map(g => g.id))
      )
    );

    if (groupIds.length === 0) {
      return [];
    }

    return this.prisma.student.findMany({
      where: {
        groupId: { in: groupIds },
        deletedAt: null,
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
        group: true,
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                middlename: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        lessonsResults: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            Lesson: {
              include: {
                studyPlan: true,
              },
            },
          },
        },
      },
      orderBy: [
        { group: { courseNumber: 'asc' } },
        { group: { name: 'asc' } },
        { user: { surname: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });
  }

  async getActiveStudentsCount() {
    const count = await this.prisma.student.count({
      where: { deletedAt: null },
    });

    return { count };
  }

  async changeStudentGroup(studentId: number, newGroupId: number) {
    await this.findOne(studentId); // Проверяем существование студента

    const group = await this.prisma.group.findFirst({
      where: { id: newGroupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${newGroupId} not found`);
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: { groupId: newGroupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        group: true,
      },
    });
  }

  async addParentToStudent(studentId: number, parentId: number) {
    // Проверяем существование студента
    const student = await this.findOne(studentId);

    // Проверяем существование родителя
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    // Проверяем, что пользователь действительно является родителем
    if (parent.user.role !== 'PARENT') {
      throw new ConflictException(`User with ID ${parent.userId} is not a parent`);
    }

    // Проверяем, не связан ли уже этот родитель с этим студентом
    const existingConnection = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        Parents: {
          some: {
            id: parentId,
          },
        },
      },
    });

    if (existingConnection) {
      throw new ConflictException(`Parent ${parentId} is already connected to student ${studentId}`);
    }

    // Создаем связь между студентом и родителем
    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: {
        Parents: {
          connect: { id: parentId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            courseNumber: true,
          },
        },
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: `Parent ${parent.user.surname} ${parent.user.name} successfully added to student ${student.user.surname} ${student.user.name}`,
      student: updatedStudent,
    };
  }

  async removeParentFromStudent(studentId: number, parentId: number) {
    // Проверяем существование студента
    const student = await this.findOne(studentId);

    // Проверяем существование родителя
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
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

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    // Проверяем, связан ли родитель с этим студентом
    const existingConnection = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        Parents: {
          some: {
            id: parentId,
          },
        },
      },
    });

    if (!existingConnection) {
      throw new NotFoundException(`Parent ${parentId} is not connected to student ${studentId}`);
    }

    // Удаляем связь между студентом и родителем
    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: {
        Parents: {
          disconnect: { id: parentId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            courseNumber: true,
          },
        },
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: `Parent ${parent.user.surname} ${parent.user.name} successfully removed from student ${student.user.surname} ${student.user.name}`,
      student: updatedStudent,
    };
  }

  async getStudentParents(studentId: number) {
    await this.findOne(studentId); // Проверяем существование студента

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        Parents: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return {
      student: {
        id: student.id,
        name: `${student.user.surname} ${student.user.name}`,
        email: student.user.email,
      },
      parents: student.Parents.map(parent => ({
        id: parent.id,
        name: `${parent.user.surname} ${parent.user.name}`,
        email: parent.user.email,
        phone: parent.user.phone,
        addedAt: parent.user.createdAt,
      })),
      totalParents: student.Parents.length,
    };
  }

  // Методы для посещаемости
  async getStudentAttendance(studentId: number, dateFrom?: string, dateTo?: string) {
    await this.findOne(studentId); // Проверяем существование студента

    const whereCondition: any = {
      studentId,
      deletedAt: null,
    };

    // Добавляем фильтр по датам если указаны
    if (dateFrom || dateTo) {
      whereCondition.Lesson = {};
      if (dateFrom) {
        whereCondition.Lesson.date = { gte: new Date(dateFrom) };
      }
      if (dateTo) {
        whereCondition.Lesson.date = { ...whereCondition.Lesson.date, lte: new Date(dateTo) };
      }
    }

    const lessonResults = await this.prisma.lessonResult.findMany({
      where: whereCondition,
      include: {
        Lesson: {
          include: {
            studyPlan: {
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
              },
            },
          },
        },
      },
      orderBy: {
        Lesson: {
          date: 'desc',
        },
      },
    });

    // Вычисляем статистику посещаемости
    const totalLessons = lessonResults.length;
    const attendedLessons = lessonResults.filter(result => result.attendance === true).length;
    const missedLessons = lessonResults.filter(result => result.attendance === false).length;
    const attendanceRate = totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0;

    // Группируем по причинам отсутствия
    const absenceReasons = lessonResults
      .filter(result => result.attendance === false && result.absentReason)
      .reduce((acc, result) => {
        const reason = result.absentReason;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Группируем по предметам
    const subjectAttendance = lessonResults.reduce((acc, result) => {
      if (!result.Lesson) return acc;
      
      const subjectName = result.Lesson.studyPlan.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          total: 0,
          attended: 0,
          missed: 0,
          rate: 0,
        };
      }
      
      acc[subjectName].total++;
      if (result.attendance === true) {
        acc[subjectName].attended++;
      } else if (result.attendance === false) {
        acc[subjectName].missed++;
      }
      
      acc[subjectName].rate = acc[subjectName].total > 0 
        ? Math.round((acc[subjectName].attended / acc[subjectName].total) * 100) 
        : 0;
      
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalLessons,
        attendedLessons,
        missedLessons,
        attendanceRate,
      },
      absenceReasons,
      subjectAttendance,
      details: lessonResults.map(result => ({
        id: result.id,
        date: result.Lesson?.date,
        subject: result.Lesson?.studyPlan.name,
        teacher: result.Lesson?.studyPlan.teacher 
          ? `${result.Lesson.studyPlan.teacher.user.surname} ${result.Lesson.studyPlan.teacher.user.name}`
          : null,
        attendance: result.attendance,
        absentReason: result.absentReason,
        absentComment: result.absentComment,
        lessonScore: result.lessonScore,
        homeworkScore: result.homeworkScore,
      })),
    };
  }

  // Методы для финансовой информации (только для родителей, учителей, админов)
  async getStudentFinances(studentId: number, currentUserRole: string, currentUserId: number) {
    // Проверяем права доступа
    if (!['PARENT', 'TEACHER', 'ADMIN', 'FINANCIST'].includes(currentUserRole)) {
      throw new ForbiddenException('Only parents, teachers, admins, and financists can access financial information');
    }

    const student = await this.findOne(studentId);

    // Если пользователь - родитель, проверяем, что он родитель этого студента
    if (currentUserRole === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUserId },
        include: {
          students: { where: { id: studentId } },
        },
      });

      if (!parent || parent.students.length === 0) {
        throw new ForbiddenException('You can only access financial information of your own children');
      }
    }

    // Получаем все платежи студента
    const payments = await this.prisma.payment.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Вычисляем финансовую статистику
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidAmount = payments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + (payment.paidAmount || payment.amount), 0);
    const pendingAmount = payments
      .filter(payment => payment.status === 'unpaid')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const overdueAmount = payments
      .filter(payment => payment.status === 'overdue')
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Группируем по типам услуг
    const paymentsByType = payments.reduce((acc, payment) => {
      const type = payment.serviceType;
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          count: 0,
        };
      }
      
      acc[type].total += payment.amount;
      acc[type].count++;
      
      if (payment.status === 'paid') {
        acc[type].paid += payment.paidAmount || payment.amount;
      } else if (payment.status === 'unpaid') {
        acc[type].pending += payment.amount;
      } else if (payment.status === 'overdue') {
        acc[type].overdue += payment.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return {
      student: {
        id: student.id,
        name: `${student.user.surname} ${student.user.name}`,
        group: student.group.name,
      },
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        paymentCount: payments.length,
      },
      paymentsByType,
      recentPayments: payments.slice(0, 10).map(payment => ({
        id: payment.id,
        serviceType: payment.serviceType,
        serviceName: payment.serviceName,
        amount: payment.amount,
        status: payment.status,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
      })),
    };
  }

  // Методы для эмоционального анализа (только для родителей, учителей, админов)
  async getStudentEmotionalState(studentId: number, currentUserRole: string, currentUserId: number) {
    // Проверяем права доступа
    if (!['PARENT', 'TEACHER', 'ADMIN'].includes(currentUserRole)) {
      throw new ForbiddenException('Only parents, teachers, and admins can access emotional state information');
    }

    const student = await this.findOne(studentId);

    // Если пользователь - родитель, проверяем, что он родитель этого студента
    if (currentUserRole === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUserId },
        include: {
          students: { where: { id: studentId } },
        },
      });

      if (!parent || parent.students.length === 0) {
        throw new ForbiddenException('You can only access emotional state of your own children');
      }
    }

    // Получаем эмоциональное состояние
    const emotionalState = await this.prisma.emotionalState.findUnique({
      where: { studentId },
    });

    // Получаем связанные данные из feedback
    const feedbackResponses = await this.prisma.feedbackResponse.findMany({
      where: {
        userId: student.userId,
        isCompleted: true,
      },
      include: {
        template: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 5, // Последние 5 ответов
    });

    // Анализируем эмоциональные данные из feedback
    const emotionalFeedback = feedbackResponses
      .filter(response => {
        const answers = response.answers as any;
        return answers.mood_today || answers.stress_level || answers.concentration_level;
      })
      .map(response => {
        const answers = response.answers as any;
        return {
          date: response.submittedAt,
          period: response.period,
          mood: answers.mood_today,
          stress: answers.stress_level,
          concentration: answers.concentration_level,
          motivation: answers.motivation_level,
          socialization: answers.socialization_level,
          template: response.template.title,
        };
      });

    // Вычисляем тренды если есть данные
    const trends = this.calculateEmotionalTrends(emotionalFeedback);

    return {
      student: {
        id: student.id,
        name: `${student.user.surname} ${student.user.name}`,
        group: student.group.name,
      },
      currentState: emotionalState ? {
        mood: {
          value: emotionalState.mood,
          description: emotionalState.moodDesc,
          trend: emotionalState.moodTrend,
        },
        concentration: {
          value: emotionalState.concentration,
          description: emotionalState.concentrationDesc,
          trend: emotionalState.concentrationTrend,
        },
        socialization: {
          value: emotionalState.socialization,
          description: emotionalState.socializationDesc,
          trend: emotionalState.socializationTrend,
        },
        motivation: {
          value: emotionalState.motivation,
          description: emotionalState.motivationDesc,
          trend: emotionalState.motivationTrend,
        },
        lastUpdated: emotionalState.updatedAt,
      } : null,
      feedbackHistory: emotionalFeedback,
      trends,
      recommendations: this.generateEmotionalRecommendations(emotionalState, emotionalFeedback),
    };
  }

  // Комплексный отчет студента (с проверкой прав доступа)
  async getStudentCompleteReport(studentId: number, currentUserRole: string, currentUserId: number) {
    const student = await this.findOne(studentId);

    // Получаем базовую информацию (доступна всем ролям)
    const attendance = await this.getStudentAttendance(studentId);
    const grades = await this.getStudentGrades(studentId);

    let finances = null;
    let emotionalState = null;

    // Финансы и эмоциональное состояние только для разрешенных ролей
    if (['PARENT', 'TEACHER', 'ADMIN', 'FINANCIST'].includes(currentUserRole)) {
      try {
        finances = await this.getStudentFinances(studentId, currentUserRole, currentUserId);
      } catch {
        // Если нет доступа, игнорируем
      }
    }

    if (['PARENT', 'TEACHER', 'ADMIN'].includes(currentUserRole)) {
      try {
        emotionalState = await this.getStudentEmotionalState(studentId, currentUserRole, currentUserId);
      } catch {
        // Если нет доступа, игнорируем
      }
    }

    return {
      student: {
        id: student.id,
        name: `${student.user.surname} ${student.user.name}`,
        email: student.user.email,
        phone: student.user.phone,
        group: student.group,
        parents: student.Parents?.map(parent => ({
          name: `${parent.user.surname} ${parent.user.name}`,
          phone: parent.user.phone,
          email: parent.user.email,
        })) || [],
      },
      attendance,
      grades,
      finances,
      emotionalState,
      accessLevel: {
        canViewFinances: ['PARENT', 'TEACHER', 'ADMIN', 'FINANCIST'].includes(currentUserRole),
        canViewEmotionalState: ['PARENT', 'TEACHER', 'ADMIN'].includes(currentUserRole),
      },
    };
  }

  // Вспомогательные методы
  private calculateEmotionalTrends(feedbackData: any[]) {
    if (feedbackData.length < 2) {
      return {
        mood: 'insufficient_data',
        concentration: 'insufficient_data',
        motivation: 'insufficient_data',
        socialization: 'insufficient_data',
      };
    }

    const latest = feedbackData[0];
    const previous = feedbackData[1];

    const calculateTrend = (current: number, prev: number) => {
      if (!current || !prev) return 'neutral';
      const diff = current - prev;
      if (diff > 10) return 'up';
      if (diff < -10) return 'down';
      return 'neutral';
    };

    return {
      mood: calculateTrend(latest.mood, previous.mood),
      concentration: calculateTrend(latest.concentration, previous.concentration),
      motivation: calculateTrend(latest.motivation, previous.motivation),
      socialization: calculateTrend(latest.socialization, previous.socialization),
    };
  }

  private generateEmotionalRecommendations(currentState: any, feedbackHistory: any[]) {
    const recommendations = [];

    if (currentState) {
      if (currentState.mood < 40) {
        recommendations.push({
          type: 'mood',
          priority: 'high',
          message: 'Рекомендуется обратить внимание на настроение студента. Возможно, требуется беседа с психологом.',
        });
      }

      if (currentState.concentration < 40) {
        recommendations.push({
          type: 'concentration',
          priority: 'medium',
          message: 'Низкий уровень концентрации. Рекомендуется пересмотреть режим занятий и отдыха.',
        });
      }

      if (currentState.motivation < 40) {
        recommendations.push({
          type: 'motivation',
          priority: 'high',
          message: 'Низкая мотивация к обучению. Требуется работа с преподавателями и родителями.',
        });
      }

      if (currentState.socialization < 40) {
        recommendations.push({
          type: 'socialization',
          priority: 'medium',
          message: 'Проблемы с социализацией. Рекомендуется участие в групповых активностях.',
        });
      }
    }

    // Анализируем тренды
    if (feedbackHistory.length >= 3) {
      const recentMoods = feedbackHistory.slice(0, 3).map(f => f.mood).filter(m => m);
      const isDecreasingMood = recentMoods.length >= 3 && 
        recentMoods[0] < recentMoods[1] && recentMoods[1] < recentMoods[2];

      if (isDecreasingMood) {
        recommendations.push({
          type: 'trend',
          priority: 'high',
          message: 'Наблюдается устойчивое снижение настроения. Требуется вмешательство специалистов.',
        });
      }
    }

    return recommendations;
  }

  // === МЕТОДЫ ДЛЯ РАБОТЫ С ЗАМЕЧАНИЯМИ ===

  async getStudentRemarks(studentId: number, currentUserRole?: string, currentUserId?: number) {
    const student = await this.findOne(studentId); // Проверяем существование студента

    // Если пользователь студент, проверяем что он запрашивает свои замечания
    if (currentUserRole === 'STUDENT') {
      if (student.userId !== currentUserId) {
        throw new ForbiddenException('Students can only view their own remarks');
      }
    }

    const remarks = await this.prisma.studentRemark.findMany({
      where: {
        studentId,
        deletedAt: null,
        // Студенты видят только публичные замечания (isPrivate: false), админы и учителя - все
        ...(currentUserRole === 'STUDENT' ? { isPrivate: false } : {}),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
            middlename: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      studentId,
      totalRemarks: remarks.length,
      remarks: remarks.map(remark => ({
        id: remark.id,
        type: remark.type,
        title: remark.title,
        content: remark.content,
        isPrivate: remark.isPrivate,
        teacher: {
          id: remark.teacher.id,
          name: `${remark.teacher.surname} ${remark.teacher.name}`,
        },
        createdAt: remark.createdAt,
        updatedAt: remark.updatedAt,
      })),
    };
  }

  async addStudentRemark(studentId: number, createRemarkDto: any, teacherId: number) {
    await this.findOne(studentId); // Проверяем существование студента

    // Проверяем, что пользователь является преподавателем
    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        role: { in: ['TEACHER', 'ADMIN'] },
        deletedAt: null,
      },
    });

    if (!teacher) {
      throw new ForbiddenException('Only teachers and admins can add remarks');
    }

    const remark = await this.prisma.studentRemark.create({
      data: {
        studentId,
        teacherId,
        type: createRemarkDto.type || 'GENERAL',
        title: createRemarkDto.title,
        content: createRemarkDto.content,
        isPrivate: createRemarkDto.isPrivate !== undefined ? createRemarkDto.isPrivate : true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
            middlename: true,
          },
        },
        student: {
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
      },
    });

    return {
      success: true,
      message: `Remark added successfully for student ${remark.student.user.surname} ${remark.student.user.name}`,
      remark: {
        id: remark.id,
        type: remark.type,
        title: remark.title,
        content: remark.content,
        isPrivate: remark.isPrivate,
        teacher: {
          id: remark.teacher.id,
          name: `${remark.teacher.surname} ${remark.teacher.name}`,
        },
        createdAt: remark.createdAt,
        updatedAt: remark.updatedAt,
      },
    };
  }

  async updateStudentRemark(remarkId: number, updateRemarkDto: any, currentUserId: number, currentUserRole: string) {
    const remark = await this.prisma.studentRemark.findFirst({
      where: {
        id: remarkId,
        deletedAt: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        student: {
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

    if (!remark) {
      throw new NotFoundException(`Remark with ID ${remarkId} not found`);
    }

    // Проверяем права доступа: только автор замечания или админ может редактировать
    if (remark.teacherId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('You can only edit your own remarks');
    }

    const updatedRemark = await this.prisma.studentRemark.update({
      where: { id: remarkId },
      data: {
        ...(updateRemarkDto.type && { type: updateRemarkDto.type }),
        ...(updateRemarkDto.title && { title: updateRemarkDto.title }),
        ...(updateRemarkDto.content && { content: updateRemarkDto.content }),
        ...(updateRemarkDto.isPrivate !== undefined && { isPrivate: updateRemarkDto.isPrivate }),
        updatedAt: new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Remark updated successfully for student ${remark.student.user.surname} ${remark.student.user.name}`,
      remark: {
        id: updatedRemark.id,
        type: updatedRemark.type,
        title: updatedRemark.title,
        content: updatedRemark.content,
        isPrivate: updatedRemark.isPrivate,
        teacher: {
          id: updatedRemark.teacher.id,
          name: `${updatedRemark.teacher.surname} ${updatedRemark.teacher.name}`,
        },
        createdAt: updatedRemark.createdAt,
        updatedAt: updatedRemark.updatedAt,
      },
    };
  }

  async deleteStudentRemark(remarkId: number, currentUserId: number, currentUserRole: string) {
    const remark = await this.prisma.studentRemark.findFirst({
      where: {
        id: remarkId,
        deletedAt: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        student: {
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

    if (!remark) {
      throw new NotFoundException(`Remark with ID ${remarkId} not found`);
    }

    // Проверяем права доступа: только автор замечания или админ может удалить
    if (remark.teacherId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own remarks');
    }

    await this.prisma.studentRemark.update({
      where: { id: remarkId },
      data: { deletedAt: new Date() },
    });

    return {
      success: true,
      message: `Remark deleted successfully for student ${remark.student.user.surname} ${remark.student.user.name}`,
    };
  }

  // === МЕТОДЫ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ ===

  async getStudentComments(studentId: number) {
    await this.findOne(studentId); // Проверяем существование студента

    const comments = await this.prisma.studentComment.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
            middlename: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      studentId,
      totalComments: comments.length,
      comments: comments.map(comment => ({
        id: comment.id,
        title: comment.title,
        content: comment.content,
        type: comment.type,
        isPrivate: comment.isPrivate,
        teacher: {
          id: comment.teacher.id,
          name: `${comment.teacher.surname} ${comment.teacher.name}`,
        },
        author: {
          id: comment.teacher.id,
          name: `${comment.teacher.surname} ${comment.teacher.name}`,
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
    };
  }

  async addStudentComment(studentId: number, createCommentDto: any, teacherId: number) {
    await this.findOne(studentId); // Проверяем существование студента

    // Проверяем, что пользователь является преподавателем или админом
    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        role: { in: ['TEACHER', 'ADMIN'] },
        deletedAt: null,
      },
    });

    if (!teacher) {
      throw new ForbiddenException('Only teachers and admins can add comments');
    }

    const comment = await this.prisma.studentComment.create({
      data: {
        studentId,
        teacherId,
        title: createCommentDto.title,
        content: createCommentDto.content,
        type: createCommentDto.type || 'GENERAL',
        isPrivate: createCommentDto.isPrivate !== undefined ? createCommentDto.isPrivate : true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
            middlename: true,
          },
        },
        student: {
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
      },
    });

    return {
      success: true,
      message: `Comment added successfully for student ${comment.student.user.surname} ${comment.student.user.name}`,
      comment: {
        id: comment.id,
        title: comment.title,
        content: comment.content,
        type: comment.type,
        isPrivate: comment.isPrivate,
        teacher: {
          id: comment.teacher.id,
          name: `${comment.teacher.surname} ${comment.teacher.name}`,
        },
        author: {
          id: comment.teacher.id,
          name: `${comment.teacher.surname} ${comment.teacher.name}`,
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    };
  }

  async updateStudentComment(commentId: number, updateCommentDto: any, currentUserId: number, currentUserRole: string) {
    const comment = await this.prisma.studentComment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        student: {
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

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    // Проверяем права доступа: только автор комментария или админ может редактировать
    if (comment.teacherId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.studentComment.update({
      where: { id: commentId },
      data: {
        ...(updateCommentDto.title && { title: updateCommentDto.title }),
        ...(updateCommentDto.content && { content: updateCommentDto.content }),
        ...(updateCommentDto.type && { type: updateCommentDto.type }),
        ...(updateCommentDto.isPrivate !== undefined && { isPrivate: updateCommentDto.isPrivate }),
        updatedAt: new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return {
      success: true,
      message: `Comment updated successfully for student ${comment.student.user.surname} ${comment.student.user.name}`,
      comment: {
        id: updatedComment.id,
        title: updatedComment.title,
        content: updatedComment.content,
        type: updatedComment.type,
        isPrivate: updatedComment.isPrivate,
        teacher: {
          id: updatedComment.teacher.id,
          name: `${updatedComment.teacher.surname} ${updatedComment.teacher.name}`,
        },
        author: {
          id: updatedComment.teacher.id,
          name: `${updatedComment.teacher.surname} ${updatedComment.teacher.name}`,
        },
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      },
    };
  }

  async deleteStudentComment(commentId: number, currentUserId: number, currentUserRole: string) {
    const comment = await this.prisma.studentComment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        student: {
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

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    // Проверяем права доступа: только автор комментария или админ может удалить
    if (comment.teacherId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.studentComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return {
      success: true,
      message: `Comment deleted successfully for student ${comment.student.user.surname} ${comment.student.user.name}`,
    };
  }

  // === МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ ПРЕПОДАВАТЕЛЕЙ СТУДЕНТА ===

  async getStudentTeachers(studentId: number) {
    const student = await this.findOne(studentId); // Проверяем существование студента

    // Получаем всех преподавателей, которые ведут занятия у данного студента через учебные планы группы
    const studyPlans = await this.prisma.studyPlan.findMany({
      where: {
        group: {
          some: {
            id: student.groupId,
          },
        },
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
                middlename: true,
              },
            },
          },
        },
      },
      distinct: ['teacherId'], // Убираем дубликаты преподавателей
    });

    // Формируем список уникальных преподавателей с их предметами
    const teachersMap = new Map();

    for (const studyPlan of studyPlans) {
      if (studyPlan.teacher) {
        const teacherId = studyPlan.teacher.id;
        
        if (!teachersMap.has(teacherId)) {
          teachersMap.set(teacherId, {
            id: teacherId,
            name: studyPlan.teacher.user.name,
            surname: studyPlan.teacher.user.surname,
            middlename: studyPlan.teacher.user.middlename,
            subjects: [],
          });
        }
        
        // Добавляем предмет к списку предметов преподавателя
        const teacher = teachersMap.get(teacherId);
        if (!teacher.subjects.includes(studyPlan.name)) {
          teacher.subjects.push(studyPlan.name);
        }
      }
    }

    // Преобразуем Map в массив и форматируем для фронтенда
    const teachers = Array.from(teachersMap.values()).map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      surname: teacher.surname,
      subject: teacher.subjects.join(', '), // Объединяем предметы в строку
    }));

    return teachers;
  }

  // === ОПТИМИЗИРОВАННЫЙ ПОЛУЧЕНИЕ ЭКЗАМЕНОВ / КОНТРОЛЬНЫХ ===
  async getStudentExams(
    studentId: number,
    opts: { type?: 'CONTROL_WORK' | 'EXAM'; page: number; limit: number },
  ) {
    const { type, page, limit } = opts;
    const student = await this.findOne(studentId); // выбросит NotFound если нет

    const where: any = {
      deletedAt: null,
      type: (type || 'CONTROL_WORK'),
      studyPlan: {
        group: {
          some: { id: student.groupId },
        },
      },
    };

    const [total, lessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where }),
      this.prisma.lesson.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          studyPlan: {
            select: { id: true, name: true },
          },
          LessonResult: {
            where: {
              studentId,
              deletedAt: null,
            },
            select: {
              lessonScore: true,
              homeworkScore: true,
              attendance: true,
              absentReason: true,
            },
          },
        },
      }),
    ]);

    return {
      data: lessons.map(l => ({
        id: l.id,
        name: l.name,
        date: l.date,
        type: l.type,
        studyPlan: l.studyPlan,
        result: l.LessonResult[0] || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // === PDP (Personal Development Plan) ===

  private async assertCanViewStudent(studentId: number, currentUserRole?: string, currentUserId?: number) {
    if (['ADMIN', 'TEACHER'].includes(currentUserRole || '')) return;

    if (currentUserRole === 'STUDENT') {
      const st = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
      });
      if (!st || st.userId !== currentUserId) {
        throw new ForbiddenException('Students can only view their own PDP');
      }
      return;
    }

    if (currentUserRole === 'PARENT') {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUserId || 0 },
        include: { students: { where: { id: studentId } } },
      });
      if (!parent || parent.students.length === 0) {
        throw new ForbiddenException('Parents can only view PDP of their own children');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private async assertCanEditStudent(studentId: number, currentUserRole?: string, currentUserId?: number) {
    if (['ADMIN', 'TEACHER'].includes(currentUserRole || '')) return;

    if (currentUserRole === 'STUDENT') {
      const st = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
      });
      if (!st || st.userId !== currentUserId) {
        throw new ForbiddenException('Students can only edit their own PDP');
      }
      return;
    }

    // Parents, HR, FINANCIST cannot edit PDP
    throw new ForbiddenException('Only admins, teachers, or the student can edit PDP');
  }

  async getStudentPdp(studentId: number, currentUserRole?: string, currentUserId?: number) {
    await this.findOne(studentId);
    await this.assertCanViewStudent(studentId, currentUserRole, currentUserId);

    const plans = await this.prisma.personalDevelopmentPlan.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        goals: {
          where: { deletedAt: null },
          orderBy: [
            { order: 'asc' },
            { deadline: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    return {
      studentId,
      totalPlans: plans.length,
      plans,
    };
  }

  async createStudentPdp(studentId: number, dto: CreatePdpPlanDto, currentUserRole?: string, currentUserId?: number) {
    await this.findOne(studentId);
    await this.assertCanEditStudent(studentId, currentUserRole, currentUserId);

    const plan = await this.prisma.personalDevelopmentPlan.create({
      data: {
        studentId,
        subject: dto.subject,
        status: (dto.status as any) || 'DRAFT',
        mentor: dto.mentor,
        description: dto.description,
        progress: dto.progress ?? 0,
        skills: dto.skills || [],
      },
      include: { goals: true },
    });

    return {
      success: true,
      plan,
    };
  }

  async updatePdpPlan(planId: number, dto: UpdatePdpPlanDto, currentUserRole?: string, currentUserId?: number) {
    const plan = await this.prisma.personalDevelopmentPlan.findFirst({
      where: { id: planId, deletedAt: null },
      include: { student: true },
    });

    if (!plan) throw new NotFoundException(`PDP plan ${planId} not found`);

    await this.assertCanEditStudent(plan.studentId, currentUserRole, currentUserId);

    const updated = await this.prisma.personalDevelopmentPlan.update({
      where: { id: planId },
      data: {
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.mentor !== undefined && { mentor: dto.mentor }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
        ...(dto.skills !== undefined && { skills: dto.skills }),
        updatedAt: new Date(),
      },
      include: {
        goals: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { deadline: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return {
      success: true,
      plan: updated,
    };
  }

  async deletePdpPlan(planId: number, currentUserRole?: string, currentUserId?: number) {
    const plan = await this.prisma.personalDevelopmentPlan.findFirst({
      where: { id: planId, deletedAt: null },
      include: { student: true },
    });

    if (!plan) throw new NotFoundException(`PDP plan ${planId} not found`);

    await this.assertCanEditStudent(plan.studentId, currentUserRole, currentUserId);

    await this.prisma.personalDevelopmentPlan.update({
      where: { id: planId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async addPdpGoal(planId: number, dto: CreatePdpGoalDto, currentUserRole?: string, currentUserId?: number) {
    const plan = await this.prisma.personalDevelopmentPlan.findFirst({
      where: { id: planId, deletedAt: null },
      include: { student: true },
    });
    if (!plan) throw new NotFoundException(`PDP plan ${planId} not found`);

    await this.assertCanEditStudent(plan.studentId, currentUserRole, currentUserId);

    const goal = await this.prisma.pdpGoal.create({
      data: {
        planId,
        title: dto.title,
        status: (dto.status as any) || 'PENDING',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        order: dto.order ?? null,
      },
    });

    return { success: true, goal };
  }

  async updatePdpGoal(goalId: number, dto: UpdatePdpGoalDto, currentUserRole?: string, currentUserId?: number) {
    const goal = await this.prisma.pdpGoal.findFirst({
      where: { id: goalId, deletedAt: null },
      include: {
        plan: {
          include: { student: true },
        },
      },
    });

    if (!goal) throw new NotFoundException(`PDP goal ${goalId} not found`);

    await this.assertCanEditStudent(goal.plan.studentId, currentUserRole, currentUserId);

    const updated = await this.prisma.pdpGoal.update({
      where: { id: goalId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline ? new Date(dto.deadline) : null }),
        ...(dto.order !== undefined && { order: dto.order }),
        updatedAt: new Date(),
      },
    });

    return { success: true, goal: updated };
  }

  async deletePdpGoal(goalId: number, currentUserRole?: string, currentUserId?: number) {
    const goal = await this.prisma.pdpGoal.findFirst({
      where: { id: goalId, deletedAt: null },
      include: {
        plan: {
          include: { student: true },
        },
      },
    });

    if (!goal) throw new NotFoundException(`PDP goal ${goalId} not found`);

    await this.assertCanEditStudent(goal.plan.studentId, currentUserRole, currentUserId);

    await this.prisma.pdpGoal.update({
      where: { id: goalId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
