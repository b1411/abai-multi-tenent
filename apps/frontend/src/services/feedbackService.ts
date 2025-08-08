import apiClient from './apiClient';

export interface Question {
  id: string;
  question: string;
  type: 'RATING_1_5' | 'RATING_1_10' | 'TEXT' | 'EMOTIONAL_SCALE' | 'YES_NO' | 'TEACHER_RATING';
  category: string;
  required?: boolean;
  teacherIds?: number[]; // Для вопросов типа TEACHER_RATING
}

export interface FeedbackTemplate {
  id: number;
  name: string;
  title: string;
  description?: string;
  questions: Question[];
  role: string;
  frequency: string;
  priority: number;
  isActive: boolean;
}

export interface FeedbackResponse {
  id: number;
  templateId: number;
  answers: any;
  isCompleted: boolean;
  submittedAt?: string;
  period?: string;
}

export interface MandatoryFeedbackStatus {
  hasCompletedMandatory: boolean;
  pendingTemplates: FeedbackTemplate[];
  currentPeriod: string;
}

export interface CreateFeedbackResponseDto {
  templateId: number;
  answers: any;
  isCompleted?: boolean;
  period?: string;
  aboutTeacherId?: number; // Новое поле для связи с преподавателем
}

class FeedbackService {
  // Проверка обязательных форм
  async checkMandatoryFeedback(): Promise<MandatoryFeedbackStatus> {
    return await apiClient.get<MandatoryFeedbackStatus>('/feedback/mandatory-check');
  }

  // Получение шаблонов для текущего пользователя
  async getMyTemplates(): Promise<FeedbackTemplate[]> {
    return await apiClient.get<FeedbackTemplate[]>('/feedback/templates/my');
  }

  // Получение всех активных шаблонов (для админов)
  async getAllTemplates(): Promise<FeedbackTemplate[]> {
    return await apiClient.get<FeedbackTemplate[]>('/feedback/templates');
  }

  // Отправка ответа на форму
  async submitResponse(data: CreateFeedbackResponseDto): Promise<FeedbackResponse> {
    return await apiClient.post<FeedbackResponse>('/feedback/responses', data);
  }

  // Создание шаблона (только для админов)
  async createTemplate(template: Partial<FeedbackTemplate>): Promise<FeedbackTemplate> {
    return await apiClient.post<FeedbackTemplate>('/feedback/templates', template);
  }

  // Получение аналитики
  async getAnalytics(templateId?: number, period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (templateId) params.append('templateId', templateId.toString());
    if (period) params.append('period', period);

    return await apiClient.get<any>(`/feedback/analytics?${params.toString()}`);
  }

  // Шаблоны вопросов для разных ролей
  async getStudentSatisfactionTemplate(): Promise<FeedbackTemplate | null> {
    const templates = await apiClient.get<FeedbackTemplate[]>('/feedback/templates?role=STUDENT');
    return templates.length > 0 ? templates[0] : null;
  }

  async getTeacherWorkloadTemplate(): Promise<FeedbackTemplate | null> {
    const templates = await apiClient.get<FeedbackTemplate[]>('/feedback/templates?role=TEACHER');
    return templates.length > 0 ? templates[0] : null;
  }

  async getStaffSatisfactionTemplate(): Promise<FeedbackTemplate | null> {
    const templates = await apiClient.get<FeedbackTemplate[]>('/feedback/templates?role=HR');
    return templates.length > 0 ? templates[0] : null;
  }

  // Обновление шаблона
  async updateTemplate(id: number, template: Partial<FeedbackTemplate>): Promise<FeedbackTemplate> {
    return await apiClient.put<FeedbackTemplate>(`/feedback/templates/${id}`, template);
  }

