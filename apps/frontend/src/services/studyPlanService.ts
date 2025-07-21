import apiClient from './apiClient';
import { StudyPlan, StudyPlanFilters, StudyPlanResponse, Group, Teacher } from '../types/studyPlan';

class StudyPlanService {
  private baseUrl = '/study-plans';

  async getStudyPlans(filters: StudyPlanFilters = {}): Promise<StudyPlanResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<StudyPlanResponse>(`${this.baseUrl}?${params.toString()}`);
  }

  async getMyStudyPlans(filters: StudyPlanFilters = {}): Promise<StudyPlanResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<StudyPlanResponse>(`${this.baseUrl}/me?${params.toString()}`);
  }

  async getStudyPlan(id: string): Promise<StudyPlan> {
    return apiClient.get<StudyPlan>(`${this.baseUrl}/${id}`);
  }

  async createStudyPlan(data: {
    name: string;
    description?: string;
    teacherId: number;
    groups: { id: number }[];
    normativeWorkload?: number;
  }): Promise<StudyPlan> {
    return apiClient.post<StudyPlan>(this.baseUrl, data);
  }

  async updateStudyPlan(id: string, data: {
    name?: string;
    description?: string;
    teacherId?: number;
    groups?: { id: number }[];
    normativeWorkload?: number;
  }): Promise<StudyPlan> {
    return apiClient.patch<StudyPlan>(`${this.baseUrl}/${id}`, data);
  }

  async deleteStudyPlan(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Получаем группы из основного API групп
  async getGroups(): Promise<Group[]> {
    return apiClient.get<Group[]>('/groups');
  }

  // Получаем преподавателей из API пользователей по роли
  async getTeachers(): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>('/users/role/TEACHER');
  }

  // Ролевая фильтрация будет на backend, поэтому используем те же методы
  async getAvailableGroups(_userRole?: string, _userId?: number): Promise<Group[]> {
    // Backend сам фильтрует данные по роли через JWT токен
    return this.getGroups();
  }

  async getAvailableTeachers(_userRole?: string, _userId?: number): Promise<Teacher[]> {
    // Backend сам фильтрует данные по роли через JWT токен
    return this.getTeachers();
  }
}

export const studyPlanService = new StudyPlanService();
