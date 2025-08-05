import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackTemplateDto } from './dto/create-feedback-template.dto';
import { UpdateFeedbackTemplateDto } from './dto/update-feedback-template.dto';
import { CreateFeedbackResponseDto } from './dto/create-feedback-response.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

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

    return await this.prisma.feedbackTemplate.findMany({
      where: {
        role: user.role,
        isActive: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
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
            if (typeof answer !== 'object' || answer === null) {
              throw new Error(`Неверный формат оценки преподавателей для вопроса "${question.question}"`);
            }
            // Проверяем, что все оценки в диапазоне 1-5
            for (const [teacherId, rating] of Object.entries(answer)) {
              if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                throw new Error(`Неверная оценка преподавателя ${teacherId} для вопроса "${question.question}"`);
              }
            }
            break;
        }
      }
    }
  }

  // Ответы на формы
  async submitResponse(userId: number, responseDto: CreateFeedbackResponseDto) {
    const currentPeriod = this.getCurrentPeriod();
    
    const response = await this.prisma.feedbackResponse.upsert({
      where: {
        userId_templateId_period_aboutTeacherId: {
          userId,
          templateId: responseDto.templateId,
          period: responseDto.period || currentPeriod,
          aboutTeacherId: responseDto.aboutTeacherId ?? null,
        },
      },
      create: {
        userId,
        templateId: responseDto.templateId,
        answers: responseDto.answers,
        isCompleted: responseDto.isCompleted || false,
        period: responseDto.period || currentPeriod,
        aboutTeacherId: responseDto.aboutTeacherId ?? null,
        submittedAt: responseDto.isCompleted ? new Date() : null,
      },
      update: {
        answers: responseDto.answers,
        isCompleted: responseDto.isCompleted || false,
        submittedAt: responseDto.isCompleted ? new Date() : null,
      },
    });

    // Обновляем статус пользователя если форма завершена
    if (responseDto.isCompleted) {
      await this.updateUserFeedbackStatus(userId);
      
      // Интегрируем с другими модулями
      await this.integrateWithOtherModules(userId, response);
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
    const mandatoryTemplates = await this.prisma.feedbackTemplate.findMany({
      where: {
        role: user.role,
        isActive: true,
        priority: { gt: 0 }, // Приоритет > 0 означает обязательную форму
      },
    });

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
      if (answers.mood_today || answers.stress_level) {
        await this.updateEmotionalState(userId, answers);
      }

      // Интеграция с KPI
      await this.updateKPIMetrics(response);
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

  private async updateEmotionalState(userId: number, answers: any) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (student) {
      // Получаем предыдущее состояние для расчета трендов
      const previousState = await this.prisma.emotionalState.findUnique({
        where: { studentId: student.id },
      });

      // Нормализуем значения к шкале 0-100
      const normalizedMood = this.normalizeToScale(answers.mood_today || answers.overall_satisfaction, 100);
      const normalizedConcentration = this.normalizeToScale(answers.concentration_level, 100);
      const normalizedSocialization = this.normalizeToScale(answers.socialization_level, 100);
      const normalizedMotivation = this.normalizeToScale(answers.motivation_level, 100);

      // Рассчитываем тренды
      const moodTrend = previousState ? this.calculateTrendChange(previousState.mood, normalizedMood) : 'neutral';
      const concentrationTrend = previousState ? this.calculateTrendChange(previousState.concentration, normalizedConcentration) : 'neutral';
      const socializationTrend = previousState ? this.calculateTrendChange(previousState.socialization, normalizedSocialization) : 'neutral';
      const motivationTrend = previousState ? this.calculateTrendChange(previousState.motivation, normalizedMotivation) : 'neutral';

      await this.prisma.emotionalState.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          mood: normalizedMood,
          moodDesc: this.getMoodDescription(normalizedMood),
          moodTrend: moodTrend as any,
          concentration: normalizedConcentration,
          concentrationDesc: this.getConcentrationDescription(normalizedConcentration),
          concentrationTrend: concentrationTrend as any,
          socialization: normalizedSocialization,
          socializationDesc: this.getSocializationDescription(normalizedSocialization),
          socializationTrend: socializationTrend as any,
          motivation: normalizedMotivation,
          motivationDesc: this.getMotivationDescription(normalizedMotivation),
          motivationTrend: motivationTrend as any,
        },
        update: {
          mood: normalizedMood,
          moodDesc: this.getMoodDescription(normalizedMood),
          moodTrend: moodTrend as any,
          concentration: normalizedConcentration,
          concentrationDesc: this.getConcentrationDescription(normalizedConcentration),
          concentrationTrend: concentrationTrend as any,
          socialization: normalizedSocialization,
          socializationDesc: this.getSocializationDescription(normalizedSocialization),
          socializationTrend: socializationTrend as any,
          motivation: normalizedMotivation,
          motivationDesc: this.getMotivationDescription(normalizedMotivation),
          motivationTrend: motivationTrend as any,
        },
      });

      // Создаем запись в истории эмоциональных состояний
      this.createEmotionalStateHistory(student.id, answers);
    }
  }

  // Метод для создания записи в истории эмоциональных состояний
  private createEmotionalStateHistory(studentId: number, answers: any) {
    // История эмоциональных состояний автоматически сохраняется в FeedbackResponse
    // Здесь можно добавить дополнительную логику обработки, например:
    // - Уведомления при критических изменениях
    // - Агрегация данных для аналитики
    // - Интеграция с внешними системами мониторинга
    
    // Пример: проверка на критические изменения настроения
    if (answers.mood_today && answers.mood_today < 2) {
      console.warn(`Critical mood level detected for student ${studentId}: ${answers.mood_today}`);
      // Здесь можно добавить уведомление администрации или психолога
    }
    
    // Логирование для мониторинга
    console.log(`Emotional state history updated for student ${studentId}`);
  }

  // Метод для расчета изменения тренда
  private calculateTrendChange(previousValue: number, currentValue: number): string {
    const diff = currentValue - previousValue;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'neutral';
  }

  private async updateKPIMetrics(_response: any) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Здесь можно добавить логику обновления KPI на основе ответов
    // Например, агрегировать удовлетворенность студентов для расчета KPI
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
    
    // Общее количество пользователей, которые должны заполнить формы
    const totalUsers = await this.prisma.user.count();
    
    // Количество пользователей, которые заполнили обязательные формы
    const completedUsers = await this.prisma.userFeedbackStatus.count({
      where: {
        hasCompletedMandatory: true,
        currentPeriod,
      },
    });

    return totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;
  }

  // Получение эмоционального состояния студента на основе фидбеков
  async getStudentEmotionalStateFromFeedbacks(studentId: number) {
    // Находим студента по ID
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Получаем последние ответы на эмоциональные опросы
    const recentResponses = await this.prisma.feedbackResponse.findMany({
      where: {
        userId: student.userId,
        isCompleted: true,
      },
      include: {
        template: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    // Анализируем ответы для получения эмоционального состояния
    const emotionalMetrics = this.analyzeEmotionalResponses(recentResponses);
    
    // Извлекаем оценки преподавателей
    const teacherRatings = this.extractTeacherRatings(recentResponses);

    return {
      studentId,
      responses: recentResponses,
      currentState: emotionalMetrics,
      lastUpdated: recentResponses[0]?.submittedAt || null,
      trends: this.calculateEmotionalTrends(recentResponses),
      recommendations: emotionalMetrics ? this.generateEmotionalRecommendations(emotionalMetrics) : [],
      teacherRatings,
    };
  }

  // Получение истории эмоциональных ответов студента
  async getStudentEmotionalHistory(studentId: number, period?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const where: any = {
      userId: student.userId,
      isCompleted: true,
    };

    if (period) {
      where.period = period;
    }

    const responses = await this.prisma.feedbackResponse.findMany({
      where,
      include: {
        template: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      studentId,
      history: responses.map(response => ({
        date: response.submittedAt,
        period: response.period,
        template: response.template.title,
        emotionalData: this.extractEmotionalData(response.answers),
      })),
      period,
    };
  }

  // Анализ эмоциональных ответов
  private analyzeEmotionalResponses(responses: any[]) {
    const emotionalAnswers = responses.flatMap(response => 
      this.extractEmotionalData(response.answers)
    ).filter(data => data !== null);

    if (emotionalAnswers.length === 0) {
      return null; // Возвращаем null если нет данных
    }

    const avgMood = this.calculateAverage(emotionalAnswers, 'mood');
    const avgConcentration = this.calculateAverage(emotionalAnswers, 'concentration');
    const avgSocialization = this.calculateAverage(emotionalAnswers, 'socialization');
    const avgMotivation = this.calculateAverage(emotionalAnswers, 'motivation');

    return {
      mood: {
        value: avgMood,
        description: this.getMoodDescription(avgMood),
        trend: this.calculateTrend(emotionalAnswers, 'mood'),
      },
      concentration: {
        value: avgConcentration,
        description: this.getConcentrationDescription(avgConcentration),
        trend: this.calculateTrend(emotionalAnswers, 'concentration'),
      },
      socialization: {
        value: avgSocialization,
        description: this.getSocializationDescription(avgSocialization),
        trend: this.calculateTrend(emotionalAnswers, 'socialization'),
      },
      motivation: {
        value: avgMotivation,
        description: this.getMotivationDescription(avgMotivation),
        trend: this.calculateTrend(emotionalAnswers, 'motivation'),
      },
    };
  }

  // Извлечение эмоциональных данных из ответов
  private extractEmotionalData(answers: any) {
    const emotional: any = {};

    // Ищем эмоциональные вопросы в ответах
    for (const [key, value] of Object.entries(answers)) {
      if (key.includes('mood') || key.includes('настроение')) {
        emotional.mood = this.normalizeToScale(value, 100);
      }
      if (key.includes('concentration') || key.includes('концентрация')) {
        emotional.concentration = this.normalizeToScale(value, 100);
      }
      if (key.includes('social') || key.includes('общение')) {
        emotional.socialization = this.normalizeToScale(value, 100);
      }
      if (key.includes('motivation') || key.includes('мотивация')) {
        emotional.motivation = this.normalizeToScale(value, 100);
      }
      if (key.includes('satisfaction') || key.includes('удовлетворенность')) {
        emotional.mood = this.normalizeToScale(value, 100);
      }
    }

    return Object.keys(emotional).length > 0 ? emotional : null;
  }

  // Нормализация значений к шкале 0-100
  private normalizeToScale(value: any, targetScale: number): number {
    if (typeof value === 'number') {
      if (value <= 5) {
        // Шкала 1-5 к 0-100
        return Math.round(((value - 1) / 4) * targetScale);
      } else if (value <= 10) {
        // Шкала 1-10 к 0-100
        return Math.round(((value - 1) / 9) * targetScale);
      } else {
        // Уже на шкале 0-100
        return Math.min(Math.max(value, 0), targetScale);
      }
    }
    if (typeof value === 'boolean') {
      return value ? targetScale : 0;
    }
    return 50; // Нейтральное значение по умолчанию
  }

  // Расчет среднего значения
  private calculateAverage(data: any[], field: string): number {
    const values = data.map(item => item[field]).filter(val => val !== undefined);
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 50;
  }

  // Расчет тренда
  private calculateTrend(data: any[], field: string): 'up' | 'down' | 'neutral' {
    const values = data.map(item => item[field]).filter(val => val !== undefined);
    if (values.length < 2) return 'neutral';

    const recent = values.slice(0, Math.ceil(values.length / 2));
    const older = values.slice(Math.ceil(values.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'neutral';
  }

  // Расчет эмоциональных трендов
  private calculateEmotionalTrends(responses: any[]) {
    const timeline = responses.map(response => ({
      date: response.submittedAt,
      data: this.extractEmotionalData(response.answers),
    })).filter(item => item.data).slice(0, 10);

    return timeline;
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
      Object.entries(response.answers || {}).forEach(([questionId, answer]) => {
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
}
