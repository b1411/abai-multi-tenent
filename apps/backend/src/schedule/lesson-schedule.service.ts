import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AILessonsResponseDto, GeneratedLessonDto } from '../ai-assistant/dto/ai-lessons-response.dto';

@Injectable()
export class LessonScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создает уроки на основе AI-генерации и сохраняет их в базу данных
   */
  async createLessonsFromAI(aiResponse: AILessonsResponseDto): Promise<any> {
    const createdLessons = [];
    const errors = [];

    for (const aiLesson of aiResponse.generatedLessons) {
      try {
        // Проверяем существование всех связанных сущностей
        await this.validateLessonData(aiLesson);

        // Создаем урок с связанными материалами и домашними заданиями
        const lesson = await this.createLessonWithRelations(aiLesson);
        createdLessons.push(lesson);
      } catch (error) {
        errors.push({
          lesson: aiLesson.name,
          error: error.message
        });
      }
    }

    return {
      created: createdLessons,
      errors: errors,
      summary: {
        total: aiResponse.generatedLessons.length,
        created: createdLessons.length,
        failed: errors.length
      }
    };
  }

  /**
   * Получает расписание на основе уроков для указанного периода
   */
  async getLessonBasedSchedule(filters: {
    startDate?: Date;
    endDate?: Date;
    groupIds?: number[];
    teacherIds?: number[];
    studyPlanIds?: number[];
    page?: number;
    pageSize?: number;
  }) {
    const {
      startDate,
      endDate,
      groupIds,
      teacherIds,
      studyPlanIds,
      page = 1,
      pageSize = 20
    } = filters;

    const whereClause: any = {
      deletedAt: null,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate
        }
      }),
      ...(studyPlanIds && {
        studyPlanId: { in: studyPlanIds }
      })
    };

    // Фильтрация по группам через учебный план
    if (groupIds) {
      whereClause.studyPlan = {
        group: {
          some: {
            id: { in: groupIds }
          }
        }
      };
    }

    // Фильтрация по преподавателям через учебный план
    if (teacherIds) {
      whereClause.studyPlan = {
        ...whereClause.studyPlan,
        teacherId: { in: teacherIds }
      };
    }

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { date: 'asc' },
          { studyPlan: { teacher: { user: { name: 'asc' } } } }
        ],
        include: {
          studyPlan: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      surname: true
                    }
                  }
                }
              },
              group: {
                select: {
                  id: true,
                  name: true,
                  courseNumber: true
                }
              }
            }
          },
          materials: {
            include: {
              quiz: true,
              additionalFiles: true
            }
          },
          homework: {
            include: {
              additionalFiles: true
            }
          }
        }
      }),
      this.prisma.lesson.count({ where: whereClause })
    ]);

    // Преобразуем уроки в формат расписания
    const scheduleItems = this.convertLessonsToScheduleFormat(lessons);

    return {
      items: scheduleItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * Получает расписание для конкретного пользователя
   */
  async getLessonScheduleForUser(
    userRole: string,
    userId: number,
    filters: any
  ) {
    switch (userRole) {
      case 'STUDENT':
        return this.getStudentLessonSchedule(userId, filters);
      case 'TEACHER':
        return this.getTeacherLessonSchedule(userId, filters);
      case 'PARENT':
        return this.getParentLessonSchedule(userId, filters);
      default:
        return this.getLessonBasedSchedule(filters);
    }
  }

  /**
   * Получает календарное представление уроков
   */
  async getLessonCalendar(filters: {
    startDate: Date;
    endDate: Date;
    groupIds?: number[];
    teacherIds?: number[];
  }) {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        ...(filters.groupIds && {
          studyPlan: {
            group: {
              some: {
                id: { in: filters.groupIds }
              }
            }
          }
        }),
        ...(filters.teacherIds && {
          studyPlan: {
            teacherId: { in: filters.teacherIds }
          }
        })
      },
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            group: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Группируем уроки по датам
    const calendarData = lessons.reduce((acc, lesson) => {
      const dateKey = lesson.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        id: lesson.id,
        name: lesson.name,
        time: this.extractTimeFromDescription(lesson.description),
        subject: lesson.studyPlan.name,
        teacher: `${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname}`,
        groups: lesson.studyPlan.group.map(g => g.name),
        description: lesson.description
      });
      return acc;
    }, {});

    return calendarData;
  }

  /**
   * Получает доступные уроки для планирования в расписании
   */
  async getAvailableLessons(filters: {
    search?: string;
    groupIds?: number[];
    teacherIds?: number[];
    subjectIds?: number[];
    startDate?: string;
    endDate?: string;
  }) {
    const whereClause: any = {
      deletedAt: null
    };

    // Поиск по названию урока или описанию
    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { studyPlan: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    // Фильтрация по учебным планам (предметам)
    if (filters.subjectIds && filters.subjectIds.length > 0) {
      whereClause.studyPlanId = { in: filters.subjectIds };
    }

    // Фильтрация по группам через учебный план
    if (filters.groupIds && filters.groupIds.length > 0) {
      whereClause.studyPlan = {
        ...whereClause.studyPlan,
        group: {
          some: {
            id: { in: filters.groupIds }
          }
        }
      };
    }

    // Фильтрация по преподавателям через учебный план
    if (filters.teacherIds && filters.teacherIds.length > 0) {
      whereClause.studyPlan = {
        ...whereClause.studyPlan,
        teacherId: { in: filters.teacherIds }
      };
    }

    // Фильтрация по датам
    if (filters.startDate && filters.endDate) {
      whereClause.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }

    const lessons = await this.prisma.lesson.findMany({
      where: whereClause,
      take: 50, // Ограничиваем количество результатов
      orderBy: [
        { date: 'asc' },
        { name: 'asc' }
      ],
      include: {
        studyPlan: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true
                  }
                }
              }
            },
            group: {
              select: {
                id: true,
                name: true,
                courseNumber: true
              }
            }
          }
        },
        materials: true,
        homework: true
      }
    });

    // Преобразуем в формат AvailableLesson
    return lessons.map(lesson => ({
      id: lesson.id,
      name: lesson.name,
      description: lesson.description || '',
      studyPlanId: lesson.studyPlanId,
      studyPlanName: lesson.studyPlan.name,
      groupId: lesson.studyPlan.group[0]?.id || 0,
      groupName: lesson.studyPlan.group.map(g => g.name).join(', '),
      teacherId: lesson.studyPlan.teacher.id,
      teacherName: `${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname}`,
      lessonNumber: 1, // Значение по умолчанию, так как поля нет в схеме
      topicNumber: 1, // Значение по умолчанию, так как поля нет в схеме
      difficulty: 'intermediate' as const, // Значение по умолчанию, так как поля нет в схеме
      estimatedDuration: 45, // Значение по умолчанию 45 минут
      materials: lesson.materials ? {
        lecture: lesson.materials.lecture || undefined,
        videoUrl: lesson.materials.videoUrl || undefined,
        presentationUrl: lesson.materials.presentationUrl || undefined,
        additionalNotes: undefined // Поля нет в схеме
      } : undefined,
      homework: lesson.homework ? {
        name: lesson.homework.name,
        description: lesson.homework.description || '',
        estimatedHours: 2 // Значение по умолчанию, так как поля нет в схеме
      } : undefined,
      isCompleted: false, // Значение по умолчанию, так как поля status нет в схеме
      scheduledDate: lesson.date?.toISOString()
    }));
  }

  /**
   * Получает статистику по урокам
   */
  async getLessonStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
    groupIds?: number[];
    teacherIds?: number[];
  }) {
    const whereClause: any = {
      deletedAt: null,
      ...(filters.startDate && filters.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      })
    };

    const [
      totalLessons,
      lessonsPerSubject,
      lessonsPerTeacher,
      lessonsPerGroup
    ] = await Promise.all([
      // Общее количество уроков
      this.prisma.lesson.count({ where: whereClause }),
      
      // Уроки по предметам
      this.prisma.lesson.groupBy({
        by: ['studyPlanId'],
        where: whereClause,
        _count: true,
        orderBy: { _count: { studyPlanId: 'desc' } }
      }),
      
      // Уроки по преподавателям
      this.prisma.lesson.findMany({
        where: whereClause,
        include: {
          studyPlan: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          }
        }
      }).then(lessons => {
        const grouped = lessons.reduce((acc, lesson) => {
          const teacherName = `${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname}`;
          acc[teacherName] = (acc[teacherName] || 0) + 1;
          return acc;
        }, {});
        return grouped;
      }),
      
      // Уроки по группам (через учебные планы)
      this.prisma.studyPlan.findMany({
        include: {
          group: true,
          lessons: {
            where: whereClause
          }
        }
      }).then(studyPlans => {
        const grouped = {};
        studyPlans.forEach(sp => {
          sp.group.forEach(group => {
            grouped[group.name] = (grouped[group.name] || 0) + sp.lessons.length;
          });
        });
        return grouped;
      })
    ]);

    return {
      totalLessons,
      lessonsPerSubject,
      lessonsPerTeacher,
      lessonsPerGroup
    };
  }

  // Приватные методы

  private async validateLessonData(aiLesson: GeneratedLessonDto) {
    // Проверяем учебный план
    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: aiLesson.studyPlanId }
    });
    if (!studyPlan) {
      throw new Error(`Study plan with ID ${aiLesson.studyPlanId} not found`);
    }

    // Проверяем преподавателя
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: aiLesson.teacherId }
    });
    if (!teacher) {
      throw new Error(`Teacher with ID ${aiLesson.teacherId} not found`);
    }

    // Проверяем аудитории (если указана)
    if (aiLesson.classroomId) {
      const classroom = await this.prisma.classroom.findUnique({
        where: { id: aiLesson.classroomId }
      });
      if (!classroom) {
        throw new Error(`Classroom with ID ${aiLesson.classroomId} not found`);
      }
    }
  }

  private async createLessonWithRelations(aiLesson: GeneratedLessonDto) {
    // Создаем урок в транзакции
    return await this.prisma.$transaction(async (tx) => {
      // Создаем основной урок
      const lesson = await tx.lesson.create({
        data: {
          name: aiLesson.name,
          date: new Date(aiLesson.date),
          studyPlanId: aiLesson.studyPlanId,
          description: aiLesson.description || `${aiLesson.name} - ${aiLesson.startTime}-${aiLesson.endTime}`
        }
      });

      // Создаем материалы если есть
      if (aiLesson.materials) {
        const materials = await tx.materials.create({
          data: {
            lecture: aiLesson.materials.lecture,
            videoUrl: aiLesson.materials.videoUrl,
            presentationUrl: aiLesson.materials.presentationUrl
          }
        });

        // Связываем материалы с уроком
        await tx.lesson.update({
          where: { id: lesson.id },
          data: { materialsId: materials.id }
        });
      }

      // Создаем домашнее задание если есть
      if (aiLesson.homework) {
        const homework = await tx.homework.create({
          data: {
            name: aiLesson.homework.name,
            description: aiLesson.homework.description,
            deadline: new Date(aiLesson.homework.deadline)
          }
        });

        // Связываем домашнее задание с уроком
        await tx.lesson.update({
          where: { id: lesson.id },
          data: { homeworkId: homework.id }
        });
      }

      return lesson;
    });
  }

  private convertLessonsToScheduleFormat(lessons: any[]) {
    return lessons.map(lesson => {
      const date = new Date(lesson.date);
      const dayOfWeek = this.getDayOfWeekName(date.getDay());
      const time = this.extractTimeFromDescription(lesson.description);
      
      return {
        id: lesson.id.toString(),
        day: dayOfWeek,
        date: lesson.date.toISOString().split('T')[0],
        startTime: time.start,
        endTime: time.end,
        classId: lesson.studyPlan.group.map(g => g.name).join(', '),
        subject: lesson.studyPlan.name,
        teacherId: lesson.studyPlan.teacher.id.toString(),
        teacherName: `${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname}`,
        roomId: 'Не указана', // TODO: добавить связь с аудиторией через Schedule
        type: 'lesson' as const,
        repeat: 'once' as const,
        status: date > new Date() ? 'upcoming' as const : 'completed' as const
      };
    });
  }

  private getDayOfWeekName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  }

  private extractTimeFromDescription(description: string): { start: string; end: string } {
    // Извлекаем время из описания урока
    const timeRegex = /(\d{2}:\d{2})-(\d{2}:\d{2})/;
    const match = description?.match(timeRegex);
    
    if (match) {
      return {
        start: match[1],
        end: match[2]
      };
    }
    
    // Возвращаем время по умолчанию
    return {
      start: '09:00',
      end: '10:00'
    };
  }

  private async getStudentLessonSchedule(userId: number, filters: any) {
    // Находим студента и его группу
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { group: true }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Получаем уроки для группы студента
    return this.getLessonBasedSchedule({
      ...filters,
      groupIds: [student.groupId]
    });
  }

  private async getTeacherLessonSchedule(userId: number, filters: any) {
    // Находим преподавателя
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Получаем уроки преподавателя
    return this.getLessonBasedSchedule({
      ...filters,
      teacherIds: [teacher.id]
    });
  }

  private async getParentLessonSchedule(userId: number, filters: any) {
    // Находим родителя и его детей
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          include: { group: true }
        }
      }
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const groupIds = parent.students.map(student => student.groupId);

    // Получаем уроки для групп детей
    return this.getLessonBasedSchedule({
      ...filters,
      groupIds
    });
  }
}
