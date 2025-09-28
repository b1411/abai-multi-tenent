import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateQueryDto, PaginateResponseDto, PaginateMetaDto } from '../common/dtos/paginate.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService, private notificationsService: NotificationsService) {}

  async create(createQuizDto: CreateQuizDto) {
    const { questions, ...quizData } = createQuizDto;
    
    const quiz = await this.prisma.quiz.create({
      data: {
        ...quizData,
        startDate: createQuizDto.startDate ? new Date(createQuizDto.startDate) : null,
        endDate: createQuizDto.endDate ? new Date(createQuizDto.endDate) : null,
        questions: questions ? {
          create: questions.map(q => ({
            name: q.question,
            type: q.multipleAnswers ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
            answers: {
              create: q.options.map((opt, index) => ({
                name: opt,
                isCorrect: Array.isArray(q.correctAnswer)
                  ? q.correctAnswer.includes(index)
                  : q.correctAnswer === index,
              })),
            },
          })),
        } : undefined,
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return quiz;
  }

  async findAll(paginateQuery: PaginateQueryDto): Promise<PaginateResponseDto<any>> {
    const { page, limit, sortBy, order, search } = paginateQuery;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [quizzes, totalItems] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          questions: {
            where: { deletedAt: null },
            select: { id: true },
          },
          materials: {
            select: { id: true, lesson: { select: { name: true } } },
          },
        },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    const meta: PaginateMetaDto = {
      totalItems,
      itemCount: quizzes.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };

    return { data: quizzes, meta };
  }

  async findActive() {
    const now = new Date();
    
    return this.prisma.quiz.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
        ],
      },
      include: {
        questions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        materials: {
          select: {
            lesson: {
              select: { name: true, studyPlan: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userRole: string) {
    const includeOptions: any = {
      materials: {
        include: {
          lesson: {
            select: { name: true, studyPlan: { select: { name: true } } },
          },
        },
      },
    };

    if (userRole !== 'STUDENT') {
      includeOptions.questions = {
        where: { deletedAt: null },
        include: {
          answers: true,
        },
        orderBy: { createdAt: 'asc' },
      };
    }

    const quiz = await this.prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: includeOptions,
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (userRole === 'STUDENT') {
      const questionCount = await this.prisma.question.count({
        where: { quizId: id, deletedAt: null },
      });
      (quiz as any).questions = { length: questionCount };
    }

    return quiz;
  }

  async getQuestions(quizId: number) {
    await this.findOne(quizId, 'TEACHER'); // Проверяем существование теста

    return this.prisma.question.findMany({
      where: { quizId, deletedAt: null },
      include: {
        answers: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addQuestion(quizId: number, createQuestionDto: CreateQuestionDto) {
    await this.findOne(quizId, 'TEACHER'); // Проверяем существование теста

    const question = await this.prisma.question.create({
      data: {
        quizId,
        name: createQuestionDto.name,
        type: createQuestionDto.type,
        answers: createQuestionDto.answers ? {
          create: createQuestionDto.answers,
        } : undefined,
      },
      include: {
        answers: true,
      },
    });

    return question;
  }

  async getQuizStatistics(quizId: number) {
    await this.findOne(quizId, 'TEACHER');

    const [totalAttempts, averageScore, attemptsStats, questionStats] =
      await Promise.all([
        this.prisma.quizAttempt.count({
          where: { quizId, deletedAt: null, endTime: { not: null } },
        }),
        this.prisma.quizAttempt.aggregate({
          where: { quizId, deletedAt: null, score: { not: null } },
          _avg: { score: true },
        }),
        this.prisma.quizAttempt.groupBy({
          by: ['score'],
          where: { quizId, deletedAt: null, score: { not: null } },
          _count: true,
          orderBy: { score: 'asc' },
        }),
        this.prisma.question.count({
          where: { quizId, deletedAt: null },
        }),
      ]);

    return {
      totalAttempts,
      averageScore: averageScore._avg.score || 0,
      totalQuestions: questionStats,
      scoreDistribution: attemptsStats,
    };
  }

  async update(id: number, updateQuizDto: UpdateQuizDto) {
    await this.findOne(id, 'TEACHER');

    const { questions, ...quizUpdateData } = updateQuizDto;

    // TODO: Handle question updates more gracefully (e.g., update, create, delete)
    if (questions) {
      await this.prisma.question.deleteMany({ where: { quizId: id } });
      await this.prisma.question.createMany({
        data: questions.map(q => ({
          quizId: id,
          name: q.question,
          type: q.multipleAnswers ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
        })),
      });
    }

    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...quizUpdateData,
        startDate: updateQuizDto.startDate ? new Date(updateQuizDto.startDate) : undefined,
        endDate: updateQuizDto.endDate ? new Date(updateQuizDto.endDate) : undefined,
      },
      include: {
        questions: {
          where: { deletedAt: null },
          include: {
            answers: true,
          },
        },
      },
    });

    return quiz;
  }

  async toggleActive(id: number, isActive: boolean, userId: number) {
    const quiz = await this.findOne(id, 'TEACHER');

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Если тест стал активным, отправляем уведомления студентам
    if (isActive && !quiz.isActive) {
      const students = await this.prisma.student.findMany({
        where: { deletedAt: null },
        include: { user: true }
      });

      const studentIds = students.map(s => s.userId);
      if (studentIds.length > 0) {
        await this.notificationsService.notifyNewQuiz(
          userId,
          studentIds,
          quiz.name
        );
      }
    }

    return updatedQuiz;
  }

  async remove(id: number) {
    await this.findOne(id, 'TEACHER');

    return this.prisma.quiz.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
    });
  }

  async removeQuestion(questionId: number) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
    });
  }

  async getStudentAttemptsByQuiz(studentId: number, quizId: number) {
    return this.prisma.quizAttempt.findMany({
      where: {
        studentId,
        quizId,
        deletedAt: null,
      },
      include: {
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
        studentAnswers: {
          include: {
            question: true,
            answer: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async getAllAttemptsByQuiz(quizId: number) {
    return this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        deletedAt: null,
      },
      include: {
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
        studentAnswers: {
          include: {
            question: true,
            answer: true,
          },
        },
        quiz: {
          select: {
            id: true,
            name: true,
            maxScore: true,
          },
        },
      },
      orderBy: [
        { startTime: 'desc' },
        { student: { user: { surname: 'asc' } } },
      ],
    });
  }

  async getMyAttempts(userId: number) {
    // Получаем student по userId
    const student = await this.prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      return [];
    }

    return this.prisma.quizAttempt.findMany({
      where: {
        studentId: student.id,
        deletedAt: null,
      },
      include: {
        quiz: {
          select: {
            id: true,
            name: true,
            maxScore: true,
          },
        },
        studentAnswers: {
          include: {
            question: true,
            answer: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async getQuizStatusForStudent(quizId: number, userId: number) {
    // Получаем student по userId
    const student = await this.prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Проверяем есть ли попытка для этого теста
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: student.id,
        deletedAt: null,
      },
      include: {
        quiz: {
          select: {
            id: true,
            name: true,
            maxScore: true,
          },
        },
      },
    });

    return {
      hasAttempt: !!attempt,
      attempt: attempt || null,
      canRetake: false, // Всегда false, так как повторное прохождение запрещено
    };
  }
}