  // Удаление шаблона
  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/feedback/templates/${id}`);
  }

  // Переключение активности шаблона
  async toggleTemplateActive(id: number): Promise<FeedbackTemplate> {
    return await apiClient.put<FeedbackTemplate>(`/feedback/templates/${id}/toggle-active`);
  }

  // Получение ответов на шаблон
  async getTemplateResponses(id: number, period?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);

    return await apiClient.get<any[]>(`/feedback/templates/${id}/responses?${params.toString()}`);
  }

  // Получение статистики
  async getStatistics(period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);

    return await apiClient.get<any>(`/feedback/statistics?${params.toString()}`);
  }

  // Сброс статуса обязательной формы
  async resetMandatoryStatus(userId: number): Promise<void> {
    await apiClient.put(`/feedback/users/${userId}/reset-mandatory`);
  }

  // Получение эмоционального состояния студента на основе фидбеков
  async getStudentEmotionalStateFromFeedbacks(studentId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/feedback/students/${studentId}/emotional-state`);
      
      // Обрабатываем данные из фидбеков для психоэмоционального портрета
      if (response && (response as any).responses) {
        const processedData = this.processFeedbackEmotionalData(response);
        return processedData;
      }
      
      return response;
    } catch (error) {
      console.warn('Не удалось загрузить данные из фидбеков:', error);
      return null;
    }
  }

  // Обработка данных фидбеков для психоэмоционального портрета
  private processFeedbackEmotionalData(feedbackData: any): any {
    if (!feedbackData || !feedbackData.responses || feedbackData.responses.length === 0) {
      return null;
    }

    const responses = feedbackData.responses;
    const latestResponse = responses[0]; // Предполагаем, что ответы отсортированы по дате

    // Извлекаем эмоциональные показатели из последнего ответа
    const emotionalMetrics = this.extractEmotionalMetrics(latestResponse.answers);
    
    // Анализируем тренды на основе исторических данных
    const trends = this.analyzeTrends(responses);
    
    // Генерируем рекомендации
    const recommendations = this.generateRecommendations(emotionalMetrics, trends);

    return {
      currentState: {
        mood: {
          value: emotionalMetrics.mood || 50,
          description: this.getMoodDescription(emotionalMetrics.mood || 50),
          trend: trends.mood || 'stable'
        },
        concentration: {
          value: emotionalMetrics.concentration || 50,
          description: this.getConcentrationDescription(emotionalMetrics.concentration || 50),
          trend: trends.concentration || 'stable'
        },
        socialization: {
          value: emotionalMetrics.socialization || 50,
          description: this.getSocializationDescription(emotionalMetrics.socialization || 50),
          trend: trends.socialization || 'stable'
        },
        motivation: {
          value: emotionalMetrics.motivation || 50,
          description: this.getMotivationDescription(emotionalMetrics.motivation || 50),
          trend: trends.motivation || 'stable'
        }
      },
      lastUpdated: latestResponse.submittedAt,
      trends: this.formatTrendsData(responses),
      recommendations: recommendations,
      teacherRatings: this.extractTeacherRatings(responses)
    };
  }

  // Извлечение эмоциональных метрик из ответов
  private extractEmotionalMetrics(answers: any): any {
    const metrics: any = {};

    Object.entries(answers).forEach(([questionId, answer]) => {
      // Анализируем тип вопроса и извлекаем соответствующие метрики
      if (questionId.includes('mood') || questionId.includes('настроение')) {
        metrics.mood = typeof answer === 'number' ? answer : this.convertToScale(answer);
      }
      if (questionId.includes('concentration') || questionId.includes('концентрация')) {
        metrics.concentration = typeof answer === 'number' ? answer : this.convertToScale(answer);
      }
      if (questionId.includes('socialization') || questionId.includes('общение')) {
        metrics.socialization = typeof answer === 'number' ? answer : this.convertToScale(answer);
      }
      if (questionId.includes('motivation') || questionId.includes('мотивация')) {
        metrics.motivation = typeof answer === 'number' ? answer : this.convertToScale(answer);
      }
    });

    return metrics;
  }

  // Извлечение оценок преподавателей
  private extractTeacherRatings(responses: any[]): any[] {
    const teacherRatings: any[] = [];

    responses.forEach(response => {
      Object.entries(response.answers || {}).forEach(([questionId, answer]) => {
        // Если это вопрос с оценкой преподавателей
        if (typeof answer === 'object' && answer !== null) {
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

  // Анализ трендов
  private analyzeTrends(responses: any[]): any {
    if (responses.length < 2) return {};

    const trends: any = {};
    const metrics = ['mood', 'concentration', 'socialization', 'motivation'];

    metrics.forEach(metric => {
      const values = responses.map(r => this.extractEmotionalMetrics(r.answers)[metric]).filter(v => v !== undefined);
      if (values.length >= 2) {
        const latest = values[0];
        const previous = values[1];
        trends[metric] = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';
      }
    });

    return trends;
  }

  // Генерация рекомендаций
  private generateRecommendations(metrics: any, trends: any): any[] {
    const recommendations: any[] = [];

    // Рекомендации по настроению
    if (metrics.mood && metrics.mood < 30) {
      recommendations.push({
        type: 'mood',
        priority: 'high',
        message: 'Низкое настроение студента требует внимания. Рекомендуется беседа с психологом.'
      });
    }

    // Рекомендации по концентрации
    if (metrics.concentration && metrics.concentration < 40) {
      recommendations.push({
        type: 'concentration',
        priority: 'medium',
        message: 'Проблемы с концентрацией. Рекомендуется пересмотр учебной нагрузки и методов обучения.'
      });
    }

    // Рекомендации по социализации
    if (metrics.socialization && metrics.socialization < 35) {
      recommendations.push({
        type: 'socialization',
        priority: 'medium',
        message: 'Низкий уровень социализации. Рекомендуется включение в групповые активности.'
      });
    }

    // Рекомендации по мотивации
    if (metrics.motivation && metrics.motivation < 30) {
      recommendations.push({
        type: 'motivation',
        priority: 'high',
        message: 'Критически низкая мотивация. Требуется индивидуальная работа с куратором.'
      });
    }

    // Рекомендации по трендам
    if (trends.mood === 'down' && trends.concentration === 'down') {
      recommendations.push({
        type: 'general',
        priority: 'high',
        message: 'Негативная динамика по ключевым показателям. Требуется комплексная поддержка.'
      });
    }

    return recommendations;
  }

  // Форматирование данных трендов для графика
  private formatTrendsData(responses: any[]): any[] {
    return responses.map(response => {
      const metrics = this.extractEmotionalMetrics(response.answers);
      return {
        date: response.submittedAt,
        mood: metrics.mood || 50,
        concentration: metrics.concentration || 50,
        socialization: metrics.socialization || 50,
        motivation: metrics.motivation || 50
      };
    }).reverse(); // Сортируем по возрастанию даты
  }

  // Вспомогательные методы для описаний
  private getMoodDescription(value: number): string {
    if (value >= 80) return 'Отличное настроение';
    if (value >= 60) return 'Хорошее настроение';
    if (value >= 40) return 'Нормальное настроение';
    if (value >= 20) return 'Плохое настроение';
    return 'Очень плохое настроение';
  }

  private getConcentrationDescription(value: number): string {
    if (value >= 80) return 'Отличная концентрация';
    if (value >= 60) return 'Хорошая концентрация';
    if (value >= 40) return 'Нормальная концентрация';
    if (value >= 20) return 'Слабая концентрация';
    return 'Очень слабая концентрация';
  }

  private getSocializationDescription(value: number): string {
    if (value >= 80) return 'Отличное общение';
    if (value >= 60) return 'Хорошее общение';
    if (value >= 40) return 'Нормальное общение';
    if (value >= 20) return 'Слабое общение';
    return 'Проблемы с общением';
  }

  private getMotivationDescription(value: number): string {
    if (value >= 80) return 'Очень высокая мотивация';
    if (value >= 60) return 'Высокая мотивация';
    if (value >= 40) return 'Нормальная мотивация';
    if (value >= 20) return 'Низкая мотивация';
    return 'Очень низкая мотивация';
  }

  private convertToScale(value: any): number {
    if (typeof value === 'boolean') return value ? 80 : 20;
    if (typeof value === 'string') {
      // Конвертируем текстовые ответы в числовую шкалу
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('отлично') || lowerValue.includes('очень хорошо')) return 90;
      if (lowerValue.includes('хорошо')) return 70;
      if (lowerValue.includes('нормально') || lowerValue.includes('удовлетворительно')) return 50;
      if (lowerValue.includes('плохо')) return 30;
      if (lowerValue.includes('очень плохо')) return 10;
    }
    return 50; // дефолтное значение
  }

  // Получение истории эмоциональных ответов студента
  async getStudentEmotionalHistory(studentId: number, period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    return await apiClient.get(`/feedback/students/${studentId}/emotional-history?${params.toString()}`);
  }

  // Получение анонимизированных ответов студентов
  async getAnonymizedResponses(options: {
    templateId?: number;
    period?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options.templateId) params.append('templateId', options.templateId.toString());
    if (options.period) params.append('period', options.period);
    params.append('page', (options.page || 1).toString());
    params.append('limit', (options.limit || 20).toString());

    return await apiClient.get(`/feedback/responses?${params.toString()}`);
  }

  // Создание предустановленных шаблонов через новый API
  async createDefaultTemplates(): Promise<any> {
    return await apiClient.post<any>('/feedback/templates/create-defaults');
  }

  // Создание динамических форм оценки преподавателей для всех студентов
  async createDynamicTeacherEvaluations(): Promise<any> {
    return await apiClient.post<any>('/feedback/templates/create-teacher-evaluations');
  }

  // Создание комплексных KPI опросов для фидбек-системы
  async createKpiSurveys(): Promise<any> {
    return await apiClient.post<any>('/feedback/templates/create-kpi-surveys');
  }
}

export const feedbackService = new FeedbackService();
