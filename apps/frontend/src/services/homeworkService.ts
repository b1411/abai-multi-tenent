import apiClient from './apiClient';
import { 
  Homework, 
  HomeworkFilters, 
  CreateHomeworkRequest, 
  UpdateHomeworkRequest,
  HomeworkSubmission,
  HomeworkSubmitRequest
} from '../types/homework';
import { PaginateResponseDto } from '../types/api';

export class HomeworkService {
  private baseUrl = '/homework';

  // Получить список домашних заданий
  async getHomeworks(filters: HomeworkFilters = {}): Promise<PaginateResponseDto<Homework>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.lessonId) params.append('lessonId', filters.lessonId.toString());
    if (filters.studentId) params.append('studentId', filters.studentId.toString());
    if (filters.teacherId) params.append('teacherId', filters.teacherId.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return await apiClient.get<PaginateResponseDto<Homework>>(url);
  }

  // Получить мои домашние задания (для студентов)
  async getMyHomeworks(filters: HomeworkFilters = {}): Promise<PaginateResponseDto<Homework>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.lessonId) params.append('lessonId', filters.lessonId.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/me?${queryString}` : `${this.baseUrl}/me`;
    
    return await apiClient.get<PaginateResponseDto<Homework>>(url);
  }

  // Получить домашнее задание по ID
  async getHomework(id: number): Promise<Homework> {
    return await apiClient.get<Homework>(`${this.baseUrl}/${id}`);
  }

  // Создать домашнее задание
  async createHomework(data: CreateHomeworkRequest): Promise<Homework> {
    return await apiClient.post<Homework>(this.baseUrl, data);
  }

  // Обновить домашнее задание
  async updateHomework(id: number, data: UpdateHomeworkRequest): Promise<Homework> {
    return await apiClient.patch<Homework>(`${this.baseUrl}/${id}`, data);
  }

  // Удалить домашнее задание
  async deleteHomework(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Получить домашние задания для урока
  async getHomeworksByLesson(lessonId: number): Promise<Homework[]> {
    return await apiClient.get<Homework[]>(`/lessons/${lessonId}/homework`);
  }

  // Получить отправки домашнего задания
  async getHomeworkSubmissions(homeworkId: number): Promise<HomeworkSubmission[]> {
    return await apiClient.get<HomeworkSubmission[]>(`${this.baseUrl}/${homeworkId}/submissions`);
  }

  // Отправить домашнее задание (студент)
  async submitHomework(homeworkId: number, data: HomeworkSubmitRequest): Promise<HomeworkSubmission> {
    return await apiClient.post<HomeworkSubmission>(`${this.baseUrl}/${homeworkId}/submit`, data);
  }

  // Обновить отправленное домашнее задание (студент)
  async updateHomeworkSubmission(homeworkId: number, data: HomeworkSubmitRequest): Promise<HomeworkSubmission> {
    return await apiClient.patch<HomeworkSubmission>(`${this.baseUrl}/${homeworkId}/update-submission`, data);
  }

  // Оценить домашнее задание (преподаватель)
  async gradeHomework(submissionId: number, score: number, comment?: string): Promise<HomeworkSubmission> {
    return await apiClient.patch<HomeworkSubmission>(`${this.baseUrl}/submissions/${submissionId}/grade`, {
      score,
      comment
    });
  }

  // Получить статистику домашних заданий
  async getHomeworkStats(filters: Pick<HomeworkFilters, 'lessonId' | 'studentId' | 'teacherId'> = {}): Promise<{
    total: number;
    pending: number;
    submitted: number;
    graded: number;
    overdue: number;
  }> {
    const params = new URLSearchParams();
    if (filters.lessonId) params.append('lessonId', filters.lessonId.toString());
    if (filters.studentId) params.append('studentId', filters.studentId.toString());
    if (filters.teacherId) params.append('teacherId', filters.teacherId.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/stats?${queryString}` : `${this.baseUrl}/stats`;
    
    return await apiClient.get<{
      total: number;
      pending: number;
      submitted: number;
      graded: number;
      overdue: number;
    }>(url);
  }
}

export const homeworkService = new HomeworkService();
