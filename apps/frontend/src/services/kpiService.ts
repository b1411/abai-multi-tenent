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
};
