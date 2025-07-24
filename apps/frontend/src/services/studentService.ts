import apiClient from './apiClient';

export interface Student {
  id: number;
  userId: number;
  groupId: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    name: string;
    surname: string;
    middlename?: string;
    phone?: string;
    avatar?: string;
    role: string;
  };
  group: {
    id: number;
    name: string;
    courseNumber: number;
  };
  Parents?: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
      phone?: string;
      email: string;
    };
  }[];
  lessonsResults?: {
    id: number;
    lessonScore?: number;
    homeworkScore?: number;
    attendance?: boolean;
    createdAt: string;
    Lesson: {
      id: number;
      name: string;
      date: string;
      studyPlan: {
        id: number;
        name: string;
      };
    };
  }[];
  EmotionalState?: {
    mood: number;
    moodDesc: string;
    moodTrend: string;
    concentration: number;
    concentrationDesc: string;
    concentrationTrend: string;
    socialization: number;
    socializationDesc: string;
    socializationTrend: string;
    motivation: number;
    motivationDesc: string;
    motivationTrend: string;
    updatedAt: string;
  };
  Payment?: {
    id: number;
    serviceType: string;
    serviceName: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: string;
    paymentDate?: string;
    paidAmount?: number;
  }[];
}

export interface StudentGrades {
  [subject: string]: {
    subject: {
      id: number;
      name: string;
      description?: string;
      teacher: {
        user: {
          name: string;
          surname: string;
        };
      };
    };
    grades: {
      id: number;
      lessonScore?: number;
      homeworkScore?: number;
      attendance?: boolean;
      createdAt: string;
      Lesson: {
        id: number;
        name: string;
        date: string;
      };
    }[];
    statistics: {
      totalLessons: number;
      averageLessonScore: number;
      averageHomeworkScore: number;
      attendanceRate: number;
    };
  };
}

export interface StudentStatistics {
  totalStudents: number;
  studentsByGroup: {
    group: {
      id: number;
      name: string;
      courseNumber: number;
    };
    studentCount: number;
  }[];
  recentStudents: Student[];
}

export interface AttendanceData {
  summary: {
    totalLessons: number;
    attendedLessons: number;
    missedLessons: number;
    attendanceRate: number;
  };
  absenceReasons: Record<string, number>;
  subjectAttendance: Record<string, any>;
  details: any[];
}

export interface FinanceData {
  student: any;
  summary: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    paymentCount: number;
  };
  paymentsByType: Record<string, any>;
  recentPayments: any[];
}

export interface EmotionalData {
  student: any;
  currentState: {
    mood: { value: number; description: string; trend: string };
    concentration: { value: number; description: string; trend: string };
    socialization: { value: number; description: string; trend: string };
    motivation: { value: number; description: string; trend: string };
    lastUpdated: string;
  } | null;
  feedbackHistory: any[];
  trends: Record<string, string>;
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
}

export interface CompleteStudentReport {
  student: Student;
  basicInfo: any;
  attendance: AttendanceData;
  grades: StudentGrades;
  finances?: FinanceData;
  emotionalState?: EmotionalData;
  accessLevel: {
    canViewFinances: boolean;
    canViewEmotionalState: boolean;
  };
}

export interface CreateFullStudentData {
  email: string;
  name: string;
  surname: string;
  password: string;
  phone?: string;
  middlename?: string;
  avatar?: string;
  groupId: number;
  classId?: number;
}

export const studentService = {
  // Получить всех студентов (для админа/HR/учителя)
  async getAllStudents(): Promise<Student[]> {
    return await apiClient.get<Student[]>('/students');
  },

  // Получить студентов группы
  async getStudentsByGroup(groupId: number): Promise<Student[]> {
    return await apiClient.get<Student[]>(`/students/group/${groupId}`);
  },

  // Получить студента по ID
  async getStudentById(id: number): Promise<Student> {
    return await apiClient.get<Student>(`/students/${id}`);
  },

  // Получить студента по ID пользователя
  async getStudentByUserId(userId: number): Promise<Student> {
    return await apiClient.get<Student>(`/students/user/${userId}`);
  },

  // Получить оценки студента
  async getStudentGrades(studentId: number): Promise<StudentGrades> {
    return await apiClient.get<StudentGrades>(`/students/${studentId}/grades`);
  },

  // Получить статистику студентов
  async getStudentStatistics(): Promise<StudentStatistics> {
    return await apiClient.get<StudentStatistics>('/students/statistics');
  },

  // Получить родителей студента
  async getStudentParents(studentId: number) {
    return await apiClient.get(`/students/${studentId}/parents`);
  },

  // Зачислить студента
  async createStudent(data: { userId: number; groupId: number }) {
    return await apiClient.post('/students', data);
  },

  // Создать полного студента (пользователь + студент)
  async createFullStudent(data: CreateFullStudentData) {
    return await apiClient.post('/students/create-full', data);
  },

  // Обновить данные студента
  async updateStudent(id: number, data: { groupId?: number }) {
    return await apiClient.patch(`/students/${id}`, data);
  },

  // Перевести студента в другую группу
  async changeStudentGroup(studentId: number, newGroupId: number) {
    return await apiClient.patch(`/students/${studentId}/change-group/${newGroupId}`);
  },

  // Привязать родителя к студенту
  async addParentToStudent(studentId: number, parentId: number) {
    return await apiClient.post(`/students/${studentId}/parents/${parentId}`);
  },

  // Отвязать родителя от студента
  async removeParentFromStudent(studentId: number, parentId: number) {
    return await apiClient.delete(`/students/${studentId}/parents/${parentId}`);
  },

  // Отчислить студента
  async removeStudent(id: number) {
    return await apiClient.delete(`/students/${id}`);
  },

  // Получить данные посещаемости студента
  async getStudentAttendance(studentId: number, dateFrom?: string, dateTo?: string): Promise<AttendanceData> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const queryString = params.toString();
    const url = `/students/${studentId}/attendance${queryString ? `?${queryString}` : ''}`;
    
    return await apiClient.get<AttendanceData>(url);
  },

  // Получить финансовые данные студента
  async getStudentFinances(studentId: number): Promise<FinanceData> {
    return await apiClient.get<FinanceData>(`/students/${studentId}/finances`);
  },

  // Получить эмоциональное состояние студента
  async getStudentEmotionalState(studentId: number): Promise<EmotionalData> {
    return await apiClient.get<EmotionalData>(`/students/${studentId}/emotional-state`);
  },

  // Получить полный отчет по студенту
  async getStudentCompleteReport(studentId: number): Promise<CompleteStudentReport> {
    return await apiClient.get<CompleteStudentReport>(`/students/${studentId}/complete-report`);
  }
};
