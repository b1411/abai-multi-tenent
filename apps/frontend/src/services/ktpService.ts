import { KtpData } from '../types/ktp';
import apiClient from './apiClient';

export interface KtpListItem {
  id: number;
  studyPlanId: number;
  totalHours: number;
  totalLessons: number;
  completionRate: number;
  sections: any[];
  studyPlan: {
    id: number;
    name: string;
    teacher: {
      id: number;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface KtpStatistics {
  totalKtp: number;
  averageCompletion: number;
  completedKtp: number;
  inProgressKtp: number;
  plannedKtp: number;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  plannedLessons: number;
}

export interface KtpCompletionKpi {
  teacherId: number;
  teacherName: string;
  completionRate: number;
  ktpCount: number;
  totalLessons: number;
  completedLessons: number;
  trend: number;
  rank: number;
}

export interface KtpCompletionKpiResponse {
  teachers: KtpCompletionKpi[];
  statistics: {
    averageCompletion: number;
    topPerformers: number;
    needsImprovement: number;
    onTrack: number;
  };
}

export interface KtpFilters {
  page?: number;
  limit?: number;
  search?: string;
  teacherId?: number;
  studyPlanId?: number;
  status?: 'planned' | 'in_progress' | 'completed';
  minCompletionRate?: number;
  maxCompletionRate?: number;
}

export interface CreateKtpDto {
  studyPlanId: number;
  totalHours: number;
  totalLessons: number;
  sections: {
    title: string;
    description?: string;
    totalHours: number;
    lessons: {
      title: string;
      description?: string;
      duration: number;
      week: number;
      date?: string;
      status: 'planned' | 'in_progress' | 'completed';
      materials?: string[];
      objectives: string[];
      methods: string[];
      assessment?: string;
      homework?: string;
    }[];
    expanded?: boolean;
  }[];
}

class KtpService {
  async getKtpList(filters: KtpFilters = {}): Promise<{
    data: KtpListItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return apiClient.get(`/ktp?${queryParams}`);
  }

  async getKtpById(id: number): Promise<KtpData> {
    return apiClient.get(`/ktp/${id}`);
  }

  async createKtp(data: CreateKtpDto): Promise<KtpData> {
    return apiClient.post(`/ktp`, data);
  }

  async updateKtp(id: number, data: Partial<CreateKtpDto>): Promise<KtpData> {
    return apiClient.put(`/ktp/${id}`, data);
  }

  async deleteKtp(id: number): Promise<{ message: string }> {
    return apiClient.delete(`/ktp/${id}`);
  }

  async getStatistics(filters: KtpFilters = {}): Promise<KtpStatistics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return apiClient.get(`/ktp/statistics/overview?${queryParams}`);
  }

  async getCompletionKpi(filters: KtpFilters = {}): Promise<KtpCompletionKpiResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return apiClient.get(`/ktp/kpi/completion?${queryParams}`);
  }

  async updateLessonStatus(
    ktpId: number, 
    lessonId: number, 
    status: 'planned' | 'in_progress' | 'completed'
  ): Promise<KtpData> {
    return apiClient.put(`/ktp/${ktpId}/lesson/${lessonId}/status`, { status });
  }

  async getKtpByTeacher(teacherId: number, filters: KtpFilters = {}): Promise<{
    data: KtpListItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return apiClient.get(`/ktp/teacher/${teacherId}?${queryParams}`);
  }

  async generateFromStudyPlan(studyPlanId: number): Promise<{
    message: string;
    ktp: KtpData;
  }> {
    return apiClient.post(`/ktp/generate/${studyPlanId}`);
  }
}

export const ktpService = new KtpService();
