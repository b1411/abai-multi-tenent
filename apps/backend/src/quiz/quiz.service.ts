import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizSubmissionDto } from './dto/create-quiz-submission.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateQueryDto, PaginateResponseDto, PaginateMetaDto } from '../common/dtos/paginate.dto';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async create(createQuizDto: CreateQuizDto) {
    const { questions, ...quizData } = createQuizDto;
    
    const quiz = await this.prisma.quiz.create({
      data: {
        ...quizData,
        startDate: createQuizDto.startDate ? new Date(createQuizDto.startDate) : null,
        endDate: createQuizDto.endDate ? new Date(createQuizDto.endDate) : null,
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
        submissions: true,
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
          submissions: {
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

  async findOne(id: number) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          where: { deletedAt: null },
          include: {
            answers: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, name: true, surname: true },
                },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
        materials: {
          include: {
            lesson: {
              select: { name: true, studyPlan: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  async getQuestions(quizId: number) {
    await this.findOne(quizId); // Проверяем существование теста

    return this.prisma.question.findMany({
      where: { quizId, deletedAt: null },
      include: {
        answers: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addQuestion(quizId: number, createQuestionDto: CreateQuestionDto) {
    await this.findOne(quizId); // Проверяем существование теста

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

  async getQuizSubmissions(quizId: number) {
    await this.findOne(quizId); // Проверяем существование теста

    return this.prisma.quizSubmission.findMany({
      where: { quizId, deletedAt: null },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, surname: true, email: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getStudentSubmissions(studentId: number) {
    return this.prisma.quizSubmission.findMany({
      where: { studentId, deletedAt: null },
      include: {
        quiz: {
          select: { id: true, name: true, maxScore: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async submitQuiz(quizId: number, submissionDto: CreateQuizSubmissionDto) {
    const quiz = await this.findOne(quizId);

    // Проверяем, активен ли тест
    if (!quiz.isActive) {
      throw new BadRequestException('Quiz is not active');
    }

    // Проверяем временные рамки
    const now = new Date();
    if (quiz.startDate && now < quiz.startDate) {
      throw new BadRequestException('Quiz has not started yet');
    }
    if (quiz.endDate && now > quiz.endDate) {
      throw new BadRequestException('Quiz has already ended');
    }

    // Проверяем, не отправлял ли студент уже ответы
    const existingSubmission = await this.prisma.quizSubmission.findFirst({
      where: {
        quizId,
        studentId: submissionDto.studentId,
        deletedAt: null,
      },
    });

    if (existingSubmission) {
      throw new ConflictException('Student has already submitted answers for this quiz');
    }

    // Автоматическая оценка (простая логика)
    let calculatedScore = null;
    if (submissionDto.answers && quiz.questions.length > 0) {
      calculatedScore = await this.calculateScore(quizId, submissionDto.answers);
    }

    const submission = await this.prisma.quizSubmission.create({
      data: {
        quizId,
        studentId: submissionDto.studentId,
        answers: submissionDto.answers,
        score: submissionDto.score || calculatedScore,
        feedback: submissionDto.feedback,
      },
      include: {
        quiz: {
          select: { name: true, maxScore: true },
        },
        student: {
          include: {
            user: {
              select: { name: true, surname: true },
            },
          },
        },
      },
    });

    return submission;
  }

  private async calculateScore(quizId: number, answersJson: string): Promise<number> {
    try {
      const answers = JSON.parse(answersJson);
      const questions = await this.prisma.question.findMany({
        where: { quizId, deletedAt: null },
        include: {
          answers: {
            where: { isCorrect: true },
          },
        },
      });

      let correctAnswers = 0;
      const totalQuestions = questions.length;

      for (const question of questions) {
        const questionId = question.id.toString();
        const userAnswer = answers[questionId];
        
        if (question.type === 'TEXT') {
          // Для текстовых вопросов не можем автоматически оценить
          continue;
        }

        const correctAnswerNames = question.answers.map(a => a.name);
        
        if (question.type === 'SINGLE_CHOICE') {
          if (correctAnswerNames.includes(userAnswer)) {
            correctAnswers++;
          }
        } else if (question.type === 'MULTIPLE_CHOICE') {
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          const isCorrect = correctAnswerNames.length === userAnswers.length &&
            correctAnswerNames.every(answer => userAnswers.includes(answer));
          if (isCorrect) {
            correctAnswers++;
          }
        }
      }

      return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getQuizStatistics(quizId: number) {
    await this.findOne(quizId);

    const [
      totalSubmissions,
      averageScore,
      submissionStats,
      questionStats,
    ] = await Promise.all([
      this.prisma.quizSubmission.count({
        where: { quizId, deletedAt: null },
      }),
      this.prisma.quizSubmission.aggregate({
        where: { quizId, deletedAt: null, score: { not: null } },
        _avg: { score: true },
      }),
      this.prisma.quizSubmission.groupBy({
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
      totalSubmissions,
      averageScore: averageScore._avg.score || 0,
      totalQuestions: questionStats,
      scoreDistribution: submissionStats,
    };
  }

  async update(id: number, updateQuizDto: UpdateQuizDto) {
    await this.findOne(id);

    const { questions, ...quizUpdateData } = updateQuizDto;

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

  async toggleActive(id: number, isActive: boolean) {
    await this.findOne(id);

    return this.prisma.quiz.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

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
}
