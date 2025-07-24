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

  // Создание предустановленных шаблонов
  async createDefaultTemplates(): Promise<void> {
    try {
      const studentTemplate = await this.getStudentSatisfactionTemplate();
      if (studentTemplate) {
        await this.createTemplate(studentTemplate);
      }
      const teacherTemplate = await this.getTeacherWorkloadTemplate();
      if (teacherTemplate) {
        await this.createTemplate(teacherTemplate);
      }
      const staffTemplate = await this.getStaffSatisfactionTemplate();
      if (staffTemplate) {
        await this.createTemplate(staffTemplate);
      }
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  }
}

export const feedbackService = new FeedbackService();
