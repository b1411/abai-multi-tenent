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
    return await apiClient.get(`/feedback/students/${studentId}/emotional-state`);
  }

  // Получение истории эмоциональных ответов студента
  async getStudentEmotionalHistory(studentId: number, period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    return await apiClient.get(`/feedback/students/${studentId}/emotional-history?${params.toString()}`);
  }

  // Создание предустановленных шаблонов
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'student_emotional_wellbeing',
        title: 'Психоэмоциональное состояние студента',
        description: 'Еженедельная оценка психоэмоционального состояния и благополучия студентов',
        role: 'STUDENT',
        frequency: 'WEEKLY',
        priority: 2,
        isActive: true,
        questions: [
          {
            id: 'mood_today',
            question: 'Как бы вы оценили ваше настроение за последнюю неделю?',
            type: 'EMOTIONAL_SCALE' as const,
            category: 'mood',
            required: true
          },
          {
            id: 'concentration_level',
            question: 'Насколько легко вам было концентрироваться на учебе?',
            type: 'EMOTIONAL_SCALE' as const,
            category: 'concentration',
            required: true
          },
          {
            id: 'socialization_level',
            question: 'Как вы оцениваете ваше общение с однокурсниками?',
            type: 'EMOTIONAL_SCALE' as const,
            category: 'socialization',
            required: true
          },
          {
            id: 'motivation_level',
            question: 'Насколько вы мотивированы к учебе?',
            type: 'EMOTIONAL_SCALE' as const,
            category: 'motivation',
            required: true
          },
          {
            id: 'stress_level',
            question: 'Как часто вы испытывали стресс за последнюю неделю?',
            type: 'RATING_1_5' as const,
            category: 'general',
            required: true
          },
          {
            id: 'sleep_quality',
            question: 'Как вы оцениваете качество своего сна?',
            type: 'RATING_1_5' as const,
            category: 'general',
            required: true
          },
          {
            id: 'need_support',
            question: 'Нужна ли вам помощь психолога или куратора?',
            type: 'YES_NO' as const,
            category: 'support',
            required: true
          },
          {
            id: 'emotional_comments',
            question: 'Есть ли что-то, чем вы хотели бы поделиться?',
            type: 'TEXT' as const,
            category: 'feedback',
            required: false
          }
        ]
      },
      {
        name: 'student_satisfaction',
        title: 'Оценка удовлетворенности студентов',
        description: 'Ежемесячная оценка качества обучения и удовлетворенности студентов',
        role: 'STUDENT',
        frequency: 'MONTHLY',
        priority: 1,
        isActive: true,
        questions: [
          {
            id: 'overall_satisfaction',
            question: 'Насколько вы удовлетворены качеством обучения?',
            type: 'RATING_1_5' as const,
            category: 'satisfaction',
            required: true
          },
          {
            id: 'teacher_rating',
            question: 'Оцените работу преподавателей',
            type: 'RATING_1_5' as const,
            category: 'teaching',
            required: true
          },
          {
            id: 'course_difficulty',
            question: 'Как вы оцениваете сложность курса?',
            type: 'RATING_1_5' as const,
            category: 'content',
            required: true
          },
          {
            id: 'recommendations',
            question: 'Порекомендовали бы вы наше учебное заведение?',
            type: 'YES_NO' as const,
            category: 'loyalty',
            required: true
          },
          {
            id: 'suggestions',
            question: 'Какие у вас есть предложения по улучшению?',
            type: 'TEXT' as const,
            category: 'feedback',
            required: false
          }
        ]
      },
      {
        name: 'teacher_workload',
        title: 'Оценка рабочей нагрузки преподавателей',
        description: 'Квартальная оценка рабочей нагрузки и удовлетворенности работой',
        role: 'TEACHER',
        frequency: 'QUARTERLY',
        priority: 1,
        isActive: true,
        questions: [
          {
            id: 'workload_level',
            question: 'Как вы оцениваете свою текущую рабочую нагрузку?',
            type: 'RATING_1_5' as const,
            category: 'workload',
            required: true
          },
          {
            id: 'job_satisfaction',
            question: 'Насколько вы удовлетворены своей работой?',
            type: 'RATING_1_5' as const,
            category: 'satisfaction',
            required: true
          },
          {
            id: 'student_motivation',
            question: 'Как вы оцениваете мотивацию студентов?',
            type: 'RATING_1_5' as const,
            category: 'students',
            required: true
          },
          {
            id: 'support_needed',
            question: 'Нужна ли вам дополнительная поддержка?',
            type: 'YES_NO' as const,
            category: 'support',
            required: true
          },
          {
            id: 'improvements',
            question: 'Что можно улучшить в рабочем процессе?',
            type: 'TEXT' as const,
            category: 'feedback',
            required: false
          }
        ]
      },
      {
        name: 'staff_satisfaction',
        title: 'Удовлетворенность сотрудников',
        description: 'Полугодовая оценка удовлетворенности работой административного персонала',
        role: 'HR',
        frequency: 'SEMESTER',
        priority: 0,
        isActive: true,
        questions: [
          {
            id: 'work_environment',
            question: 'Как вы оцениваете рабочую атмосферу?',
            type: 'RATING_1_5' as const,
            category: 'environment',
            required: true
          },
          {
            id: 'career_development',
            question: 'Удовлетворены ли вы возможностями карьерного роста?',
            type: 'RATING_1_5' as const,
            category: 'development',
            required: true
          },
          {
            id: 'work_life_balance',
            question: 'Как вы оцениваете баланс работы и личной жизни?',
            type: 'RATING_1_5' as const,
            category: 'balance',
            required: true
          },
          {
            id: 'stay_recommendation',
            question: 'Планируете ли вы продолжать работу в организации?',
            type: 'YES_NO' as const,
            category: 'retention',
            required: true
          }
        ]
      }
    ];

    for (const template of defaultTemplates) {
      try {
        await this.createTemplate(template);
      } catch (error: any) {
        // Игнорируем ошибки дублирования, продолжаем создавать остальные
        if (!error.message?.includes('уже существует')) {
          throw error;
        }
      }
    }
  }
}

export const feedbackService = new FeedbackService();
