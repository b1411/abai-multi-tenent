import apiClient from './apiClient';

export interface StudentDashboardStats {
  upcomingLessons: number;
  pendingHomework: number;
  averageGrade: number;
  attendance: number;
  todaySchedule: Array<{
    id: number;
    subject: string;
    time: string;
    classroom: string;
  }>;
  pendingAssignments: Array<{
    id: number;
    title: string;
    subject: string;
    dueDate: string;
    status: 'pending' | 'overdue' | 'completed';
  }>;
  subjectGrades: Array<{
    subject: string;
    averageGrade: number;
    description: string;
  }>;
}

export interface TeacherDashboardStats {
  todayLessons: number;
  totalStudents: number;
  pendingGrading: number;
  upcomingDeadlines: number;
  completedLessons: number;
  monthlyWorkload: number;
  todaySchedule: Array<{
    id: number;
    subject: string;
    group: string;
    time: string;
    classroom: string;
    status: 'current' | 'upcoming' | 'completed';
  }>;
  alerts: Array<{
    id: number;
    type: 'homework' | 'report' | 'lesson_plan';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  groupPerformance: Array<{
    groupName: string;
    studentCount: number;
    averageGrade: number;
  }>;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  monthlyRevenue: number;
  pendingApplications: number;
  systemAlerts: number;
  activeClassrooms: number;
  completionRate: number;
  financialSummary: {
    income: number;
    expenses: number;
    profit: number;
  };
  recentEvents: Array<{
    id: number;
    type: 'new_teacher' | 'new_group' | 'system_update';
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export interface ParentDashboardStats {
  children: Array<{
    id: number;
    name: string;
    surname: string;
    grade: string;
    averageGrade: number;
    attendance: number;
    upcomingLessons: number;
    pendingHomework: number;
    todaySchedule: Array<{
      subject: string;
      time: string;
      classroom: string;
    }>;
    pendingAssignments: Array<{
      title: string;
      subject: string;
      dueDate: string;
      status: 'pending' | 'overdue' | 'completed';
    }>;
  }>;
  totalPayments: number;
  overduePayments: number;
  unreadMessages: number;
  payments: Array<{
    id: number;
    title: string;
    description: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  notifications: Array<{
    id: number;
    type: 'message' | 'payment' | 'grade';
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export interface FinancistDashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  monthlyExpenses: number;
  profit: number;
  outstandingPayments: number;
  overduePayments: number;
  pendingBudgetRequests: number;
  revenueGrowth: number;
  expenseGrowth: number;
  revenueStructure: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  expenseStructure: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: number;
    type: 'income' | 'expense';
    title: string;
    description: string;
    amount: number;
    date: string;
  }>;
  budgetRequests: Array<{
    id: number;
    title: string;
    description: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    priority: string;
  }>;
}

export interface HRDashboardStats {
  totalEmployees: number;
  activeTeachers: number;
  pendingApplications: number;
  onVacation: number;
  sickLeave: number;
  pendingTimeoffs: number;
  upcomingBirthdays: number;
  contractsExpiring: number;
  averageSalary: number;
  turnoverRate: number;
  employeeStatus: {
    working: number;
    vacation: number;
    sick: number;
  };
  vacationRequests: Array<{
    id: number;
    type: string;
    employeeName: string;
    dates: string;
    duration: string;
    status: string;
    submittedAt: string;
  }>;
  departmentAnalytics: Array<{
    department: string;
    employeeCount: number;
    percentage: number;
  }>;
  upcomingEvents: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    date: string;
  }>;
}

class DashboardService {
  async getStudentDashboard(): Promise<StudentDashboardStats> {
    return await apiClient.get<StudentDashboardStats>('/dashboard/student');
  }

  async getTeacherDashboard(): Promise<TeacherDashboardStats> {
    return await apiClient.get<TeacherDashboardStats>('/dashboard/teacher');
  }

  async getAdminDashboard(): Promise<AdminDashboardStats> {
    return await apiClient.get<AdminDashboardStats>('/dashboard/admin');
  }

  async getParentDashboard(): Promise<ParentDashboardStats> {
    return await apiClient.get<ParentDashboardStats>('/dashboard/parent');
  }

  async getFinancistDashboard(): Promise<FinancistDashboardStats> {
    return await apiClient.get<FinancistDashboardStats>('/dashboard/financist');
  }

  async getHRDashboard(): Promise<HRDashboardStats> {
    return await apiClient.get<HRDashboardStats>('/dashboard/hr');
  }
}

export default new DashboardService();
