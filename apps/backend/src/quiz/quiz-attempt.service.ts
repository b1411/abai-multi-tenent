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
    });

    if (existingAttempt) {
      throw new ForbiddenException('Вы уже проходили этот тест. Повторное прохождение невозможно.');
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

    const existingAnswer = await this.prisma.studentAnswer.findUnique({
      where: {
        quizAttemptId_questionId: {
          quizAttemptId: dto.quizAttemptId,
          questionId: dto.questionId,
        },
      },
    });

    if (existingAnswer) {
      return this.prisma.studentAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          answerId: dto.answerId,
          textAnswer: dto.textAnswer,
          answeredAt: new Date(),
        },
      });
    }

    return this.prisma.studentAnswer.create({
      data: {
        quizAttemptId: dto.quizAttemptId,
        questionId: dto.questionId,
        answerId: dto.answerId,
        textAnswer: dto.textAnswer,
      },
    });
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

    for (const studentAnswer of attempt.studentAnswers) {
      const question = studentAnswer.question;
      let isCorrect = false;

      if (question.type === 'TEXT') {
        // Для текстовых вопросов пока считаем всегда правильными (требует ручной проверки)
        isCorrect = !!studentAnswer.textAnswer?.trim();
      } else if (question.type === 'MULTIPLE_CHOICE') {
        // Для множественного выбора нужно проверить все правильные ответы
        const correctAnswers = question.answers.filter(a => a.isCorrect);
        const studentAnswerIds = attempt.studentAnswers
          .filter(sa => sa.questionId === question.id && sa.answerId)
          .map(sa => sa.answerId);
        
        // Проверяем, что выбраны все правильные ответы и нет неправильных
        isCorrect = correctAnswers.length > 0 && 
          correctAnswers.every(ca => studentAnswerIds.includes(ca.id)) &&
          studentAnswerIds.every(saId => correctAnswers.some(ca => ca.id === saId));
      } else {
        // Для одиночного выбора
        const correctAnswer = question.answers.find(a => a.isCorrect);
        isCorrect = correctAnswer?.id === studentAnswer.answerId;
      }

      if (isCorrect) {
        score++;
      }

      studentAnswerUpdates.push(
        this.prisma.studentAnswer.update({
          where: { id: studentAnswer.id },
          data: { isCorrect },
        }),
      );
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
