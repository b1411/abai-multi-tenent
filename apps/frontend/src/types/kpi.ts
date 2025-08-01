export interface KpiMetric {
  name: string;
  value: number;
  target: number;
  change: number;
  unit: string;
  status: 'success' | 'warning' | 'danger';
}

export interface TeacherKpi {
  id: number;
  name: string;
  overallScore: number;
  teachingQuality: number;
  studentSatisfaction: number;
  classAttendance: number;
  workloadCompliance: number;
  professionalDevelopment: number;
  trend: number;
  rank: number;
}

export interface DepartmentKpi {
  name: string;
  averageKpi: number;
  teacherCount: number;
  goalAchievement: number;
  trend: number;
}

export interface KpiTrend {
  period: string;
  value: number;
  target: number;
}

export interface KpiGoal {
  id: number;
  title: string;
  description: string;
  target: number;
  current: number;
  progress: number;
  deadline: string;
  status: 'on_track' | 'at_risk' | 'behind';
  responsible: string;
}

export interface KpiComparison {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

// Response DTOs
export interface KpiOverviewResponse {
  metrics: KpiMetric[];
  overallKpi: number;
  goalAchievement: number;
  activeGoals: number;
  totalTeachers: number;
}

export interface TeacherKpiResponse {
  teachers: TeacherKpi[];
  statistics: {
    averageKpi: number;
    topPerformers: number;
    needsImprovement: number;
    onTrack: number;
  };
}

export interface DepartmentKpiResponse {
  departments: DepartmentKpi[];
  topDepartment: DepartmentKpi;
}

export interface KpiTrendsResponse {
  trends: KpiTrend[];
  analysis: {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    projection: number;
  };
}

export interface KpiGoalsResponse {
  goals: KpiGoal[];
  summary: {
    total: number;
    onTrack: number;
    atRisk: number;
    behind: number;
    completed: number;
  };
}

export interface KpiComparisonResponse {
  comparison: KpiComparison[];
  overallChange: number;
}

export interface KpiFilter {
  department?: string;
  period?: string;
  teacherId?: number;
  startDate?: string;
  endDate?: string;
}

// Settings types
export interface KpiMetricSetting {
  name: string;
  weight: number;
  target: number;
  successThreshold: number;
  warningThreshold: number;
  isActive?: boolean;
  type: 'constant' | 'periodic'; // Добавляем тип метрики
}

export interface KpiSettings {
  metrics: KpiMetricSetting[];
  calculationPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  autoNotifications?: boolean;
  notificationThreshold?: number;
}

export interface KpiSettingsResponse {
  settings: KpiSettings;
  lastUpdated: Date;
  updatedBy: string;
}

export interface CreateKpiGoal {
  title: string;
  description: string;
  target: number;
  deadline: string;
  responsible: string;
  departmentId?: number;
  teacherId?: number;
}

export interface UpdateKpiGoal {
  title?: string;
  description?: string;
  target?: number;
  current?: number;
  deadline?: string;
  responsible?: string;
  status?: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

// KPI recalculation response
export interface KpiRecalculationResponse {
  success: boolean;
  message: string;
  statistics: {
    totalTeachers: number;
    successfulUpdates: number;
    failedUpdates: number;
    processingTime: string;
    errors?: string[];
  };
  timestamp: Date;
}

// KPI calculation status response
export interface KpiCalculationStatusResponse {
  lastUpdate: Date;
  nextScheduledUpdate: Date;
  totalTeachers: number;
  successfulUpdates: number;
  failedUpdates: number;
  averageProcessingTime: string;
  systemStatus: 'active' | 'inactive' | 'error';
  calculationPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  autoNotifications: boolean;
}
