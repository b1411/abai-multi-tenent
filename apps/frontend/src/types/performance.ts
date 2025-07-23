export interface PerformanceOverview {
  averageGrade: number;
  performanceRate: number;
  attendanceRate: number;
  assignmentCompletionRate: number;
  trends: {
    grade: number;
    performance: number;
    attendance: number;
    assignments: number;
  };
}

export interface SubjectPerformance {
  name: string;
  grade: number;
  attendance: number;
  assignments: number;
  participation: number;
}

export interface StudentPerformance {
  name: string;
  grade: number;
  trend?: number;
}

export interface ClassData {
  id: string;
  name: string;
  averageGrade: number;
  attendance: number;
  assignments: number;
  studentsCount: number;
}

export interface MonthlyData {
  month: string;
  value: number;
  attendance: number;
  assignments: number;
}

export interface GradeDistribution {
  name: string;
  value: number;
  color: string;
}

export interface PerformanceMetric {
  subject: string;
  value: number;
}

export interface SubjectWithRecommendations {
  name: string;
  grade: number;
  recommendations: string[];
}

export interface StudentWithSubjects {
  student: StudentPerformance;
  subjects: SubjectWithRecommendations[];
}

export interface SubjectImprovement {
  subject: string;
  improvement: number;
}

export interface StudentWithImprovements {
  student: StudentPerformance;
  improvements: SubjectImprovement[];
}

export interface TrendDataPoint {
  period: string;
  value: number;
  change: number;
}

export interface TrendAnalysis {
  trend: 'positive' | 'negative' | 'stable';
  factors: string[];
}

// Response types
export interface StatisticsResponse {
  overview: PerformanceOverview;
}

export interface SubjectsResponse {
  subjects: SubjectPerformance[];
  summary: {
    bestPerforming: string[];
    needsImprovement: string[];
  };
}

export interface ClassesResponse {
  classes: ClassData[];
  statistics: {
    averagePerformance: number;
    topClasses: string[];
    totalStudents: number;
  };
}

export interface LowPerformingStudentsResponse {
  students: StudentWithSubjects[];
}

export interface HighProgressStudentsResponse {
  students: StudentWithImprovements[];
}

export interface TrendsResponse {
  trends: TrendDataPoint[];
  analysis: TrendAnalysis;
}

// Filter types
export enum PerformancePeriod {
  WEEK = 'week',
  MONTH = 'month',
  SEMESTER = 'semester',
  YEAR = 'year',
}

export enum PerformanceMetricType {
  GRADE = 'grade',
  ATTENDANCE = 'attendance',
  ASSIGNMENTS = 'assignments',
  PARTICIPATION = 'participation',
}

export interface PerformanceFilter {
  groupId?: string;
  subjectId?: string;
  period?: PerformancePeriod;
  metric?: PerformanceMetricType;
  startDate?: string;
  endDate?: string;
  threshold?: number;
}
