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
        data: createTemplateDto,
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

  // Ответы на формы
  async submitResponse(userId: number, responseDto: CreateFeedbackResponseDto) {
    const currentPeriod = this.getCurrentPeriod();
    
    const response = await this.prisma.feedbackResponse.upsert({
      where: {
        userId_templateId_period: {
          userId,
          templateId: responseDto.templateId,
          period: responseDto.period || currentPeriod,
        },
      },
      create: {
        userId,
        templateId: responseDto.templateId,
        answers: responseDto.answers,
        isCompleted: responseDto.isCompleted || false,
        period: responseDto.period || currentPeriod,
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
      await this.prisma.emotionalState.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          mood: answers.mood_today || 50,
          moodDesc: this.getMoodDescription(answers.mood_today),
          moodTrend: 'neutral',
          concentration: answers.concentration_level || 50,
          concentrationDesc: this.getConcentrationDescription(answers.concentration_level),
          concentrationTrend: 'neutral',
          socialization: answers.socialization_level || 50,
          socializationDesc: this.getSocializationDescription(answers.socialization_level),
          socializationTrend: 'neutral',
          motivation: answers.motivation_level || 50,
          motivationDesc: this.getMotivationDescription(answers.motivation_level),
          motivationTrend: 'neutral',
        },
        update: {
          mood: answers.mood_today || 50,
          moodDesc: this.getMoodDescription(answers.mood_today),
          concentration: answers.concentration_level || 50,
          concentrationDesc: this.getConcentrationDescription(answers.concentration_level),
          socialization: answers.socialization_level || 50,
          socializationDesc: this.getSocializationDescription(answers.socialization_level),
          motivation: answers.motivation_level || 50,
          motivationDesc: this.getMotivationDescription(answers.motivation_level),
        },
      });
    }
  }

  private async updateKPIMetrics(response: any) {
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

  private calculateAverageRatings(responses: any[]) {
    // Логика расчета средних оценок по различным аспектам
    return {};
  }

  private calculateTrends(responses: any[]) {
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
}
