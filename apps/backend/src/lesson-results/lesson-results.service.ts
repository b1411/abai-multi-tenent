import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateLessonResultDto } from './dto/create-lesson-result.dto';
import { UpdateLessonResultDto } from './dto/update-lesson-result.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LessonResultsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async getMyGrades(userId: number, filters: {
    studyPlanId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    // Находим студента по userId
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const where: any = {
      studentId: student.id,
      deletedAt: null,
      ...(filters.studyPlanId && {
        Lesson: {
          studyPlanId: filters.studyPlanId
        }
      }),
      ...(filters.startDate && filters.endDate && {
        Lesson: {
          date: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
          }
        }
      })
    };

    const results = await this.prisma.lessonResult.findMany({
      where,
      include: {
        Lesson: {
          include: {
            studyPlan: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        },
        Homework: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Вычисляем статистику
    const totalLessons = results.length;
    const attendedLessons = results.filter(r => r.attendance === true).length;
    const attendancePercentage = totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0;

    const grades = results
      .map(r => [r.lessonScore, r.homeworkScore])
      .flat()
      .filter((grade): grade is number => grade !== undefined && grade !== null);

    const averageGrade = grades.length > 0 
      ? Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 100) / 100 
      : 0;

    return {
      student,
      results,
      statistics: {
        averageGrade,
        attendancePercentage,
        totalLessons,
        attendedLessons
      }
    };
  }

  async create(createLessonResultDto: CreateLessonResultDto) {
    // Проверяем существование студента и урока
    await this.validateStudentAndLesson(createLessonResultDto.studentId, createLessonResultDto.lessonId);

    // Проверяем, нет ли уже записи для этого студента и урока
    const existingResult = await this.prisma.lessonResult.findUnique({
      where: {
        studentId_lessonId: {
          studentId: createLessonResultDto.studentId,
          lessonId: createLessonResultDto.lessonId,
        },
      },
    });

    if (existingResult) {
      throw new ConflictException('Lesson result for this student and lesson already exists');
    }

    const result = await this.prisma.lessonResult.create({
      data: createLessonResultDto,
      include: {
        Student: {
          include: {
            user: true,
            group: true,
            Parents: {
              include: {
                user: true,
              },
            },
          },
        },
        Lesson: {
          include: {
            studyPlan: {
              include: {
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Создаем уведомления при выставлении оценки
    await this.createGradeNotifications(result);

    return result;
  }

  async findAll() {
    return this.prisma.lessonResult.findMany({
      where: { deletedAt: null },
      include: {
        Student: {
          include: {
            user: true,
            group: true,
          },
        },
        Lesson: {
          include: {
            studyPlan: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: number) {
    const lessonResult = await this.prisma.lessonResult.findFirst({
      where: { id, deletedAt: null },
      include: {
        Student: {
          include: {
            user: true,
            group: true,
            Parents: {
              include: {
                user: true,
              },
            },
          },
        },
        Lesson: {
          include: {
            studyPlan: {
              include: {
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            materials: true,
          },
        },
        Homework: {
          include: {
            homework: true,
            fileUrl: true,
          },
        },
      },
    });

    if (!lessonResult) {
      throw new NotFoundException(`Lesson result with ID ${id} not found`);
    }

    return lessonResult;
  }

  async update(id: number, updateLessonResultDto: UpdateLessonResultDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.lessonResult.update({
      where: { id },
      data: updateLessonResultDto,
      include: {
        Student: {
          include: {
            user: true,
            group: true,
          },
        },
        Lesson: {
          include: {
            studyPlan: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.lessonResult.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Специальные методы для электронного журнала

  // Получить журнал по уроку (все студенты и их оценки)
  async getJournalByLesson(lessonId: number) {
    // Проверяем существование урока
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        studyPlan: {
          include: {
            group: {
              include: {
                students: {
                  where: { deletedAt: null },
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Получаем результаты для всех студентов урока
    const results = await this.prisma.lessonResult.findMany({
      where: {
        lessonId,
        deletedAt: null,
      },
      include: {
        Student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Создаем полный журнал со всеми студентами группы
    const allStudents = lesson.studyPlan.group.flatMap(group => group.students);
    
    const journalEntries = allStudents.map(student => {
      const result = results.find(r => r.studentId === student.id);
      return {
        student: {
          id: student.id,
          name: student.user.name,
          surname: student.user.surname,
          middlename: student.user.middlename,
        },
        result: result || null,
      };
    });

    return {
      lesson: {
        id: lesson.id,
        name: lesson.name,
        date: lesson.date,
        studyPlan: lesson.studyPlan,
      },
      entries: journalEntries,
    };
  }

  // Получить оценки студента по предмету
  async getStudentGradesBySubject(studentId: number, studyPlanId: number) {
    await this.validateStudent(studentId);
    
    const studyPlan = await this.prisma.studyPlan.findFirst({
      where: { id: studyPlanId, deletedAt: null },
    });

    if (!studyPlan) {
      throw new NotFoundException(`StudyPlan with ID ${studyPlanId} not found`);
    }

    const results = await this.prisma.lessonResult.findMany({
      where: {
        studentId,
        deletedAt: null,
        Lesson: {
          studyPlanId,
          deletedAt: null,
        },
      },
      include: {
        Lesson: true,
      },
      orderBy: {
        Lesson: {
          date: 'asc',
        },
      },
    });

    // Вычисляем статистику
    const lessonScores = results.filter(r => r.lessonScore !== null).map(r => r.lessonScore);
    const homeworkScores = results.filter(r => r.homeworkScore !== null).map(r => r.homeworkScore);
    const attendanceRate = results.length > 0 ? results.filter(r => r.attendance === true).length / results.length : 0;

    return {
      studyPlan,
      results,
      statistics: {
        totalLessons: results.length,
        lessonAverageScore: lessonScores.length > 0 ? lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length : null,
        homeworkAverageScore: homeworkScores.length > 0 ? homeworkScores.reduce((a, b) => a + b, 0) / homeworkScores.length : null,
        attendanceRate: Math.round(attendanceRate * 100), // В процентах
        missedLessons: results.filter(r => r.attendance === false).length,
      },
    };
  }

  // Получить журнал группы за период
  async getGroupJournalByPeriod(groupId: number, startDate: Date, endDate: Date) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, deletedAt: null },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: true,
            group: true, // Добавляем информацию о группе для каждого студента
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        studyPlan: {
          group: {
            some: { id: groupId },
          },
        },
        deletedAt: null,
      },
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        LessonResult: {
          where: { deletedAt: null },
          include: {
            Student: {
              include: {
                user: true,
                group: true, // Добавляем информацию о группе
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      group,
      period: { startDate, endDate },
      lessons,
      students: group.students.map(student => ({
        ...student,
        group: group, // Явно присваиваем информацию о группе
      })),
    };
  }

  // Массовое выставление посещаемости
  async bulkMarkAttendance(lessonId: number, attendanceData: { studentId: number; attendance: boolean; absentReason?: 'SICK' | 'FAMILY' | 'OTHER'; absentComment?: string }[]) {
    await this.validateLesson(lessonId);

    const results = await Promise.all(
      attendanceData.map(async ({ studentId, attendance, absentReason, absentComment }) => {
        const existingResult = await this.prisma.lessonResult.findUnique({
          where: {
            studentId_lessonId: { studentId, lessonId },
          },
        });

        if (existingResult) {
          return this.prisma.lessonResult.update({
            where: { id: existingResult.id },
            data: {
              attendance,
              absentReason: attendance ? null : (absentReason as any),
              absentComment: attendance ? null : absentComment,
            },
          });
        } else {
          return this.prisma.lessonResult.create({
            data: {
              studentId,
              lessonId,
              attendance,
              absentReason: attendance ? null : (absentReason as any),
              absentComment: attendance ? null : absentComment,
            },
          });
        }
      })
    );

    return results;
  }

  // Получить статистику посещаемости
  async getAttendanceStatistics(groupId?: number, studyPlanId?: number, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
      deletedAt: null,
    };

    if (groupId) {
      whereClause.Student = {
        groupId,
        deletedAt: null,
      };
    }

    if (studyPlanId) {
      whereClause.Lesson = {
        studyPlanId,
        deletedAt: null,
      };
    }

    if (startDate && endDate) {
      whereClause.Lesson = {
        ...whereClause.Lesson,
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const results = await this.prisma.lessonResult.findMany({
      where: whereClause,
      include: {
        Student: {
          include: {
            user: true,
            group: true,
          },
        },
        Lesson: {
          include: {
            studyPlan: true,
          },
        },
      },
    });

    const totalLessons = results.length;
    const presentCount = results.filter(r => r.attendance === true).length;
    const absentCount = results.filter(r => r.attendance === false).length;

    return {
      totalLessons,
      presentCount,
      absentCount,
      attendanceRate: totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 0,
      results,
    };
  }

  // Приватные методы для валидации
  private async validateStudent(studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return student;
  }

  private async validateLesson(lessonId: number) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson;
  }

  private async validateStudentAndLesson(studentId: number, lessonId: number) {
    await this.validateStudent(studentId);
    await this.validateLesson(lessonId);
  }

  // Создание уведомлений при выставлении оценок
  private async createGradeNotifications(result: any) {
    try {
      const notifications = [];

      // Уведомление студенту при выставлении оценки за урок
      if (result.lessonScore !== null && result.lessonScore !== undefined) {
        notifications.push({
          userId: result.Student.user.id,
          type: 'LESSON_GRADE',
          message: `Выставлена оценка за урок "${result.Lesson.name}": ${result.lessonScore} баллов`,
          url: '/journal',
          createdBy: result.Lesson.studyPlan.teacher.user.id,
        });
      }

      // Уведомление студенту при выставлении оценки за домашнее задание
      if (result.homeworkScore !== null && result.homeworkScore !== undefined) {
        notifications.push({
          userId: result.Student.user.id,
          type: 'HOMEWORK_GRADE',
          message: `Выставлена оценка за домашнее задание по уроку "${result.Lesson.name}": ${result.homeworkScore} баллов`,
          url: '/homework',
          createdBy: result.Lesson.studyPlan.teacher.user.id,
        });
      }

      // Уведомления родителям студента
      if (result.Student.Parents && result.Student.Parents.length > 0) {
        for (const parent of result.Student.Parents) {
          if (result.lessonScore !== null && result.lessonScore !== undefined) {
            notifications.push({
              userId: parent.user.id,
              type: 'CHILD_LESSON_GRADE',
              message: `Вашему ребенку ${result.Student.user.name} ${result.Student.user.surname} выставлена оценка за урок "${result.Lesson.name}": ${result.lessonScore} баллов`,
              url: '/journal',
              createdBy: result.Lesson.studyPlan.teacher.user.id,
            });
          }

          if (result.homeworkScore !== null && result.homeworkScore !== undefined) {
            notifications.push({
              userId: parent.user.id,
              type: 'CHILD_HOMEWORK_GRADE',
              message: `Вашему ребенку ${result.Student.user.name} ${result.Student.user.surname} выставлена оценка за домашнее задание по уроку "${result.Lesson.name}": ${result.homeworkScore} баллов`,
              url: '/homework',
              createdBy: result.Lesson.studyPlan.teacher.user.id,
            });
          }
        }
      }

      // Создаем все уведомления (индивидуально для каждого получателя)
      if (notifications.length > 0) {
        await this.notificationsService.addNotificationsBulk(
          notifications.map(n => ({
            userId: n.userId,
            type: n.type,
            message: n.message,
            url: n.url,
            createdBy: n.createdBy,
          }))
        );
      }
    } catch (error) {
      console.error('Error creating grade notifications:', error);
    }
  }
}
