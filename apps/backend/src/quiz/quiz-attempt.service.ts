import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { QuizAttemptStatus } from 'generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuizAttemptService {
  constructor(private readonly prisma: PrismaService, private readonly notificationsService: NotificationsService) { }

  async startAttempt(quizId: number, userId: number) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    // Проверяем, есть ли уже попытка у этого студента для этого теста
    const existingAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: student.id,
        deletedAt: null,
      },
      include: {
        quiz: {
          include: {
            questions: {
              where: { deletedAt: null },
              include: {
                answers: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        studentAnswers: {
          include: {
            answer: true,
          },
        },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.status === QuizAttemptStatus.COMPLETED) {
        throw new ForbiddenException('Вы уже проходили этот тест. Повторное прохождение невозможно.');
      }
      // Проверяем время, если истекло, завершаем попытку
      if (existingAttempt.quiz.duration && existingAttempt.startTime) {
        const elapsed = (new Date().getTime() - existingAttempt.startTime.getTime()) / 1000 / 60; // в минутах
        if (elapsed >= existingAttempt.quiz.duration) {
          await this.prisma.quizAttempt.update({
            where: { id: existingAttempt.id },
            data: {
              endTime: new Date(),
              status: QuizAttemptStatus.COMPLETED,
              score: 0, // или рассчитать
            },
          });
          throw new ForbiddenException('Время теста истекло.');
        }
      }
      // Возвращаем существующую незавершенную попытку
      return existingAttempt;
    }

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          where: { deletedAt: null },
          include: {
            answers: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!quiz || !quiz.isActive) {
      throw new NotFoundException('Тест не найден или неактивен');
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: student.id,
      },
    });

    return {
      ...attempt,
      quiz,
    };
  }

  async answerQuestion(dto: AnswerQuestionDto, userId: number) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: dto.quizAttemptId },
    });

    if (!attempt || attempt.studentId !== student.id) {
      throw new ForbiddenException('Вы не можете отвечать на вопросы этой попытки');
    }

    if (attempt.endTime) {
      throw new ForbiddenException('Попытка уже завершена');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });

    if (!question) {
      throw new NotFoundException('Вопрос не найден');
    }

    // Сохраняем ответы
    if (dto.answerIds && dto.answerIds.length > 0) {
      // Для множественного выбора: удаляем существующие и создаем новые в транзакции
      return this.prisma.$transaction(async (tx) => {
        await tx.studentAnswer.deleteMany({
          where: {
            quizAttemptId: dto.quizAttemptId,
            questionId: dto.questionId,
          },
        });
        const answers = dto.answerIds.map(answerId => ({
          quizAttemptId: dto.quizAttemptId,
          questionId: dto.questionId,
          answerId,
        }));
        return tx.studentAnswer.createMany({
          data: answers,
        });
      });
    } else if (dto.answerId) {
      // Для одиночного выбора
      return this.prisma.studentAnswer.upsert({
        where: {
          quizAttemptId_questionId_answerId: {
            quizAttemptId: dto.quizAttemptId,
            questionId: dto.questionId,
            answerId: dto.answerId
          },
        },
        update: {
          answerId: dto.answerId,
          textAnswer: null,
        },
        create: {
          quizAttemptId: dto.quizAttemptId,
          questionId: dto.questionId,
          answerId: dto.answerId,
        },
      });
    } else if (dto.textAnswer) {
      // Для текстового ответа
      return this.prisma.studentAnswer.upsert({
        where: {
          quizAttemptId_questionId_answerId: {
            quizAttemptId: dto.quizAttemptId,
            questionId: dto.questionId,
            answerId: dto.answerId
          },
        },
        update: {
          textAnswer: dto.textAnswer,
          answerId: null,
        },
        create: {
          quizAttemptId: dto.quizAttemptId,
          questionId: dto.questionId,
          textAnswer: dto.textAnswer,
        },
      });
    } else {
      throw new ForbiddenException('Необходимо предоставить ответ');
    }
  }

  async finishAttempt(attemptId: number, userId: number) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Студент не найден');
    }

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        studentAnswers: {
          include: {
            question: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Попытка не найдена');
    }

    if (attempt.studentId !== student.id) {
      throw new ForbiddenException('Вы не можете завершить эту попытку');
    }

    if (attempt.status === QuizAttemptStatus.COMPLETED) {
      throw new ForbiddenException('Попытка уже завершена');
    }

    const endTime = new Date();
    let score = 0;

    const studentAnswerUpdates = [];

    // Группируем ответы по вопросам
    const answersByQuestion = attempt.studentAnswers.reduce((acc, sa) => {
      if (!acc[sa.questionId]) {
        acc[sa.questionId] = [];
      }
      acc[sa.questionId].push(sa);
      return acc;
    }, {} as Record<number, typeof attempt.studentAnswers>);

    for (const question of attempt.quiz.questions) {
      const studentAnswersForQuestion = answersByQuestion[question.id] || [];
      let isCorrect = false;

      if (question.type === 'TEXT') {
        // Для текстовых вопросов считаем правильными, если есть ответ
        isCorrect = studentAnswersForQuestion.some(sa => sa.textAnswer?.trim());
      } else if (question.type === 'MULTIPLE_CHOICE') {
        // Для множественного выбора
        const correctAnswers = question.answers.filter(a => a.isCorrect);
        const studentAnswerIds = studentAnswersForQuestion
          .filter(sa => sa.answerId)
          .map(sa => sa.answerId);

        // Проверяем, что выбраны все правильные ответы и нет неправильных
        isCorrect = correctAnswers.length > 0 &&
          correctAnswers.every(ca => studentAnswerIds.includes(ca.id)) &&
          studentAnswerIds.every(saId => correctAnswers.some(ca => ca.id === saId));
      } else {
        // Для одиночного выбора
        const correctAnswer = question.answers.find(a => a.isCorrect);
        isCorrect = studentAnswersForQuestion.some(sa => sa.answerId === correctAnswer?.id);
      }

      if (isCorrect) {
        score++;
      }

      // Обновляем isCorrect для всех ответов на этот вопрос
      for (const sa of studentAnswersForQuestion) {
        studentAnswerUpdates.push(
          this.prisma.studentAnswer.update({
            where: { id: sa.id },
            data: { isCorrect },
          }),
        );
      }
    }

    await this.prisma.$transaction(studentAnswerUpdates);

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        endTime,
        score,
        status: QuizAttemptStatus.COMPLETED,
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
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
    });

    // Отправляем уведомление студенту о результате теста
    await this.notificationsService.notifyQuizResult(userId, updatedAttempt.quiz.name, score);

    return updatedAttempt;
  }

  async getAttemptResult(attemptId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, teacher: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
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
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Попытка не найдена');
    }

    // Студент может видеть только свои результаты
    if (user.role === 'STUDENT' && attempt.studentId !== user.student?.id) {
      throw new ForbiddenException('Вы не можете просматривать результаты этой попытки');
    }

    // Учителя и администраторы могут видеть все результаты
    // TODO: Добавить проверку прав учителя на конкретный тест

    return attempt;
  }
}
