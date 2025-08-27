import apiClient from './apiClient';
import { StudyPlan, StudyPlanFilters, StudyPlanResponse, Group, Teacher } from '../types/studyPlan';

export interface ImportProgressStep {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface ImportJobProgress {
  jobId: string;
  steps: ImportProgressStep[];
  percent: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  result?: {
    studyPlanId: number;
    curriculumPlanId: number;
    totalLessons: number;
  };
  finished: boolean;
}

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

  async getMyChildrenStudyPlans(filters: StudyPlanFilters = {}): Promise<StudyPlanResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return apiClient.get<StudyPlanResponse>(`${this.baseUrl}/my-children?${params.toString()}`);
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

  async importFromFile(
    params: {
      file: File;
      teacherId: number;
      groupIds: number[];
      name?: string;
      description?: string;
    },
    callbacks?: {
      onUploadProgress?: (percent: number) => void;
    }
  ): Promise<{ studyPlanId: number; curriculumPlanId: number; totalLessons: number }> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('teacherId', params.teacherId.toString());
    params.groupIds.forEach(id => formData.append('groupIds', id.toString()));
    if (params.name) formData.append('name', params.name);
    if (params.description) formData.append('description', params.description);
    return apiClient.postFormData(`${this.baseUrl}/import-file`, formData, callbacks?.onUploadProgress);
  }

  async importFromFileAsync(
    params: {
      file: File;
      teacherId: number;
      groupIds: number[];
      name?: string;
      description?: string;
    },
    callbacks?: {
      onUploadProgress?: (percent: number) => void;
    }
  ): Promise<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('teacherId', params.teacherId.toString());
    params.groupIds.forEach(id => formData.append('groupIds', id.toString()));
    if (params.name) formData.append('name', params.name);
    if (params.description) formData.append('description', params.description);
    return apiClient.postFormData<{ jobId: string }>(`${this.baseUrl}/import-file-async`, formData, callbacks?.onUploadProgress);
  }

  async getImportProgress(jobId: string): Promise<ImportJobProgress> {
    return apiClient.get<ImportJobProgress>(`${this.baseUrl}/import-progress/${jobId}`);
  }
}

/**
 * Подписка на SSE прогресс импорта.
 * Возвращает функцию отмены.
 */
export const studyPlanService = new StudyPlanService();
export function subscribeStudyPlanImportProgress(
  jobId: string,
  handlers: {
    onProgress: (p: ImportJobProgress) => void;
    onError?: (err: any) => void;
  }
): () => void {
  const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const token = localStorage.getItem('token') || '';
  const url = `${baseURL}/study-plans/import-progress/${jobId}/sse?access_token=${encodeURIComponent(token)}`;
  let closed = false;
  let es: EventSource | null = null;
  try {
    es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        const payload: ImportJobProgress = parsed?.data || parsed;
        if (payload?.jobId === jobId) {
          handlers.onProgress(payload);
        }
      } catch (err) {
        handlers.onError?.(err);
      }
    };
    es.onerror = (err) => {
      handlers.onError?.(err);
      if (!closed) {
        try { es?.close(); } catch (closeErr) {
          // ignore close error
        }
      }
    };
  } catch (err) {
    handlers.onError?.(err);
  }
  return () => {
    closed = true;
    try { es?.close(); } catch (closeErr) {
      // ignore close error
    }
  };
}
