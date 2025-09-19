import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeworkDto, HomeworkSubmitDto, GradeHomeworkDto, HomeworkQueryDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) { }

  async create(createHomeworkDto: CreateHomeworkDto) {
    const homework = await this.prisma.homework.create({
      data: {
        name: createHomeworkDto.name,
        description: createHomeworkDto.description,
        deadline: new Date(createHomeworkDto.deadline),
      },
    });

    // Если указан урок, привязываем ДЗ к уроку
    if (createHomeworkDto.lessonId) {
      await this.prisma.lesson.update({
        where: { id: createHomeworkDto.lessonId },
        data: { homeworkId: homework.id }
      });
    }

    // Привязываем дополнительные файлы к домашнему заданию
    if (createHomeworkDto.additionalFileIds && createHomeworkDto.additionalFileIds.length > 0) {
      await this.prisma.file.updateMany({
        where: {
          id: { in: createHomeworkDto.additionalFileIds },
          deletedAt: null
        },
        data: {
          homeworkId: homework.id
        }
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

    // Обновляем дополнительные файлы, если они указаны
    if (updateHomeworkDto.additionalFileIds !== undefined) {
      // Сначала отвязываем все старые файлы от этого домашнего задания
      await this.prisma.file.updateMany({
        where: {
          homeworkId: id,
          deletedAt: null
        },
        data: {
          homeworkId: null
        }
      });

      // Затем привязываем новые файлы, если они есть
      if (updateHomeworkDto.additionalFileIds.length > 0) {
        await this.prisma.file.updateMany({
          where: {
            id: { in: updateHomeworkDto.additionalFileIds },
            deletedAt: null
          },
          data: {
            homeworkId: id
          }
        });
      }
    }

    return this.prisma.homework.update({
      where: { id },
      data: {
        ...(updateHomeworkDto.name && { name: updateHomeworkDto.name }),
        ...(updateHomeworkDto.description !== undefined && { description: updateHomeworkDto.description }),
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

  async submitHomework(homeworkId: number, userId: number, submitDto: HomeworkSubmitDto) {
    const homework = await this.findOne(homeworkId);

    // Находим студента по userId
    const student = await this.prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    // Проверяем дедлайн
    if (new Date() > homework.deadline) {
      throw new BadRequestException('Срок сдачи домашнего задания истек');
    }

    // Проверяем, не отправлял ли уже студент это задание
    const existingSubmission = await this.prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
        deletedAt: null
      },
      include: {
        LessonResult: true
      }
    });

    if (existingSubmission) {
      // Если работа уже оценена, нельзя её изменить
      if (existingSubmission.LessonResult?.homeworkScore !== undefined && 
          existingSubmission.LessonResult?.homeworkScore !== null) {
        throw new BadRequestException('Нельзя изменить работу, которая уже оценена преподавателем.');
      }
      
      // Иначе автоматически обновляем существующую отправку
      return this.updateHomeworkSubmission(homeworkId, userId, submitDto);
    }

    // Проверяем, существует ли основной файл
    const file = await this.prisma.file.findUnique({
      where: { id: submitDto.fileId }
    });

    if (!file) {
      throw new NotFoundException('Основной файл не найден');
    }

    // Проверяем дополнительные файлы, если они указаны
    if (submitDto.additionalFileIds && submitDto.additionalFileIds.length > 0) {
      const additionalFiles = await this.prisma.file.findMany({
        where: {
          id: { in: submitDto.additionalFileIds },
          deletedAt: null
        }
      });

      if (additionalFiles.length !== submitDto.additionalFileIds.length) {
        throw new BadRequestException('Некоторые дополнительные файлы не найдены');
      }
    }

    // Создаем отправку домашнего задания
    const submission = await this.prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId: student.id,
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
        fileUrl: true,
        LessonResult: true
      }
    });

    // TODO: Привязать дополнительные файлы к отправке
    // Пока что просто возвращаем отправку, дополнительные файлы будут доступны через их ID

    return submission;
  }

  async updateHomeworkSubmission(homeworkId: number, userId: number, submitDto: HomeworkSubmitDto) {
    const homework = await this.findOne(homeworkId);

    // Находим студента по userId
    const student = await this.prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    // Проверяем дедлайн
    if (new Date() > homework.deadline) {
      throw new BadRequestException('Срок сдачи домашнего задания истек. Нельзя изменить работу после дедлайна.');
    }

    // Находим существующую отправку
    const existingSubmission = await this.prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
        deletedAt: null
      }
    });

    if (!existingSubmission) {
      throw new BadRequestException('Отправка не найдена. Сначала отправьте работу.');
    }

    // Проверяем, не оценена ли уже работа
    const lessonResult = await this.prisma.lessonResult.findFirst({
      where: {
        homeworkId: existingSubmission.id,
        homeworkScore: { not: null }
      }
    });

    if (lessonResult) {
      throw new BadRequestException('Нельзя изменить работу, которая уже оценена преподавателем.');
    }

    // Проверяем, существует ли новый основной файл
    const file = await this.prisma.file.findUnique({
      where: { id: submitDto.fileId }
    });

    if (!file) {
      throw new NotFoundException('Основной файл не найден');
    }

    // Проверяем дополнительные файлы, если они указаны
    if (submitDto.additionalFileIds && submitDto.additionalFileIds.length > 0) {
      const additionalFiles = await this.prisma.file.findMany({
        where: {
          id: { in: submitDto.additionalFileIds },
          deletedAt: null
        }
      });

      if (additionalFiles.length !== submitDto.additionalFileIds.length) {
        throw new BadRequestException('Некоторые дополнительные файлы не найдены');
      }
    }

    // Обновляем отправку домашнего задания
    const updatedSubmission = await this.prisma.homeworkSubmission.update({
      where: { id: existingSubmission.id },
      data: {
        fileId: submitDto.fileId,
        comment: submitDto.comment,
        updatedAt: new Date()
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

    return updatedSubmission;
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

  async gradeHomework(submissionId: number, gradeDto: GradeHomeworkDto, teacherId: number, userRole?: string) {
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

    // Проверяем права доступа (преподаватель урока или админ)
    
    if (!submission.homework.lesson) {
      throw new BadRequestException('Домашнее задание не привязано к уроку');
    }

    // Обновляем или создаем результат урока
    const lessonResult = await this.prisma.lessonResult.upsert({
      where: {
        homeworkId: submission.id
      },
      update: {
        homeworkScore: gradeDto.score,
        homeworkScoreComment: gradeDto.comment,
        updatedAt: new Date()
      },
      create: {
        studentId: submission.studentId,
        lessonId: submission.homework.lesson.id,
        homeworkId: submission.id,
        homeworkScore: gradeDto.score,
        homeworkScoreComment: gradeDto.comment
      }
    });

    // Обновляем статус отправки на CHECKED
    await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'CHECKED',
        updatedAt: new Date()
      }
    });

    // Возвращаем обновленную отправку с результатом урока
    return this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
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

    // Если запрашивается статистика для конкретного студента
    if (studentId) {
      // Сначала находим студента для получения его группы
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { groupId: true }
      });

      if (!student) {
        return { total: 0, pending: 0, submitted: 0, graded: 0, overdue: 0 };
      }

      const where: Prisma.HomeworkWhereInput = {
        deletedAt: null,
        lesson: {
          studyPlan: {
            group: {
              some: {
                id: student.groupId
              }
            }
          }
        },
        ...(lessonId && {
          lesson: {
            id: lessonId
          }
        })
      };

      const studentHomeworks = await this.prisma.homework.findMany({
        where,
        include: {
          studentsSubmissions: {
            where: {
              studentId: studentId,
              deletedAt: null
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
          // Используем status для определения состояния
          if (submission.status === 'CHECKED') {
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

      return { total: studentHomeworks.length, pending, submitted, graded, overdue };
    }

    // Общая статистика (для преподавателей/админов)
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

    // Получаем все отправки для домашних заданий
    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: {
        homework: where,
        deletedAt: null
      },
      select: {
        homeworkId: true,
        status: true
      }
    });

    // Группируем отправки по статусу
    const submissionsByStatus = submissions.reduce((acc, submission) => {
      if (!acc[submission.homeworkId]) {
        acc[submission.homeworkId] = { total: 0, checked: 0, pending: 0 };
      }
      acc[submission.homeworkId].total++;
      if (submission.status === 'CHECKED') {
        acc[submission.homeworkId].checked++;
      } else {
        acc[submission.homeworkId].pending++;
      }
      return acc;
    }, {} as Record<number, { total: number, checked: number, pending: number }>);

    // Подсчитываем просроченные задания
    const overdueCount = await this.prisma.homework.count({
      where: {
        ...where,
        deadline: {
          lt: new Date()
        }
      }
    });

    // Подсчитываем статистику
    const submittedHomeworks = Object.keys(submissionsByStatus).length;
    const gradedHomeworks = Object.values(submissionsByStatus).filter(
      status => status.checked > 0
    ).length;

    return {
      total,
      pending: total - submittedHomeworks,
      submitted: submittedHomeworks - gradedHomeworks,
      graded: gradedHomeworks,
      overdue: overdueCount
    };
  }

  async findStudentHomework(filters: HomeworkQueryDto, userId: number) {
    const {
      search,
      lessonId,
      page = 1,
      limit = 10,
      sortBy = 'deadline',
      order = 'asc'
    } = filters;

    // Сначала находим студента по userId
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { groupId: true }
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    const where: Prisma.HomeworkWhereInput = {
      deletedAt: null,
      lesson: {
        studyPlan: {
          group: {
            some: {
              id: student.groupId
            }
          }
        }
      },
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
}
