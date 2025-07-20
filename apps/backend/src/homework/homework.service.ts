import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeworkDto, HomeworkSubmitDto, GradeHomeworkDto, HomeworkQueryDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) { }

  async create(createHomeworkDto: CreateHomeworkDto) {
    // Создаем материалы если есть описание
    let materialsId: number | undefined;
    if (createHomeworkDto.description) {
      const materials = await this.prisma.materials.create({
        data: {
          lecture: createHomeworkDto.description,
        }
      });
      materialsId = materials.id;
    }

    const homework = await this.prisma.homework.create({
      data: {
        name: createHomeworkDto.name,
        deadline: new Date(createHomeworkDto.deadline),
        materialsId: materialsId,
      },
    });

    // Если указан урок, привязываем ДЗ к уроку
    if (createHomeworkDto.lessonId) {
      await this.prisma.lesson.update({
        where: { id: createHomeworkDto.lessonId },
        data: { homeworkId: homework.id }
      });
    }

    return this.prisma.homework.findUnique({
      where: { id: homework.id },
      include: {
        lesson: {
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
        materials: {
          include: {
            additionalFiles: true
          }
        },
        additionalFiles: true,
        studentsSubmissions: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            fileUrl: true
          }
        }
      }
    });
  }

  async findAll(filters: HomeworkQueryDto) {
    const {
      search,
      lessonId,
      studentId,
      teacherId,
      page = 1,
      limit = 10,
      sortBy = 'deadline',
      order = 'asc'
    } = filters;

    const where: Prisma.HomeworkWhereInput = {
      deletedAt: null,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }),
      ...(lessonId && {
        lesson: {
          id: lessonId
        }
      }),
      ...(teacherId && {
        lesson: {
          studyPlan: {
            teacherId: teacherId
          }
        }
      }),
      ...(studentId && {
        studentsSubmissions: {
          some: {
            studentId: studentId
          }
        }
      })
    };

    const orderBy: Prisma.HomeworkOrderByWithRelationInput = {};
    orderBy[sortBy] = order;

    const [data, total] = await Promise.all([
      this.prisma.homework.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lesson: {
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
          materials: {
            include: {
              additionalFiles: true
            }
          },
          additionalFiles: true,
          studentsSubmissions: {
            include: {
              student: {
                include: {
                  user: true
                }
              },
              fileUrl: true,
              LessonResult: true
            }
          }
        }
      }),
      this.prisma.homework.count({ where })
    ]);

    return {
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    };
  }

  async findOne(id: number) {
    const homework = await this.prisma.homework.findUnique({
      where: {
        id,
        deletedAt: null
      },
      include: {
        lesson: {
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
        materials: {
          include: {
            additionalFiles: true,
            quiz: true
          }
        },
        additionalFiles: true,
        studentsSubmissions: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            fileUrl: true,
            LessonResult: true
          }
        }
      }
    });

    if (!homework) {
      throw new NotFoundException('Домашнее задание не найдено');
    }

    return homework;
  }

  async update(id: number, updateHomeworkDto: UpdateHomeworkDto) {
    const homework = await this.findOne(id);

    // Обновляем или создаем материалы если есть описание
    if (updateHomeworkDto.description !== undefined) {
      if (homework.materialsId) {
        // Обновляем существующие материалы
        await this.prisma.materials.update({
          where: { id: homework.materialsId },
          data: { lecture: updateHomeworkDto.description }
        });
      } else if (updateHomeworkDto.description) {
        // Создаем новые материалы
        const materials = await this.prisma.materials.create({
          data: { lecture: updateHomeworkDto.description }
        });
        // Обновляем homework с новым materialsId
        await this.prisma.homework.update({
          where: { id },
          data: { materialsId: materials.id }
        });
      }
    }

    return this.prisma.homework.update({
      where: { id },
      data: {
        ...(updateHomeworkDto.name && { name: updateHomeworkDto.name }),
        ...(updateHomeworkDto.deadline && { deadline: new Date(updateHomeworkDto.deadline) }),
        updatedAt: new Date()
      },
      include: {
        lesson: {
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
        materials: {
          include: {
            additionalFiles: true
          }
        },
        additionalFiles: true,
        studentsSubmissions: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            fileUrl: true
          }
        }
      }
    });
  }

  async remove(id: number) {
    const homework = await this.findOne(id);

    return this.prisma.homework.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
  }

  async getHomeworksByLesson(lessonId: number) {
    return this.prisma.homework.findMany({
      where: {
        lesson: {
          id: lessonId
        },
        deletedAt: null
      },
      include: {
        materials: {
          include: {
            additionalFiles: true
          }
        },
        additionalFiles: true,
        studentsSubmissions: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            fileUrl: true
          }
        }
      }
    });
  }

  async submitHomework(homeworkId: number, studentId: number, submitDto: HomeworkSubmitDto) {
    const homework = await this.findOne(homeworkId);

    // Проверяем дедлайн
    if (new Date() > homework.deadline) {
      throw new BadRequestException('Срок сдачи домашнего задания истек');
    }

    // Проверяем, не отправлял ли уже студент это задание
    const existingSubmission = await this.prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId,
        deletedAt: null
      }
    });

    if (existingSubmission) {
      throw new BadRequestException('Вы уже отправили это домашнее задание');
    }

    // Проверяем, существует ли файл
    const file = await this.prisma.file.findUnique({
      where: { id: submitDto.fileId }
    });

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    return this.prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId,
        fileId: submitDto.fileId,
        comment: submitDto.comment,
        submittedAt: new Date()
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        homework: true,
        fileUrl: true
      }
    });
  }

  async getHomeworkSubmissions(homeworkId: number) {
    const homework = await this.findOne(homeworkId);

    return this.prisma.homeworkSubmission.findMany({
      where: {
        homeworkId,
        deletedAt: null
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        fileUrl: true,
        LessonResult: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
  }

  async gradeHomework(submissionId: number, gradeDto: GradeHomeworkDto, teacherId: number) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            lesson: {
              include: {
                studyPlan: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      throw new NotFoundException('Отправка домашнего задания не найдена');
    }

    // Проверяем права доступа (только преподаватель, который ведет урок)
    if (submission.homework.lesson?.studyPlan.teacherId !== teacherId) {
      throw new ForbiddenException('У вас нет прав для оценки этого задания');
    }

    // Обновляем или создаем результат урока
    const lessonResult = await this.prisma.lessonResult.upsert({
      where: {
        studentId_lessonId: {
          studentId: submission.studentId,
          lessonId: submission.homework.lesson?.id || 0
        }
      },
      update: {
        homeworkScore: gradeDto.score,
        homeworkScoreComment: gradeDto.comment,
        updatedAt: new Date()
      },
      create: {
        studentId: submission.studentId,
        lessonId: submission.homework.lesson?.id || 0,
        homeworkId: submission.id,
        homeworkScore: gradeDto.score,
        homeworkScoreComment: gradeDto.comment
      }
    });

    return this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        updatedAt: new Date()
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        homework: true,
        fileUrl: true,
        LessonResult: true
      }
    });
  }

  async getHomeworkStats(filters: { lessonId?: number; studentId?: number; teacherId?: number }) {
    const { lessonId, studentId, teacherId } = filters;

    const where: Prisma.HomeworkWhereInput = {
      deletedAt: null,
      ...(lessonId && {
        lesson: {
          id: lessonId
        }
      }),
      ...(teacherId && {
        lesson: {
          studyPlan: {
            teacherId: teacherId
          }
        }
      })
    };

    const total = await this.prisma.homework.count({ where });

    // Если запрашивается статистика для конкретного студента
    if (studentId) {
      const studentHomeworks = await this.prisma.homework.findMany({
        where,
        include: {
          studentsSubmissions: {
            where: {
              studentId: studentId,
              deletedAt: null
            },
            include: {
              LessonResult: true
            }
          }
        }
      });

      const now = new Date();
      let pending = 0;
      let submitted = 0;
      let graded = 0;
      let overdue = 0;

      studentHomeworks.forEach(homework => {
        const submission = homework.studentsSubmissions[0];

        if (submission) {
          if (submission.LessonResult?.homeworkScore !== null) {
            graded++;
          } else {
            submitted++;
          }
        } else {
          if (now > homework.deadline) {
            overdue++;
          } else {
            pending++;
          }
        }
      });

      return { total, pending, submitted, graded, overdue };
    }

    // Общая статистика (для преподавателей/админов)
    const [submissions, overdueCount] = await Promise.all([
      this.prisma.homeworkSubmission.groupBy({
        by: ['homeworkId'],
        where: {
          homework: where,
          deletedAt: null
        },
        _count: true
      }),
      this.prisma.homework.count({
        where: {
          ...where,
          deadline: {
            lt: new Date()
          }
        }
      })
    ]);

    const submittedCount = submissions.length;
    const gradedCount = await this.prisma.lessonResult.count({
      where: {
        homeworkScore: {
          not: null
        },
        Homework: {
          homework: where
        }
      }
    });

    return {
      total,
      pending: total - submittedCount - overdueCount,
      submitted: submittedCount - gradedCount,
      graded: gradedCount,
      overdue: overdueCount
    };
  }
}
