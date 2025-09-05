import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackTemplateDto } from './dto/create-feedback-template.dto';
import { UpdateFeedbackTemplateDto } from './dto/update-feedback-template.dto';
import { CreateFeedbackResponseDto } from './dto/create-feedback-response.dto';
import { KpiService } from 'src/kpi/kpi.service';
import { EventService, DomainEventType } from 'src/common/events/event.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
    private readonly eventService: EventService,
  ) { }

  // Шаблоны форм обратной связи
  async createTemplate(createTemplateDto: CreateFeedbackTemplateDto) {
    try {
      return await this.prisma.feedbackTemplate.create({
        data: {
          ...createTemplateDto,
          questions: createTemplateDto.questions as any, // Приводим к JSON типу для Prisma
        },
      });
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new Error(`Шаблон с именем "${createTemplateDto.name}" уже существует`);
      }
      throw error;
    }
  }

  async getTemplatesForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const templates = await this.prisma.feedbackTemplate.findMany({
      where: {
        role: user.role,
        isActive: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });

    // Фильтрация для студентов: убираем персональные формы других студентов
    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (student) {
        const ownDynamicName = `teacher_evaluation_student_${student.id}`;
        return templates.filter(t => {
          if (!t.name.startsWith('teacher_evaluation_student_')) return true;
          return t.name === ownDynamicName;
        });
      }
    }

    return templates;
  }

  async getActiveTemplates() {
    return await this.prisma.feedbackTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { role: 'asc' },
        { priority: 'asc' },
      ],
    });
  }

  // Валидация ответа на основе шаблона
  async validateResponse(responseDto: CreateFeedbackResponseDto) {
    const template = await this.prisma.feedbackTemplate.findUnique({
      where: { id: responseDto.templateId },
    });

    if (!template) {
      throw new Error('Шаблон не найден');
    }

    if (!template.isActive) {
      throw new Error('Шаблон неактивен');
    }

    const questions = template.questions as any[];
    const answers = responseDto.answers;

    // Проверяем обязательные вопросы
    for (const question of questions) {
      if (question.required !== false) {
        const answer = answers[question.id];
        if (answer === undefined || answer === null || answer === '') {
          throw new Error(`Обязательный вопрос "${question.question}" не заполнен`);
        }

        // Валидация по типу вопроса
        switch (question.type) {
          case 'RATING_1_5':
            if (typeof answer !== 'number' || answer < 1 || answer > 5) {
              throw new Error(`Неверное значение рейтинга для вопроса "${question.question}"`);
            }
            break;
          case 'RATING_1_10':
            if (typeof answer !== 'number' || answer < 1 || answer > 10) {
              throw new Error(`Неверное значение рейтинга для вопроса "${question.question}"`);
            }
            break;
          case 'EMOTIONAL_SCALE':
            if (typeof answer !== 'number' || answer < 0 || answer > 100) {
              throw new Error(`Неверное значение эмоциональной шкалы для вопроса "${question.question}"`);
            }
            break;
          case 'YES_NO':
            if (typeof answer !== 'boolean') {
              throw new Error(`Неверное значение Да/Нет для вопроса "${question.question}"`);
            }
            break;
          case 'TEXT':
            if (typeof answer !== 'string' || answer.length > 5000) {
              throw new Error(`Неверный текстовый ответ для вопроса "${question.question}"`);
            }
            break;
          case 'TEACHER_RATING':
            // Допускаем два формата:
            // 1) Map { teacherId: rating } для массовой оценки
            // 2) Число (1-5) при наличии aboutTeacherId в DTO для оценки одного преподавателя
            if (typeof answers[question.id] === 'number') {
              const rating = answers[question.id];
              if (!responseDto.aboutTeacherId) {
                throw new Error(`Отсутствует aboutTeacherId для оценки преподавателя по вопросу "${question.question}"`);
              }
              if (rating < 1 || rating > 5) {
                throw new Error(`Неверная оценка (ожидается 1-5) для вопроса "${question.question}"`);
              }
            } else if (typeof answer === 'object' && answer !== null) {
              for (const [teacherId, rating] of Object.entries(answer as Record<string, unknown>)) {
                if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                  throw new Error(`Неверная оценка преподавателя ${teacherId} для вопроса "${question.question}"`);
                }
              }
            } else {
              throw new Error(`Неверный формат ответа для TEACHER_RATING в вопросе "${question.question}"`);
            }
            break;
        }
      }
    }
  }

  // Ответы на формы
  async submitResponse(userId: number, responseDto: CreateFeedbackResponseDto) {
    const currentPeriod = this.getCurrentPeriod();

    // Создаем или обновляем запись напрямую без использования unique constraint с null
    const existingResponse = await this.prisma.feedbackResponse.findFirst({
      where: {
        userId,
        templateId: responseDto.templateId,
        period: responseDto.period || currentPeriod,
        aboutTeacherId: responseDto.aboutTeacherId || null,
      },
    });

    let response;
    if (existingResponse) {
      // Обновляем существующую запись
      response = await this.prisma.feedbackResponse.update({
        where: {
          id: existingResponse.id,
        },
        data: {
          answers: responseDto.answers,
          isCompleted: responseDto.isCompleted || false,
          submittedAt: responseDto.isCompleted ? new Date() : null,
        },
      });
    } else {
      // Создаем новую запись
      response = await this.prisma.feedbackResponse.create({
        data: {
          userId,
          templateId: responseDto.templateId,
          answers: responseDto.answers,
          isCompleted: responseDto.isCompleted || false,
          period: responseDto.period || currentPeriod,
          aboutTeacherId: responseDto.aboutTeacherId || null,
          submittedAt: responseDto.isCompleted ? new Date() : null,
        },
      });
    }

    // Обновляем статус пользователя если форма завершена
    if (responseDto.isCompleted) {
      await this.updateUserFeedbackStatus(userId);
      await this.integrateWithOtherModules(userId, response);

      // Эмитим доменное событие для пересчёта KPI и эмоционального состояния
      try {
        const student = await this.prisma.student.findUnique({
          where: { userId },
          select: { id: true },
        });

        this.eventService.emit(DomainEventType.FEEDBACK_SUBMITTED, {
          studentId: student?.id,
          items: [{
            templateId: response.templateId,
            responseId: response.id,
            aboutTeacherId: response.aboutTeacherId,
            answers: response.answers,
            period: response.period,
            submittedAt: response.submittedAt,
          }]
        });
      } catch (e) {
        console.error('Failed to emit FEEDBACK_SUBMITTED event:', e);
      }
    }

    return response;
  }

  // Проверка обязательных форм
  async checkMandatoryFeedback(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { feedbackStatus: true },
    });

    if (!user) {
      console.error(`User with id ${userId} not found in checkMandatoryFeedback`);
      return {
        hasCompletedMandatory: false,
        pendingTemplates: [],
        currentPeriod: this.getCurrentPeriod(),
        error: 'User not found',
      };
    }

    const currentPeriod = this.getCurrentPeriod();

    // Получаем обязательные шаблоны для роли пользователя
    const mandatoryTemplatesRaw = await this.prisma.feedbackTemplate.findMany({
      where: {
        role: user.role,
        isActive: true,
        priority: { gt: 0 }, // Приоритет > 0 означает обязательную форму
      },
    });

    // Фильтрация персональных шаблонов для студентов (оставляем только свой)
    let mandatoryTemplates = mandatoryTemplatesRaw;
    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (student) {
        const ownName = `teacher_evaluation_student_${student.id}`;
        mandatoryTemplates = mandatoryTemplatesRaw.filter(t => {
          if (!t.name.startsWith('teacher_evaluation_student_')) return true;
          return t.name === ownName;
        });
      }
    }

    // Проверяем, какие формы уже заполнены
    const completedResponses = await this.prisma.feedbackResponse.findMany({
      where: {
        userId,
        period: currentPeriod,
        isCompleted: true,
        templateId: {
          in: mandatoryTemplates.map(t => t.id),
        },
      },
    });

    const pendingTemplates = mandatoryTemplates.filter(
      template => !completedResponses.some(response => response.templateId === template.id)
    );

    const hasCompletedMandatory = pendingTemplates.length === 0;

    // Обновляем статус пользователя
    await this.prisma.userFeedbackStatus.upsert({
      where: { userId },
      create: {
        userId,
        hasCompletedMandatory,
        currentPeriod,
        lastCompletedAt: hasCompletedMandatory ? new Date() : null,
        nextDueDate: this.getNextDueDate(user.role),
      },
      update: {
        hasCompletedMandatory,
        currentPeriod,
        lastCompletedAt: hasCompletedMandatory ? new Date() : user.feedbackStatus?.lastCompletedAt,
        nextDueDate: this.getNextDueDate(user.role),
      },
    });

    return {
      hasCompletedMandatory,
      pendingTemplates,
      currentPeriod,
    };
  }

  // Интеграция с другими модулями
  private async integrateWithOtherModules(userId: number, response: any) {
    try {
      const template = await this.prisma.feedbackTemplate.findUnique({
        where: { id: response.templateId },
      });

      const answers = response.answers;

      // Интеграция с модулем лояльности
      if (template?.name === 'student_satisfaction' && answers.teacher_rating) {
        await this.createLoyaltyReview(userId, answers);
      }

      // Интеграция с эмоциональным состоянием
      // (Удалено прямое обновление. Теперь обновление эмоционального состояния происходит только
      // через событие FEEDBACK_SUBMITTED -> EmotionalStateSubscriber -> EmotionalStateService.recordBatch)

      // Интеграция с KPI
      await this.updateKPIMetrics({ aboutTeacherId: response.aboutTeacherId as number | undefined });
    } catch (error) {
      console.error('Error integrating with other modules:', error);
    }
  }

  private async createLoyaltyReview(userId: number, answers: any) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (student && answers.teacher_id && answers.teacher_rating) {
      await this.prisma.studentReview.create({
        data: {
          studentId: student.id,
          teacherId: answers.teacher_id,
          groupId: student.groupId,
          rating: answers.teacher_rating,
          comment: answers.teacher_comment || 'Отзыв из обязательной формы',
          isModerated: true,
          isPublished: true,
        },
      });
    }
  }

  // Метод для создания записи в истории эмоциональных состояний

  // Метод для расчета изменения тренда

  private async updateKPIMetrics(response: { aboutTeacherId?: number }) {
    try {
      // Обновляем KPI только если ответ касается конкретного преподавателя
      if (response.aboutTeacherId) {
        await this.kpiService.calculatePeriodicKpiScore(response.aboutTeacherId);
        // Также можно инициировать обновление обзорных KPI, если потребуется
      }
    } catch (error) {
      console.error('Не удалось обновить KPI после фидбека:', error);
    }
  }

  private async updateUserFeedbackStatus(userId: number) {
    const currentPeriod = this.getCurrentPeriod();

    await this.prisma.userFeedbackStatus.upsert({
      where: { userId },
      create: {
        userId,
        hasCompletedMandatory: true,
        currentPeriod,
        lastCompletedAt: new Date(),
      },
      update: {
        hasCompletedMandatory: true,
        lastCompletedAt: new Date(),
      },
    });
  }

  // Вспомогательные методы
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getNextDueDate(role: string): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Разная частота для разных ролей
    switch (role) {
      case 'STUDENT':
        return nextMonth; // Каждый месяц
      case 'TEACHER':
        return new Date(now.getFullYear(), now.getMonth() + 3, 1); // Каждый квартал
      default:
        return new Date(now.getFullYear(), now.getMonth() + 6, 1); // Каждые полгода
    }
  }

  // Методы описания эмоциональных состояний
  private getMoodDescription(mood: number): string {
    if (mood >= 80) return 'Отличное настроение';
    if (mood >= 60) return 'Хорошее настроение';
    if (mood >= 40) return 'Нейтральное настроение';
    if (mood >= 20) return 'Плохое настроение';
    return 'Очень плохое настроение';
  }

  private getConcentrationDescription(concentration: number): string {
    if (concentration >= 80) return 'Высокая концентрация';
    if (concentration >= 60) return 'Хорошая концентрация';
    if (concentration >= 40) return 'Средняя концентрация';
    if (concentration >= 20) return 'Низкая концентрация';
    return 'Очень низкая концентрация';
  }

  private getSocializationDescription(socialization: number): string {
    if (socialization >= 80) return 'Высокая социализация';
    if (socialization >= 60) return 'Хорошая социализация';
    if (socialization >= 40) return 'Средняя социализация';
    if (socialization >= 20) return 'Низкая социализация';
    return 'Очень низкая социализация';
  }

  private getMotivationDescription(motivation: number): string {
    if (motivation >= 80) return 'Высокая мотивация';
    if (motivation >= 60) return 'Хорошая мотивация';
    if (motivation >= 40) return 'Средняя мотивация';
    if (motivation >= 20) return 'Низкая мотивация';
    return 'Очень низкая мотивация';
  }

  // Аналитика и отчеты
  async getFeedbackAnalytics(templateId?: number, period?: string) {
    const where: any = {};

    if (templateId) where.templateId = templateId;
    if (period) where.period = period;

    const responses = await this.prisma.feedbackResponse.findMany({
      where: {
        ...where,
        isCompleted: true,
      },
      include: {
        template: true,
        user: {
          select: {
            id: true,
            role: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return {
      totalResponses: responses.length,
      byRole: this.groupByRole(responses),
      averageRatings: this.calculateAverageRatings(responses),
      trends: this.calculateTrends(responses),
    };
  }

  private groupByRole(responses: any[]) {
    return responses.reduce((acc, response) => {
      const role = response.user.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageRatings(_responses: any[]) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Логика расчета средних оценок по различным аспектам
    return {};
  }

  private calculateTrends(_responses: any[]) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Логика расчета трендов
    return {};
  }

  // Новые методы для управления шаблонами
  async getTemplate(id: number) {
    return await this.prisma.feedbackTemplate.findUnique({
      where: { id },
    });
  }

  async updateTemplate(id: number, updateDto: UpdateFeedbackTemplateDto) {
    return await this.prisma.feedbackTemplate.update({
      where: { id },
      data: updateDto as any,
    });
  }

  async deleteTemplate(id: number) {
    return await this.prisma.feedbackTemplate.delete({
      where: { id },
    });
  }

  async toggleTemplateActive(id: number) {
    const template = await this.prisma.feedbackTemplate.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return await this.prisma.feedbackTemplate.update({
      where: { id },
      data: { isActive: !template.isActive },
    });
  }

  async getTemplateResponses(templateId: number, period?: string) {
    const where: any = { templateId, isCompleted: true };
    if (period) where.period = period;

    return await this.prisma.feedbackResponse.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async resetMandatoryStatus(userId: number) {
    return await this.prisma.userFeedbackStatus.update({
      where: { userId },
      data: {
        hasCompletedMandatory: false,
        lastCompletedAt: null,
      },
    });
  }

  async getFeedbackStatistics(period?: string) {
    const where: any = { isCompleted: true };
    if (period) where.period = period;

    const totalResponses = await this.prisma.feedbackResponse.count({ where });

    const responsesByRole = await this.prisma.feedbackResponse.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
    });

    const userIds = responsesByRole.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    });

    const roleStats = users.reduce((acc, user) => {
      const userResponses = responsesByRole.find(r => r.userId === user.id);
      if (!acc[user.role]) acc[user.role] = 0;
      acc[user.role] += userResponses?._count.id || 0;
      return acc;
    }, {} as Record<string, number>);

    const completionRate = await this.calculateCompletionRate(period);

    return {
      totalResponses,
      responsesByRole: roleStats,
      completionRate,
      period: period || this.getCurrentPeriod(),
    };
  }

  private async calculateCompletionRate(period?: string) {
    const currentPeriod = period || this.getCurrentPeriod();

    // Получаем все активные обязательные шаблоны
    const mandatoryTemplates = await this.prisma.feedbackTemplate.findMany({
      where: {
        isActive: true,
        priority: { gt: 0 }, // Приоритет > 0 означает обязательную форму
      },
      select: {
        role: true,
      },
    });

    // Если нет обязательных шаблонов, возвращаем 100%
    if (mandatoryTemplates.length === 0) {
      return 100;
    }

    // Получаем уникальные роли, для которых есть обязательные формы
    const rolesWithMandatoryForms = [...new Set(mandatoryTemplates.map(t => t.role))];

    // Общее количество пользователей, которые должны заполнить формы (только с ролями, для которых есть обязательные формы)
    const totalUsersWithMandatoryForms = await this.prisma.user.count({
      where: {
        role: { in: rolesWithMandatoryForms },
        deletedAt: null,
      },
    });

    // Количество пользователей, которые заполнили обязательные формы
    const completedUsers = await this.prisma.userFeedbackStatus.count({
      where: {
        hasCompletedMandatory: true,
        currentPeriod,
        user: {
          role: { in: rolesWithMandatoryForms },
          deletedAt: null,
        },
      },
    });

    return totalUsersWithMandatoryForms > 0 ? Math.round((completedUsers / totalUsersWithMandatoryForms) * 100) : 100;
  }

  // Получение эмоционального состояния студента на основе фидбеков
  async getStudentEmotionalStateFromFeedbacks(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) throw new Error('Student not found');

    const state = await this.prisma.emotionalState.findUnique({
      where: { studentId },
    });

    // Последние snapshots истории
    const history = await this.prisma.emotionalStateHistory.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Teacher ratings (собираем последние 10 ответов с оценочными вопросами преподавателей)
    const ratingResponses = await this.prisma.feedbackResponse.findMany({
      where: {
        userId: student.userId,
        isCompleted: true,
        submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });
    const teacherRatings = this.extractTeacherRatings(ratingResponses);

    const currentState = state
      ? {
        mood: { value: state.mood, description: this.getMoodDescription(state.mood), trend: state.moodTrend },
        concentration: { value: state.concentration, description: this.getConcentrationDescription(state.concentration), trend: state.concentrationTrend },
        socialization: { value: state.socialization, description: this.getSocializationDescription(state.socialization), trend: state.socializationTrend },
        motivation: { value: state.motivation, description: this.getMotivationDescription(state.motivation), trend: state.motivationTrend },
      }
      : null;

    const recommendations = currentState
      ? this.generateEmotionalRecommendations({
        mood: { value: currentState.mood.value },
        concentration: { value: currentState.concentration.value },
        socialization: { value: currentState.socialization.value },
        motivation: { value: currentState.motivation.value },
      })
      : [];

    return {
      studentId,
      currentState,
      lastUpdated: state?.updatedAt || null,
      history: history.map(h => ({
        date: h.createdAt,
        mood: h.mood,
        concentration: h.concentration,
        socialization: h.socialization,
        motivation: h.motivation,
        stress: h.stress,
        engagement: h.engagement,
        moodTrend: h.moodTrend,
        concentrationTrend: h.concentrationTrend,
        socializationTrend: h.socializationTrend,
        motivationTrend: h.motivationTrend,
      })),
      teacherRatings,
      recommendations,
    };
  }

  // Получение истории эмоциональных ответов студента
  async getStudentEmotionalHistory(studentId: number, period?: string) {
    // period пока игнорируем (можно фильтровать по createdAt)
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!student) throw new Error('Student not found');

    const history = await this.prisma.emotionalStateHistory.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return {
      studentId,
      history: history.map(h => ({
        date: h.createdAt,
        mood: h.mood,
        concentration: h.concentration,
        socialization: h.socialization,
        motivation: h.motivation,
        stress: h.stress,
        engagement: h.engagement,
        moodTrend: h.moodTrend,
        concentrationTrend: h.concentrationTrend,
        socializationTrend: h.socializationTrend,
        motivationTrend: h.motivationTrend,
      })),
    };
  }

  // Генерация рекомендаций
  private generateEmotionalRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.mood.value < 40) {
      recommendations.push({
        type: 'mood',
        priority: 'high',
        message: 'Низкое настроение требует внимания. Рекомендуется консультация с психологом.',
      });
    }

    if (metrics.concentration.value < 30) {
      recommendations.push({
        type: 'concentration',
        priority: 'high',
        message: 'Проблемы с концентрацией. Рассмотрите возможность изменения учебной нагрузки.',
      });
    }

    if (metrics.motivation.value < 40) {
      recommendations.push({
        type: 'motivation',
        priority: 'medium',
        message: 'Снижение мотивации. Рекомендуется беседа с куратором.',
      });
    }

    if (metrics.socialization.value < 30) {
      recommendations.push({
        type: 'socialization',
        priority: 'medium',
        message: 'Проблемы с социализацией. Рекомендуется участие в групповых активностях.',
      });
    }

    return recommendations;
  }

  // Извлечение оценок преподавателей из ответов
  private extractTeacherRatings(responses: any[]) {
    const teacherRatings: any[] = [];

    responses.forEach(response => {
      Object.entries((response.answers || {}) as Record<string, unknown>).forEach(([questionId, answer]) => {
        // Если это вопрос с оценкой преподавателей
        if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
          Object.entries(answer).forEach(([teacherId, rating]) => {
            if (typeof rating === 'number') {
              teacherRatings.push({
                teacherId: parseInt(teacherId),
                rating: rating,
                date: response.submittedAt,
                questionId: questionId
              });
            }
          });
        }
      });
    });

    return teacherRatings;
  }

  // Создание стандартных шаблонов (включая KPI)
  async createDefaultTemplates() {
    const templates = await this.createKpiTemplates();
    await this.createDynamicTeacherEvaluationTemplates();

    return {
      message: 'Стандартные шаблоны созданы, включая динамические оценки преподавателей',
      created: templates.length,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        title: t.title,
        role: t.role
      }))
    };
  }

  // Создание динамических шаблонов оценки преподавателей для каждого студента
  async createDynamicTeacherEvaluationTemplates() {
    try {
      // Получаем всех активных студентов
      const students = await this.prisma.student.findMany({
        where: { deletedAt: null },
        include: {
          user: true,
          group: {
            include: {
              studyPlans: {
                include: {
                  teacher: {
                    include: {
                      user: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log(`🎓 Найдено ${students.length} студентов для создания персональных форм оценки преподавателей`);

      for (const student of students) {
        // Получаем уникальных преподавателей студента
        const teachersSet = new Set();
        const teachers = student.group?.studyPlans
          .map(plan => plan.teacher)
          .filter(teacher => {
            if (!teacher || teachersSet.has(teacher.id)) return false;
            teachersSet.add(teacher.id);
            return true;
          }) || [];

        if (teachers.length === 0) {
          console.log(`⚠️ У студента ${student.user.name} ${student.user.surname} нет преподавателей`);
          continue;
        }

        console.log(`📝 Создаем форму для студента ${student.user.name} ${student.user.surname} с ${teachers.length} преподавателями`);

        // Создаем персональный шаблон для студента
        const templateName = `teacher_evaluation_student_${student.id}`;

        // Создаем вопросы для каждого преподавателя
        const questions = [];

        teachers.forEach((teacher) => {
          // Формируем полное имя преподавателя один раз для консистентности
          const teacherFullName = `${teacher.user.name} ${teacher.user.surname}`.trim();

          // Вопрос о качестве объяснения материала
          questions.push({
            id: `teacher_${teacher.id}_clarity`,
            question: `Насколько понятно ${teacherFullName} объясняет материал?`,
            type: 'RATING_1_5',
            required: true,
            teacherId: teacher.id,
            teacherName: teacherFullName,
            kpiMetric: 'TEACHING_QUALITY',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень непонятно',
              '2 - Непонятно',
              '3 - Приемлемо',
              '4 - Понятно',
              '5 - Очень понятно'
            ]
          });

          // Вопрос о интересности уроков
          questions.push({
            id: `teacher_${teacher.id}_engagement`,
            question: `Насколько интересны уроки ${teacherFullName}?`,
            type: 'RATING_1_5',
            required: true,
            teacherId: teacher.id,
            teacherName: teacherFullName,
            kpiMetric: 'LESSON_EFFECTIVENESS',
            isKpiRelevant: true,
            kpiWeight: 1.0,
            options: [
              '1 - Очень скучно',
              '2 - Скучно',
              '3 - Нормально',
              '4 - Интересно',
              '5 - Очень интересно'
            ]
          });

          // Вопрос о доступности преподавателя
          questions.push({
            id: `teacher_${teacher.id}_availability`,
            question: `Доступен ли ${teacherFullName} для вопросов вне уроков?`,
            type: 'YES_NO',
            required: true,
            teacherId: teacher.id,
            teacherName: teacherFullName,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.7
          });

          // Вопрос о рекомендации преподавателя
          questions.push({
            id: `teacher_${teacher.id}_recommend`,
            question: `Порекомендуете ли вы ${teacherFullName} другим студентам?`,
            type: 'YES_NO',
            required: true,
            teacherId: teacher.id,
            teacherName: teacherFullName,
            kpiMetric: 'TEACHER_SATISFACTION',
            isKpiRelevant: true,
            kpiWeight: 0.9
          });
        });

        // Создаем или обновляем персональный шаблон
        await this.prisma.feedbackTemplate.upsert({
          where: { name: templateName },
          update: {
            questions: questions,
            title: `Оценка преподавателей (для студента ${student.user.name} ${student.user.surname})`,
            description: `Персональная форма оценки ${teachers.length} преподавателей студентом`,
          },
          create: {
            name: templateName,
            role: 'STUDENT',
            title: `Оценка преподавателей (для студента ${student.user.name} ${student.user.surname})`,
            description: `Персональная форма оценки ${teachers.length} преподавателей студентом`,
            questions: questions,
            isActive: true,
            frequency: 'MONTHLY',
            priority: 6, // Высокий приоритет для персональных форм
            hasKpiQuestions: true,
            kpiMetrics: ['TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
          }
        });

        console.log(`✅ Создана персональная форма для студента ${student.user.name} ${student.user.surname} с оценкой ${teachers.length} преподавателей`);
      }

      console.log(`🎉 Создание персональных форм оценки преподавателей завершено!`);

    } catch (error) {
      console.error('❌ Ошибка при создании динамических шаблонов оценки преподавателей:', error);
      throw error;
    }
  }

  // Создание KPI шаблонов
  private async createKpiTemplates() {
    const templates = [];

    // 1. Шаблон для удержания студентов
    try {
      const studentRetentionTemplate = await this.prisma.feedbackTemplate.upsert({
        where: { name: 'student_retention_survey' },
        update: {},
        create: {
          name: 'student_retention_survey',
          role: 'STUDENT',
          title: 'Оценка учебного процесса',
          description: 'Помогите нам улучшить качество обучения, ответив на несколько вопросов',
          questions: [
            {
              id: 'continue_learning',
              question: 'Планируете ли вы продолжить обучение в следующем семестре?',
              type: 'YES_NO',
              required: true,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 1.0
            },
            {
              id: 'recommend_academy',
              question: 'Порекомендуете ли вы нашу академию друзьям?',
              type: 'YES_NO',
              required: true,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 0.8
            },
            {
              id: 'overall_satisfaction',
              question: 'Оцените ваше общее удовлетворение качеством обучения',
              type: 'RATING_1_5',
              required: true,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 1.0,
              options: [
                '1 - Очень неудовлетворен',
                '2 - Неудовлетворен',
                '3 - Нейтрально',
                '4 - Удовлетворен',
                '5 - Очень удовлетворен'
              ]
            },
            {
              id: 'learning_motivation',
              question: 'Как изменилась ваша мотивация к обучению?',
              type: 'RATING_1_5',
              required: false,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 0.6,
              options: [
                '1 - Значительно снизилась',
                '2 - Снизилась',
                '3 - Не изменилась',
                '4 - Повысилась',
                '5 - Значительно повысилась'
              ]
            }
          ],
          isActive: true,
          frequency: 'MONTHLY',
          priority: 5,
          hasKpiQuestions: true,
          kpiMetrics: ['STUDENT_RETENTION']
        }
      });
      templates.push(studentRetentionTemplate);
    } catch (error) {
      console.error('Error creating student retention template:', error);
    }

    // 2. Шаблон отзывов от родителей
    try {
      const parentFeedbackTemplate = await this.prisma.feedbackTemplate.upsert({
        where: { name: 'parent_satisfaction_survey' },
        update: {},
        create: {
          name: 'parent_satisfaction_survey',
          role: 'PARENT',
          title: 'Отзыв родителей о качестве обучения',
          description: 'Оцените качество обучения вашего ребенка',
          questions: [
            {
              id: 'teacher_satisfaction',
              question: 'Насколько вы удовлетворены работой преподавателей?',
              type: 'RATING_1_5',
              required: true,
              kpiMetric: 'TEACHER_SATISFACTION',
              isKpiRelevant: true,
              kpiWeight: 1.0,
              options: [
                '1 - Очень неудовлетворен',
                '2 - Неудовлетворен',
                '3 - Нейтрально',
                '4 - Удовлетворен',
                '5 - Очень удовлетворен'
              ]
            },
            {
              id: 'teaching_quality',
              question: 'Как вы оцениваете качество преподавания?',
              type: 'RATING_1_5',
              required: true,
              kpiMetric: 'TEACHING_QUALITY',
              isKpiRelevant: true,
              kpiWeight: 1.0,
              options: [
                '1 - Очень низкое',
                '2 - Низкое',
                '3 - Среднее',
                '4 - Высокое',
                '5 - Очень высокое'
              ]
            },
            {
              id: 'child_progress',
              question: 'Заметили ли вы прогресс в обучении вашего ребенка?',
              type: 'YES_NO',
              required: true,
              kpiMetric: 'TEACHING_QUALITY',
              isKpiRelevant: true,
              kpiWeight: 0.8
            },
            {
              id: 'overall_experience',
              question: 'Оцените общее впечатление от академии',
              type: 'RATING_1_10',
              required: true,
              kpiMetric: 'OVERALL_EXPERIENCE',
              isKpiRelevant: true,
              kpiWeight: 1.0
            },
            {
              id: 'recommend_to_others',
              question: 'Порекомендуете ли вы нашу академию другим родителям?',
              type: 'YES_NO',
              required: true,
              kpiMetric: 'TEACHER_SATISFACTION',
              isKpiRelevant: true,
              kpiWeight: 0.9
            }
          ],
          isActive: true,
          frequency: 'QUARTERLY',
          priority: 3,
          hasKpiQuestions: true,
          kpiMetrics: ['TEACHER_SATISFACTION', 'TEACHING_QUALITY', 'OVERALL_EXPERIENCE']
        }
      });
      templates.push(parentFeedbackTemplate);
    } catch (error) {
      console.error('Error creating parent feedback template:', error);
    }

    // 3. Шаблон оценки преподавателей студентами
    try {
      const teacherEvaluationTemplate = await this.prisma.feedbackTemplate.upsert({
        where: { name: 'teacher_evaluation_by_students' },
        update: {},
        create: {
          name: 'teacher_evaluation_by_students',
          role: 'STUDENT',
          title: 'Оценка преподавателей',
          description: 'Оцените работу ваших преподавателей',
          questions: [
            {
              id: 'lesson_clarity',
              question: 'Насколько понятно преподаватель объясняет материал?',
              type: 'RATING_1_5',
              required: true,
              kpiMetric: 'TEACHING_QUALITY',
              isKpiRelevant: true,
              kpiWeight: 1.0,
              options: [
                '1 - Очень непонятно',
                '2 - Непонятно',
                '3 - Приемлемо',
                '4 - Понятно',
                '5 - Очень понятно'
              ]
            },
            {
              id: 'lesson_engagement',
              question: 'Насколько интересны уроки?',
              type: 'RATING_1_5',
              required: true,
              kpiMetric: 'LESSON_EFFECTIVENESS',
              isKpiRelevant: true,
              kpiWeight: 1.0,
              options: [
                '1 - Очень скучно',
                '2 - Скучно',
                '3 - Нормально',
                '4 - Интересно',
                '5 - Очень интересно'
              ]
            },
            {
              id: 'teacher_availability',
              question: 'Доступен ли преподаватель для вопросов вне уроков?',
              type: 'YES_NO',
              required: true,
              kpiMetric: 'TEACHER_SATISFACTION',
              isKpiRelevant: true,
              kpiWeight: 0.7
            },
            {
              id: 'recommend_teacher',
              question: 'Порекомендуете ли вы этого преподавателя другим студентам?',
              type: 'YES_NO',
              required: true,
              kpiMetric: 'TEACHER_SATISFACTION',
              isKpiRelevant: true,
              kpiWeight: 0.9
            }
          ],
          isActive: true,
          frequency: 'MONTHLY',
          priority: 4,
          hasKpiQuestions: true,
          kpiMetrics: ['TEACHING_QUALITY', 'LESSON_EFFECTIVENESS', 'TEACHER_SATISFACTION']
        }
      });
      templates.push(teacherEvaluationTemplate);
    } catch (error) {
      console.error('Error creating teacher evaluation template:', error);
    }

    // 4. Эмоциональный шаблон для студентов
    try {
      const emotionalFeedbackTemplate = await this.prisma.feedbackTemplate.upsert({
        where: { name: 'student_emotional_wellbeing' },
        update: {},
        create: {
          name: 'student_emotional_wellbeing',
          role: 'STUDENT',
          title: 'Эмоциональное состояние',
          description: 'Расскажите о своем самочувствии и настроении',
          questions: [
            {
              id: 'mood_today',
              question: 'Как вы оцениваете свое настроение сегодня?',
              type: 'EMOTIONAL_SCALE',
              required: true,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 0.6
            },
            {
              id: 'concentration_level',
              question: 'Как вы оцениваете свою концентрацию на уроках?',
              type: 'RATING_1_5',
              required: true,
              kpiMetric: 'LESSON_EFFECTIVENESS',
              isKpiRelevant: true,
              kpiWeight: 0.8,
              options: [
                '1 - Очень трудно сосредоточиться',
                '2 - Трудно сосредоточиться',
                '3 - Нормально',
                '4 - Легко сосредоточиться',
                '5 - Очень легко сосредоточиться'
              ]
            },
            {
              id: 'motivation_level',
              question: 'Насколько вы мотивированы к учебе?',
              type: 'RATING_1_10',
              required: true,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 1.0
            },
            {
              id: 'stress_level',
              question: 'Чувствуете ли вы стресс от учебной нагрузки?',
              type: 'RATING_1_5',
              required: false,
              kpiMetric: 'STUDENT_RETENTION',
              isKpiRelevant: true,
              kpiWeight: 0.4,
              options: [
                '1 - Совсем нет стресса',
                '2 - Небольшой стресс',
                '3 - Умеренный стресс',
                '4 - Сильный стресс',
                '5 - Очень сильный стресс'
              ]
            }
          ],
          isActive: true,
          frequency: 'WEEKLY',
          priority: 2,
          hasKpiQuestions: true,
          kpiMetrics: ['STUDENT_RETENTION', 'LESSON_EFFECTIVENESS']
        }
      });
      templates.push(emotionalFeedbackTemplate);
    } catch (error) {
      console.error('Error creating emotional feedback template:', error);
    }

    return templates;
  }

  // Получение анонимизированных ответов
  async getAnonymizedResponses(options: {
    templateId?: number;
    period?: string;
    page: number;
    limit: number;
  }) {
    const { templateId, period, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: any = { isCompleted: true };
    if (templateId) where.templateId = templateId;
    if (period) where.period = period;

    const [responses, total] = await Promise.all([
      this.prisma.feedbackResponse.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              title: true,
              questions: true,
            },
          },
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedbackResponse.count({ where }),
    ]);

    // Получаем всех уникальных пользователей для создания стабильного маппинга
    const allUserIds = await this.prisma.feedbackResponse.findMany({
      where: { isCompleted: true },
      select: { userId: true },
      distinct: ['userId'],
      orderBy: { userId: 'asc' },
    });

    // Создаем маппинг userId -> анонимный номер
    const userIdToAnonymousId = new Map<number, number>();
    allUserIds.forEach((userResponse, index) => {
      userIdToAnonymousId.set(userResponse.userId, index + 1);
    });

    // Анонимизируем ответы с стабильным ID
    const anonymizedResponses = responses.map((response) => ({
      id: response.id,
      anonymousId: `Респондент ${userIdToAnonymousId.get(response.user.id)}`,
      role: response.user.role,
      template: response.template.title,
      answers: response.answers,
      period: response.period,
      submittedAt: response.submittedAt,
      templateQuestions: response.template.questions,
    }));

    return {
      data: anonymizedResponses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Агрегированная эмоциональная сводка для фронтенда (без моков)
  async getEmotionalOverview(days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Берём актуальные эмоциональные состояния студентов
    const emotionalStates = await this.prisma.emotionalState.findMany({
      where: {
        updatedAt: {
          gte: since,
        },
      },
      include: {
        student: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (emotionalStates.length === 0) {
      return {
        totalStudents: 0,
        averages: {
          mood: 0,
          concentration: 0,
          socialization: 0,
          motivation: 0,
          stress: 0,
          engagement: 0,
        },
        groupStats: [],
        timeline: [],
      };
    }

    const deriveStress = (mood: number, motivation: number) =>
      Math.max(0, Math.min(100, Math.round(100 - (mood + motivation) / 2)));
    const deriveEngagement = (motivation: number, socialization: number) =>
      Math.max(0, Math.min(100, Math.round((motivation + socialization) / 2)));

    // Глобальные суммы
    let sumMood = 0;
    let sumConcentration = 0;
    let sumSocial = 0;
    let sumMotivation = 0;
    let sumStress = 0;
    let sumEngagement = 0;

    // По группам
    const groupMap = new Map<
      string,
      {
        students: number;
        mood: number;
        concentration: number;
        socialization: number;
        motivation: number;
        stress: number;
        engagement: number;
      }
    >();

    emotionalStates.forEach((st) => {
      const g = st.student.group?.name || 'NO_GROUP';
      if (!groupMap.has(g)) {
        groupMap.set(g, {
          students: 0,
          mood: 0,
          concentration: 0,
          socialization: 0,
          motivation: 0,
          stress: 0,
          engagement: 0,
        });
      }
      const entry = groupMap.get(g)!;
      entry.students += 1;
      entry.mood += st.mood;
      entry.concentration += st.concentration;
      entry.socialization += st.socialization;
      entry.motivation += st.motivation;
      const stress = deriveStress(st.mood, st.motivation);
      const engagement = deriveEngagement(st.motivation, st.socialization);
      entry.stress += stress;
      entry.engagement += engagement;

      sumMood += st.mood;
      sumConcentration += st.concentration;
      sumSocial += st.socialization;
      sumMotivation += st.motivation;
      sumStress += stress;
      sumEngagement += engagement;
    });

    const count = emotionalStates.length;

    const averages = {
      mood: Math.round(sumMood / count),
      concentration: Math.round(sumConcentration / count),
      socialization: Math.round(sumSocial / count),
      motivation: Math.round(sumMotivation / count),
      stress: Math.round(sumStress / count),
      engagement: Math.round(sumEngagement / count),
    };

    const groupStats = Array.from(groupMap.entries()).map(
      ([
        group,
        { students, mood, concentration, socialization, motivation, stress, engagement },
      ]) => ({
        group,
        students,
        averageMood: Math.round(mood / students),
        averageStress: Math.round(stress / students),
        averageEngagement: Math.round(engagement / students),
        averageMotivation: Math.round(motivation / students),
        averageConcentration: Math.round(concentration / students),
        averageSocialization: Math.round(socialization / students),
      }),
    ).sort((a, b) => a.group.localeCompare(b.group));

    // Таймлайн: агрегируем из EmotionalStateHistory (перенос с ответов на snapshots)
    const history = await this.prisma.emotionalStateHistory.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        mood: true,
        motivation: true,
        socialization: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    interface DayAgg {
      moodSum: number;
      moodCount: number;
      motivationSum: number;
      motivationCount: number;
      socialSum: number;
      socialCount: number;
    }

    const dayMap = new Map<string, DayAgg>();

    history.forEach(snap => {
      const day = snap.createdAt.toISOString().slice(0, 10);
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          moodSum: 0,
          moodCount: 0,
          motivationSum: 0,
          motivationCount: 0,
          socialSum: 0,
          socialCount: 0,
        });
      }
      const agg = dayMap.get(day)!;
      if (typeof snap.mood === 'number') {
        agg.moodSum += snap.mood;
        agg.moodCount += 1;
      }
      if (typeof snap.motivation === 'number') {
        agg.motivationSum += snap.motivation;
        agg.motivationCount += 1;
      }
      if (typeof snap.socialization === 'number') {
        agg.socialSum += snap.socialization;
        agg.socialCount += 1;
      }
    });

    const timeline = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, agg]) => {
        const mood = agg.moodCount ? Math.round(agg.moodSum / agg.moodCount) : undefined;
        const motivation = agg.motivationCount ? Math.round(agg.motivationSum / agg.motivationCount) : undefined;
        const social = agg.socialCount ? Math.round(agg.socialSum / agg.socialCount) : undefined;
        const engagement = motivation !== undefined && social !== undefined ? deriveEngagement(motivation, social) : undefined;
        const stress = mood !== undefined && motivation !== undefined ? deriveStress(mood, motivation) : undefined;
        return { date, mood, stress, engagement };
      });

    return {
      totalStudents: count,
      averages,
      groupStats,
      timeline,
      since: since.toISOString(),
      days,
    };
  }
}
