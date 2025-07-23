export type WorkloadType = 'REGULAR' | 'OVERTIME' | 'SICK' | 'VACATION';

export interface MonthlyWorkload {
  id: number;
  month: number;
  year: number;
  standardHours: number;
  actualHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterlyWorkload {
  id: number;
  quarter: number;
  year: number;
  standardHours: number;
  actualHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyWorkload {
  id: number;
  date: string;
  hours: number;
  type: WorkloadType;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectWorkload {
  id: number;
  subjectName: string;
  hours: number;
  studyPlanId?: number;
  studyPlan?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalActivity {
  id: number;
  name: string;
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherWorkload {
  id: number;
  teacherId: number;
  academicYear: string;
  standardHours: number;
  actualHours: number;
  overtimeHours: number;
  vacationDays: number;
  sickLeaveDays: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
  };
  
  monthlyHours: MonthlyWorkload[];
  quarterlyHours: QuarterlyWorkload[];
  dailyHours: DailyWorkload[];
  subjectWorkloads: SubjectWorkload[];
  additionalActivities: AdditionalActivity[];
}

export interface CreateWorkloadData {
  teacherId: number;
  academicYear: string;
  standardHours?: number;
  actualHours?: number;
  overtimeHours?: number;
  vacationDays?: number;
  sickLeaveDays?: number;
  monthlyHours?: Omit<MonthlyWorkload, 'id' | 'createdAt' | 'updatedAt'>[];
  quarterlyHours?: Omit<QuarterlyWorkload, 'id' | 'createdAt' | 'updatedAt'>[];
  dailyHours?: Omit<DailyWorkload, 'id' | 'createdAt' | 'updatedAt'>[];
  subjectWorkloads?: Omit<SubjectWorkload, 'id' | 'createdAt' | 'updatedAt'>[];
  additionalActivities?: Omit<AdditionalActivity, 'id' | 'createdAt' | 'updatedAt'>[];
}

export type UpdateWorkloadData = Partial<CreateWorkloadData>;

export interface WorkloadFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  academicYear?: string;
  teacherId?: number;
  period?: 'month' | 'quarter' | 'year';
  periodValue?: number;
}

export interface WorkloadAnalytics {
  summary: {
    totalTeachers: number;
    totalStandardHours: number;
    totalActualHours: number;
    averageLoad: number;
    overloaded: number;
    underloaded: number;
  };
  subjectDistribution: {
    name: string;
    hours: number;
    teachers: number;
  }[];
  trends: {
    period: number;
    standardHours: number;
    actualHours: number;
  }[];
}

export interface AddDailyHoursData {
  date: string;
  hours: number;
  type: WorkloadType;
  comment?: string;
}
