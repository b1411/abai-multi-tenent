import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateFullStudentDto } from './dto/create-full-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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
        group: true,
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
        group: true,
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

    // Извлекаем данные для создания пользователя и студента
    const { password, groupId, classId, ...userData } = createFullStudentDto;

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
          group: true,
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
        group: true,
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
}
