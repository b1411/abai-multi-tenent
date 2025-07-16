import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateLessonResultDto } from './dto/create-lesson-result.dto';
import { UpdateLessonResultDto } from './dto/update-lesson-result.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonResultsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.lessonResult.create({
      data: createLessonResultDto,
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
    const lessonScores = results.filter(r => r.lessonScore !== null).map(r => r.lessonScore!);
    const homeworkScores = results.filter(r => r.homeworkScore !== null).map(r => r.homeworkScore!);
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
        studyPlan: true,
        LessonResult: {
          where: { deletedAt: null },
          include: {
            Student: {
              include: {
                user: true,
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
      students: group.students,
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
}
