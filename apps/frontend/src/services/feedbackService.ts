import apiClient from './apiClient';

export interface Question {
  id: string;
  question: string;
  type: 'RATING_1_5' | 'RATING_1_10' | 'TEXT' | 'EMOTIONAL_SCALE' | 'YES_NO';
  category: string;
  required?: boolean;
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
  getStudentSatisfactionTemplate(): Partial<FeedbackTemplate> {
    return {
      name: 'student_satisfaction',
      title: 'Оценка качества обучения',
      description: 'Ваше мнение важно для нас. Пожалуйста, оцените различные аспекты обучения.',
      role: 'STUDENT',
      frequency: 'MONTHLY',
      priority: 1,
      questions: [
        {
          id: 'program_volume',
          question: 'Насколько вы довольны объемом учебной программы?',
          type: 'RATING_1_5',
          category: 'academic',
          required: true
        },
        {
          id: 'homework_load',
          question: 'Как вы оцениваете объем домашних заданий?',
          type: 'RATING_1_5',
          category: 'workload',
          required: true
        },
        {
          id: 'teacher_quality',
          question: 'Насколько вы довольны качеством преподавания?',
          type: 'RATING_1_5',
          category: 'teaching',
          required: true
        },
        {
          id: 'mood_today',
          question: 'Как бы вы оценили свое настроение сегодня?',
          type: 'EMOTIONAL_SCALE',
          category: 'emotional_state',
          required: true
        },
        {
          id: 'concentration_level',
          question: 'Как вы оцениваете свою способность концентрироваться на занятиях?',
          type: 'EMOTIONAL_SCALE',
          category: 'emotional_state',
          required: true
        },
        {
          id: 'motivation_level',
          question: 'Насколько вы мотивированы к изучению предмета?',
          type: 'EMOTIONAL_SCALE',
          category: 'emotional_state',
          required: true
        },
        {
          id: 'teacher_comment',
          question: 'Есть ли у вас дополнительные комментарии о преподавателе?',
          type: 'TEXT',
          category: 'feedback',
          required: false
        }
      ]
    };
  }

  getTeacherWorkloadTemplate(): Partial<FeedbackTemplate> {
    return {
      name: 'teacher_workload',
      title: 'Оценка рабочих условий',
      description: 'Помогите нам улучшить условия работы, ответив на несколько вопросов.',
      role: 'TEACHER',
      frequency: 'QUARTERLY',
      priority: 1,
      questions: [
        {
          id: 'work_conditions',
          question: 'Насколько вы довольны условиями работы?',
          type: 'RATING_1_5',
          category: 'workplace',
          required: true
        },
        {
          id: 'workload_balance',
          question: 'Как вы оцениваете свою рабочую нагрузку?',
          type: 'RATING_1_5',
          category: 'workload',
          required: true
        },
        {
          id: 'support_level',
          question: 'Достаточно ли вы получаете поддержки от администрации?',
          type: 'RATING_1_5',
          category: 'support',
          required: true
        },
        {
          id: 'stress_level',
          question: 'Как вы оцениваете уровень стресса на работе?',
          type: 'EMOTIONAL_SCALE',
          category: 'emotional_state',
          required: true
        },
        {
          id: 'recommend_workplace',
          question: 'Порекомендовали бы вы это место работы коллегам?',
          type: 'YES_NO',
          category: 'loyalty',
          required: true
        },
        {
          id: 'improvement_suggestions',
          question: 'Какие улучшения вы бы предложили?',
          type: 'TEXT',
          category: 'feedback',
          required: false
        }
      ]
    };
  }

  getStaffSatisfactionTemplate(): Partial<FeedbackTemplate> {
    return {
      name: 'staff_satisfaction',
      title: 'Удовлетворенность работой',
      description: 'Оцените различные аспекты вашей работы в организации.',
      role: 'HR',
      frequency: 'SEMESTER',
      priority: 1,
      questions: [
        {
          id: 'job_satisfaction',
          question: 'Насколько вы удовлетворены своей работой в целом?',
          type: 'RATING_1_5',
          category: 'satisfaction',
          required: true
        },
        {
          id: 'team_collaboration',
          question: 'Как вы оцениваете сотрудничество в команде?',
          type: 'RATING_1_5',
          category: 'collaboration',
          required: true
        },
        {
          id: 'career_development',
          question: 'Удовлетворены ли вы возможностями карьерного роста?',
          type: 'RATING_1_5',
          category: 'development',
          required: true
        },
        {
          id: 'work_life_balance',
          question: 'Как вы оцениваете баланс между работой и личной жизнью?',
          type: 'EMOTIONAL_SCALE',
          category: 'balance',
          required: true
        }
      ]
    };
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

  // Создание предустановленных шаблонов
  async createDefaultTemplates(): Promise<void> {
    try {
      await this.createTemplate(this.getStudentSatisfactionTemplate());
      await this.createTemplate(this.getTeacherWorkloadTemplate());
      await this.createTemplate(this.getStaffSatisfactionTemplate());
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  }
}

export const feedbackService = new FeedbackService();
