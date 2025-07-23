import apiClient from './apiClient';
import type {
  KpiOverviewResponse,
  TeacherKpiResponse,
  DepartmentKpiResponse,
  KpiTrendsResponse,
  KpiGoalsResponse,
  KpiComparisonResponse,
  KpiFilter,
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
};
