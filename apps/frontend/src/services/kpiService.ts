import apiClient from './apiClient';
import type {
  KpiOverviewResponse,
  TeacherKpiResponse,
  DepartmentKpiResponse,
  KpiTrendsResponse,
  KpiGoalsResponse,
  KpiComparisonResponse,
  KpiFilter,
  KpiRecalculationResponse,
  KpiCalculationStatusResponse,
} from '../types/kpi';

export const kpiService = {
  getOverview: async (filter?: KpiFilter): Promise<KpiOverviewResponse> => {
    const params = new URLSearchParams();
    if (filter?.department) params.append('department', filter.department);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    return await apiClient.get<KpiOverviewResponse>(`/kpi/overview?${params}`);
  },

  getTeacherKpi: async (filter?: KpiFilter): Promise<TeacherKpiResponse> => {
    const params = new URLSearchParams();
    if (filter?.department) params.append('department', filter.department);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.teacherId) params.append('teacherId', filter.teacherId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    return await apiClient.get<TeacherKpiResponse>(`/kpi/teachers?${params}`);
  },

  getDepartmentKpi: async (filter?: KpiFilter): Promise<DepartmentKpiResponse> => {
    const params = new URLSearchParams();
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    return await apiClient.get<DepartmentKpiResponse>(`/kpi/departments?${params}`);
  },

  getTrends: async (filter?: KpiFilter): Promise<KpiTrendsResponse> => {
    const params = new URLSearchParams();
    if (filter?.department) params.append('department', filter.department);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    return await apiClient.get<KpiTrendsResponse>(`/kpi/trends?${params}`);
  },

  getGoals: async (filter?: KpiFilter): Promise<KpiGoalsResponse> => {
    const params = new URLSearchParams();
    if (filter?.department) params.append('department', filter.department);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    return await apiClient.get<KpiGoalsResponse>(`/kpi/goals?${params}`);
  },

  getComparison: async (filter?: KpiFilter): Promise<KpiComparisonResponse> => {
    const params = new URLSearchParams();
    if (filter?.department) params.append('department', filter.department);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    return await apiClient.get<KpiComparisonResponse>(`/kpi/comparison?${params}`);
  },

  // Экспорт KPI данных
  exportKpi: async (filter?: KpiFilter, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filter?.department) params.append('department', filter.department);
    if (filter?.period) params.append('period', filter.period);
    if (filter?.teacherId) params.append('teacherId', filter.teacherId.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    params.append('format', format);

    return await apiClient.getBlob(`/kpi/export?${params}`);
  },

  // Экспорт отчета по конкретному преподавателю
  exportTeacherReport: async (teacherId: number, format: 'xlsx' | 'pdf' = 'pdf'): Promise<Blob> => {
    return await apiClient.getBlob(`/kpi/teachers/${teacherId}/export?format=${format}`);
  },

  // Settings management
  getSettings: async () => {
    return await apiClient.get(`/kpi/settings`);
  },

  updateSettings: async (settings: any) => {
    return await apiClient.put(`/kpi/settings`, settings);
  },

  // Goals management
  createGoal: async (goalData: any) => {
    return await apiClient.post(`/kpi/goals`, goalData);
  },

  updateGoal: async (goalId: number, goalData: any) => {
    return await apiClient.put(`/kpi/goals/${goalId}`, goalData);
  },

  deleteGoal: async (goalId: number) => {
    return await apiClient.delete(`/kpi/goals/${goalId}`);
  },

  // Manual KPI recalculation
  recalculateKpi: async (): Promise<KpiRecalculationResponse> => {
    return await apiClient.post<KpiRecalculationResponse>(`/kpi/recalculate`);
  },

  getCalculationStatus: async (): Promise<KpiCalculationStatusResponse> => {
    return await apiClient.get<KpiCalculationStatusResponse>(`/kpi/calculation-status`);
  },

  // Get detailed teacher KPI information
  getTeacherKpiDetails: async (teacherId: number) => {
    return await apiClient.get(`/kpi/teachers/${teacherId}/details`);
  },

  // Achievements management
  createAchievement: async (achievementData: any) => {
    return await apiClient.post(`/kpi/achievements`, achievementData);
  },

  createOlympiadResult: async (olympiadData: any) => {
    return await apiClient.post(`/kpi/olympiad-results`, olympiadData);
  },

  createStudentAdmission: async (admissionData: any) => {
    return await apiClient.post(`/kpi/student-admissions`, admissionData);
  },

  getAchievements: async (teacherId?: number): Promise<{ achievements: any[] }> => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId.toString());
    return await apiClient.get(`/kpi/achievements?${params}`);
  },

  getStudents: async (teacherId: number) => {
    return await apiClient.get(`/students?teacherId=${teacherId}`);
  },

  // Update methods for editing KPI achievements
  updateAchievement: async (achievementId: number, achievementData: any) => {
    return await apiClient.put(`/kpi/achievements/${achievementId}`, achievementData);
  },

  updateOlympiadResult: async (resultId: number, resultData: any) => {
    return await apiClient.put(`/kpi/olympiad-results/${resultId}`, resultData);
  },

  updateStudentAdmission: async (admissionId: number, admissionData: any) => {
    return await apiClient.put(`/kpi/student-admissions/${admissionId}`, admissionData);
  },

  getOlympiadResults: async (teacherId?: number): Promise<{ results: any[] }> => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId.toString());
    return await apiClient.get(`/kpi/olympiad-results?${params}`);
  },

  getStudentAdmissions: async (teacherId?: number): Promise<{ admissions: any[] }> => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId.toString());
    return await apiClient.get(`/kpi/student-admissions?${params}`);
  },

  // Periodic KPI methods
  getPeriodicKpi: async (filter?: {
    teacherId?: number;
    period?: string;
    year?: number;
    month?: number;
    quarter?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filter?.teacherId) params.append('teacherId', filter.teacherId.toString());
    if (filter?.period) params.append('period', filter.period);
    if (filter?.year) params.append('year', filter.year.toString());
    if (filter?.month) params.append('month', filter.month.toString());
    if (filter?.quarter) params.append('quarter', filter.quarter.toString());
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    return await apiClient.get(`/kpi/periodic?${params}`);
  },

  getPeriodicStats: async (filter?: {
    teacherId?: number;
    year?: number;
    period?: 'monthly' | 'quarterly' | 'yearly';
  }) => {
    const params = new URLSearchParams();
    if (filter?.teacherId) params.append('teacherId', filter.teacherId.toString());
    if (filter?.year) params.append('year', filter.year.toString());
    if (filter?.period) params.append('period', filter.period);
    
    return await apiClient.get(`/kpi/periodic/stats?${params}`);
  },

  getPeriodicTrends: async (filter?: {
    teacherId?: number;
    startYear?: number;
    endYear?: number;
    achievementType?: string;
  }) => {
    const params = new URLSearchParams();
    if (filter?.teacherId) params.append('teacherId', filter.teacherId.toString());
    if (filter?.startYear) params.append('startYear', filter.startYear.toString());
    if (filter?.endYear) params.append('endYear', filter.endYear.toString());
    if (filter?.achievementType) params.append('achievementType', filter.achievementType);
    
    return await apiClient.get(`/kpi/periodic/trends?${params}`);
  },

  getPeriodicComparison: async (filter?: {
    teacherIds?: number[];
    period?: string;
    year?: number;
    comparisonType?: 'achievements' | 'olympiads' | 'admissions';
  }) => {
    const params = new URLSearchParams();
    if (filter?.teacherIds?.length) {
      filter.teacherIds.forEach(id => params.append('teacherIds', id.toString()));
    }
    if (filter?.period) params.append('period', filter.period);
    if (filter?.year) params.append('year', filter.year.toString());
    if (filter?.comparisonType) params.append('comparisonType', filter.comparisonType);
    
    return await apiClient.get(`/kpi/periodic/comparison?${params}`);
  },

  exportPeriodicKpi: async (filter?: {
    teacherId?: number;
    period?: string;
    year?: number;
    format?: 'xlsx' | 'csv' | 'pdf';
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filter?.teacherId) params.append('teacherId', filter.teacherId.toString());
    if (filter?.period) params.append('period', filter.period);
    if (filter?.year) params.append('year', filter.year.toString());
    if (filter?.format) params.append('format', filter.format);
    
    return await apiClient.getBlob(`/kpi/periodic/export?${params}`);
  },

  // Achievement verification methods
  verifyAchievement: async (achievementId: number, verified: boolean, comment?: string) => {
    return await apiClient.put(`/kpi/achievements/${achievementId}/verify`, {
      isVerified: verified,
      comment
    });
  },

  verifyOlympiadResult: async (resultId: number, verified: boolean, comment?: string) => {
    return await apiClient.put(`/kpi/olympiad-results/${resultId}/verify`, {
      isVerified: verified,
      comment
    });
  },

  verifyStudentAdmission: async (admissionId: number, verified: boolean, comment?: string) => {
    return await apiClient.put(`/kpi/student-admissions/${admissionId}/verify`, {
      isVerified: verified,
      comment
    });
  },

  // Delete methods
  deleteAchievement: async (achievementId: number) => {
    return await apiClient.delete(`/kpi/achievements/${achievementId}`);
  },

  deleteOlympiadResult: async (resultId: number) => {
    return await apiClient.delete(`/kpi/olympiad-results/${resultId}`);
  },

  deleteStudentAdmission: async (admissionId: number) => {
    return await apiClient.delete(`/kpi/student-admissions/${admissionId}`);
  },

  // Bulk operations
  bulkCreateAchievements: async (achievements: any[]) => {
    return await apiClient.post(`/kpi/achievements/bulk`, { achievements });
  },

  bulkUpdateAchievements: async (updates: { id: number; data: any }[]) => {
    return await apiClient.put(`/kpi/achievements/bulk`, { updates });
  },

  bulkDeleteAchievements: async (achievementIds: number[]) => {
    return await apiClient.post(`/kpi/achievements/bulk-delete`, { ids: achievementIds });
  },

  // KPI summary for dashboard
  getKpiSummary: async (teacherId?: number, period?: string) => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId.toString());
    if (period) params.append('period', period);
    
    return await apiClient.get(`/kpi/summary?${params}`);
  },

  // Achievement types and metadata
  getAchievementTypes: async () => {
    return await apiClient.get(`/kpi/achievement-types`);
  },

  getSchoolTypes: async () => {
    return await apiClient.get(`/kpi/school-types`);
  },

  // Periodic KPI goals
  getPeriodicGoals: async (teacherId?: number, year?: number) => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId.toString());
    if (year) params.append('year', year.toString());
    
    return await apiClient.get(`/kpi/periodic/goals?${params}`);
  },

  setPeriodicGoals: async (goals: {
    teacherId: number;
    year: number;
    achievements?: number;
    olympiadWins?: number;
    studentAdmissions?: number;
  }) => {
    return await apiClient.post(`/kpi/periodic/goals`, goals);
  },

  updatePeriodicGoals: async (goalId: number, goals: any) => {
    return await apiClient.put(`/kpi/periodic/goals/${goalId}`, goals);
  },

  // Get top periodic achievements
  getTopPeriodicAchievements: async (filter?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.limit) params.append('limit', filter.limit.toString());
    
    return await apiClient.get(`/kpi/periodic/top-achievements?${params}`);
  },
};
