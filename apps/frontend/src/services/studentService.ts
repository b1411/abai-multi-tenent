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
    curatorTeacherId?: number | null;
    curator?: {
      id: number;
      user: {
        id: number;
        name: string;
        surname: string;
        middlename?: string;
        phone?: string;
        email: string;
      };
    } | null;
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
  teacherRatings?: Array<{
    teacherId: number;
    rating: number;
    date: string;
    questionId: string;
  }>;
  source?: 'feedback' | 'legacy' | 'no_data';
}

export interface StudentRemark {
  id: number;
  type: 'ACADEMIC' | 'BEHAVIOR' | 'ATTENDANCE' | 'GENERAL';
  title: string;
  content: string;
  isPrivate: boolean;
  teacher: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudentRemarksResponse {
  studentId: number;
  totalRemarks: number;
  remarks: StudentRemark[];
}

export interface CreateRemarkData {
  type?: 'ACADEMIC' | 'BEHAVIOR' | 'ATTENDANCE' | 'GENERAL';
  title: string;
  content: string;
  isPrivate?: boolean;
}

export interface UpdateRemarkData {
  type?: 'ACADEMIC' | 'BEHAVIOR' | 'ATTENDANCE' | 'GENERAL';
  title?: string;
  content?: string;
  isPrivate?: boolean;
}

export interface StudentComment {
  id: number;
  title: string;
  content: string;
  type: 'ACADEMIC' | 'GENERAL';
  isPrivate: boolean;
  teacher: {
    id: number;
    name: string;
  };
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudentCommentsResponse {
  studentId: number;
  totalComments: number;
  comments: StudentComment[];
}

export interface CreateCommentData {
  title: string;
  content: string;
  type?: 'ACADEMIC' | 'GENERAL';
  isPrivate?: boolean;
}

export interface UpdateCommentData {
  title?: string;
  content?: string;
  type?: 'ACADEMIC' | 'GENERAL';
  isPrivate?: boolean;
}

// === PDP Types ===
export type PdpPlanStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type PdpGoalStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface PdpGoal {
  id: number;
  planId: number;
  title: string;
  status: PdpGoalStatus;
  deadline?: string | null;
  order?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PdpPlan {
  id: number;
  studentId: number;
  subject: string;
  status: PdpPlanStatus;
  mentor?: string | null;
  description?: string | null;
  progress: number;
  skills: string[];
  goals: PdpGoal[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreatePdpPlanInput {
  subject: string;
  status?: PdpPlanStatus;
  mentor?: string;
  description?: string;
  progress?: number; // 0-100
  skills?: string[];
}

export interface UpdatePdpPlanInput {
  subject?: string;
  status?: PdpPlanStatus;
  mentor?: string;
  description?: string;
  progress?: number; // 0-100
  skills?: string[];
}

export interface CreatePdpGoalInput {
  title: string;
  status?: PdpGoalStatus;
  deadline?: string; // ISO date
  order?: number;
}

export interface UpdatePdpGoalInput {
  title?: string;
  status?: PdpGoalStatus;
  deadline?: string; // ISO date
  order?: number;
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
    try {
      // Сначала пытаемся получить данные из feedback системы
      const feedbackData = await this.getEmotionalStateFromFeedback(studentId);
      if (feedbackData) {
        return { ...feedbackData, source: 'feedback' };
      }

      // Если данных из feedback нет, используем старую систему
      const legacyData = await apiClient.get<EmotionalData>(`/students/${studentId}/emotional-state`);
      return { ...legacyData, source: 'legacy' };
    } catch (error) {
      console.error('Ошибка при загрузке эмоционального состояния:', error);
      // Возвращаем пустое состояние с указанием на отсутствие данных
      return {
        student: null,
        currentState: null,
        feedbackHistory: [],
        trends: {},
        recommendations: [],
        source: 'no_data'
      };
    }
  },

  // Получить эмоциональное состояние из feedback системы
  async getEmotionalStateFromFeedback(studentId: number): Promise<EmotionalData | null> {
    try {
      const response = await apiClient.get(`/feedback/students/${studentId}/emotional-state`);

      if (!response || !(response as any).responses) {
        return null;
      }

      // Обрабатываем данные из feedback
      return this.processFeedbackEmotionalData(response);
    } catch (error) {
      console.warn('Данные feedback недоступны:', error);
      return null;
    }
  },

  // Обработка данных feedback для эмоционального состояния
  processFeedbackEmotionalData(feedbackData: any): EmotionalData {
    if (!feedbackData || !feedbackData.responses || feedbackData.responses.length === 0) {
      return {
        student: null,
        currentState: null,
        feedbackHistory: [],
        trends: {},
        recommendations: [],
        source: 'no_data'
      };
    }

    // Если данные уже обработаны на бекенде, используем их напрямую
    if (feedbackData.currentState) {
      return {
        student: feedbackData.studentId,
        currentState: {
          mood: {
            value: feedbackData.currentState.mood.value,
            description: feedbackData.currentState.mood.description,
            trend: feedbackData.currentState.mood.trend
          },
          concentration: {
            value: feedbackData.currentState.concentration.value,
            description: feedbackData.currentState.concentration.description,
            trend: feedbackData.currentState.concentration.trend
          },
          socialization: {
            value: feedbackData.currentState.socialization.value,
            description: feedbackData.currentState.socialization.description,
            trend: feedbackData.currentState.socialization.trend
          },
          motivation: {
            value: feedbackData.currentState.motivation.value,
            description: feedbackData.currentState.motivation.description,
            trend: feedbackData.currentState.motivation.trend
          },
          lastUpdated: feedbackData.lastUpdated
        },
        feedbackHistory: this.formatTrendsForHistory(feedbackData.trends || []),
        trends: feedbackData.currentState,
        recommendations: feedbackData.recommendations || [],
        teacherRatings: feedbackData.teacherRatings || [],
        source: 'feedback'
      };
    }

    // Обработка сырых данных (старая логика)
    const responses = feedbackData.responses;
    const latestResponse = responses[0];

    // Извлекаем эмоциональные метрики из последнего ответа
    const emotionalMetrics = this.extractEmotionalMetrics(latestResponse.answers);

    // Анализируем тренды
    const trends = this.analyzeTrends(responses);

    // Генерируем рекомендации
    const recommendations = this.generateRecommendations(emotionalMetrics, trends);

    return {
      student: feedbackData.studentId,
      currentState: {
        mood: {
          value: emotionalMetrics.mood || 50,
          description: this.getMoodDescription(emotionalMetrics.mood || 50),
          trend: trends.mood || 'stable'
        },
        concentration: {
          value: emotionalMetrics.concentration || 50,
          description: this.getConcentrationDescription(emotionalMetrics.concentration || 50),
          trend: trends.concentration || 'stable'
        },
        socialization: {
          value: emotionalMetrics.socialization || 50,
          description: this.getSocializationDescription(emotionalMetrics.socialization || 50),
          trend: trends.socialization || 'stable'
        },
        motivation: {
          value: emotionalMetrics.motivation || 50,
          description: this.getMotivationDescription(emotionalMetrics.motivation || 50),
          trend: trends.motivation || 'stable'
        },
        lastUpdated: latestResponse.submittedAt
      },
      feedbackHistory: this.formatFeedbackHistory(responses),
      trends: trends,
      recommendations: recommendations,
      teacherRatings: feedbackData.teacherRatings || [],
      source: 'feedback'
    };
  },

  // Извлечение эмоциональных метрик из ответов
  extractEmotionalMetrics(answers: any): any {
    const metrics: any = {};

    Object.entries(answers || {}).forEach(([questionId, answer]) => {
      // Точное соответствие ID вопросов
      switch (questionId) {
        case 'mood_today':
          metrics.mood = this.normalizeValue(answer);
          break;
        case 'concentration_level':
          metrics.concentration = this.normalizeValue(answer);
          break;
        case 'socialization_level':
          metrics.socialization = this.normalizeValue(answer);
          break;
        case 'motivation_level':
          metrics.motivation = this.normalizeValue(answer);
          break;
        case 'overall_satisfaction':
          // Общая удовлетворенность тоже влияет на настроение
          if (!metrics.mood) {
            metrics.mood = this.normalizeValue(answer);
          }
          break;
        default:
          // Дополнительная проверка по содержанию для совместимости
          if (questionId.includes('mood') || questionId.includes('настроение')) {
            metrics.mood = this.normalizeValue(answer);
          }
          if (questionId.includes('concentration') || questionId.includes('концентрация')) {
            metrics.concentration = this.normalizeValue(answer);
          }
          if (questionId.includes('socialization') || questionId.includes('общение')) {
            metrics.socialization = this.normalizeValue(answer);
          }
          if (questionId.includes('motivation') || questionId.includes('мотивация')) {
            metrics.motivation = this.normalizeValue(answer);
          }
          break;
      }
    });

    return metrics;
  },

  // Нормализация значений к шкале 0-100
  normalizeValue(value: any): number {
    if (typeof value === 'number') {
      // Если значение уже в диапазоне 0-100, оставляем как есть
      if (value >= 0 && value <= 100) {
        return Math.round(value);
      }
      // Если это шкала 1-5
      else if (value >= 1 && value <= 5) {
        return Math.round(((value - 1) / 4) * 100);
      }
      // Если это шкала 1-10
      else if (value >= 1 && value <= 10) {
        return Math.round(((value - 1) / 9) * 100);
      }
      // Для других значений ограничиваем диапазон
      else {
        return Math.min(Math.max(Math.round(value), 0), 100);
      }
    }
    if (typeof value === 'boolean') {
      return value ? 80 : 20;
    }
    return 50; // дефолтное значение
  },

  // Анализ трендов
  analyzeTrends(responses: any[]): any {
    if (responses.length < 2) return {};

    const trends: any = {};
    const metrics = ['mood', 'concentration', 'socialization', 'motivation'];

    metrics.forEach(metric => {
      const values = responses.map(r => this.extractEmotionalMetrics(r.answers)[metric]).filter(v => v !== undefined);
      if (values.length >= 2) {
        const latest = values[0];
        const previous = values[1];
        const diff = latest - previous;
        trends[metric] = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable';
      }
    });

    return trends;
  },

  // Генерация рекомендаций
  generateRecommendations(metrics: any, trends: any): any[] {
    const recommendations: any[] = [];

    if (metrics.mood && metrics.mood < 30) {
      recommendations.push({
        type: 'mood',
        priority: 'high',
        message: 'Низкое настроение студента требует внимания. Рекомендуется беседа с психологом.'
      });
    }

    if (metrics.concentration && metrics.concentration < 40) {
      recommendations.push({
        type: 'concentration',
        priority: 'medium',
        message: 'Проблемы с концентрацией. Рекомендуется пересмотр учебной нагрузки.'
      });
    }

    if (metrics.socialization && metrics.socialization < 35) {
      recommendations.push({
        type: 'socialization',
        priority: 'medium',
        message: 'Низкий уровень социализации. Рекомендуется включение в групповые активности.'
      });
    }

    if (metrics.motivation && metrics.motivation < 30) {
      recommendations.push({
        type: 'motivation',
        priority: 'high',
        message: 'Критически низкая мотивация. Требуется индивидуальная работа с куратором.'
      });
    }

    return recommendations;
  },

  // Форматирование истории для отображения
  formatFeedbackHistory(responses: any[]): any[] {
    return responses.map(response => ({
      date: response.submittedAt,
      period: response.period,
      template: response.template?.title || 'Опрос',
      metrics: this.extractEmotionalMetrics(response.answers)
    }));
  },

  // Форматирование трендов для истории
  formatTrendsForHistory(trends: any[]): any[] {
    if (!trends || !Array.isArray(trends)) return [];

    return trends.map(trend => ({
      date: trend.date,
      настроение: trend.data?.mood || null,
      концентрация: trend.data?.concentration || null,
      социализация: trend.data?.socialization || null,
      мотивация: trend.data?.motivation || null
    })).filter(item =>
      // Фильтруем записи, где есть хотя бы одно значение
      item.настроение !== null ||
      item.концентрация !== null ||
      item.социализация !== null ||
      item.мотивация !== null
    );
  },

  // Вспомогательные методы для описаний
  getMoodDescription(value: number): string {
    if (value >= 80) return 'Отличное настроение';
    if (value >= 60) return 'Хорошее настроение';
    if (value >= 40) return 'Нормальное настроение';
    if (value >= 20) return 'Плохое настроение';
    return 'Очень плохое настроение';
  },

  getConcentrationDescription(value: number): string {
    if (value >= 80) return 'Отличная концентрация';
    if (value >= 60) return 'Хорошая концентрация';
    if (value >= 40) return 'Нормальная концентрация';
    if (value >= 20) return 'Слабая концентрация';
    return 'Очень слабая концентрация';
  },

  getSocializationDescription(value: number): string {
    if (value >= 80) return 'Отличное общение';
    if (value >= 60) return 'Хорошее общение';
    if (value >= 40) return 'Нормальное общение';
    if (value >= 20) return 'Слабое общение';
    return 'Проблемы с общением';
  },

  getMotivationDescription(value: number): string {
    if (value >= 80) return 'Очень высокая мотивация';
    if (value >= 60) return 'Высокая мотивация';
    if (value >= 40) return 'Нормальная мотивация';
    if (value >= 20) return 'Низкая мотивация';
    return 'Очень низкая мотивация';
  },

  // Получить полный отчет по студенту
  async getStudentCompleteReport(studentId: number): Promise<CompleteStudentReport> {
    return await apiClient.get<CompleteStudentReport>(`/students/${studentId}/complete-report`);
  },

  // Получить детей родителя (для родителей)
  async getParentChildren(): Promise<Student[]> {
    return await apiClient.get<Student[]>('/parents/me/children');
  },

  // === МЕТОДЫ ДЛЯ РАБОТЫ С ЗАМЕЧАНИЯМИ ===

  // Получить замечания студента
  async getStudentRemarks(studentId: number): Promise<StudentRemarksResponse> {
    return await apiClient.get<StudentRemarksResponse>(`/students/${studentId}/remarks`);
  },

  // Добавить замечание студенту
  async addStudentRemark(studentId: number, remarkData: CreateRemarkData): Promise<any> {
    return await apiClient.post(`/students/${studentId}/remarks`, remarkData);
  },

  // Обновить замечание
  async updateStudentRemark(remarkId: number, remarkData: UpdateRemarkData): Promise<any> {
    return await apiClient.patch(`/students/remarks/${remarkId}`, remarkData);
  },

  // Удалить замечание
  async deleteStudentRemark(remarkId: number): Promise<any> {
    return await apiClient.delete(`/students/remarks/${remarkId}`);
  },

  // === МЕТОДЫ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ ===

  // Получить комментарии студента (только для админов)
  async getStudentComments(studentId: number): Promise<StudentCommentsResponse> {
    return await apiClient.get<StudentCommentsResponse>(`/students/${studentId}/comments`);
  },

  // Добавить комментарий студенту (только для админов)
  async addStudentComment(studentId: number, commentData: CreateCommentData): Promise<any> {
    return await apiClient.post(`/students/${studentId}/comments`, commentData);
  },

  // Обновить комментарий (только для админов)
  async updateStudentComment(commentId: number, commentData: UpdateCommentData): Promise<any> {
    return await apiClient.patch(`/students/comments/${commentId}`, commentData);
  },

  // Удалить комментарий (только для админов)
  async deleteStudentComment(commentId: number): Promise<any> {
    return await apiClient.delete(`/students/comments/${commentId}`);
  },

  // Получить преподавателей студента
  async getStudentTeachers(studentId: number): Promise<Array<{
    id: number;
    name: string;
    surname: string;
    subject: string;
  }>> {
    return await apiClient.get(`/students/${studentId}/teachers`);
  },

  // ===== ПАГИНАЦИЯ СТУДЕНТОВ =====
  async getPaginatedStudents(params: {
    page: number;
    limit: number;
    search?: string;
    groupId?: number;
  }): Promise<{
    data: Student[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qs = new URLSearchParams();
    qs.append('page', String(params.page));
    qs.append('limit', String(params.limit));
    if (params.search) qs.append('search', params.search);
    if (params.groupId !== undefined) qs.append('groupId', String(params.groupId));
    return await apiClient.get(`/students/paginated?${qs.toString()}`);
  },

  // ===== ЭКЗАМЕНЫ / КОНТРОЛЬНЫЕ (оптимизированный endpoint) =====
  async getStudentExams(
    studentId: number,
    params?: { type?: 'CONTROL_WORK' | 'EXAM'; page?: number; limit?: number }
  ): Promise<{
    data: Array<{
      id: number;
      name: string;
      date: string;
      type: string;
      studyPlan?: { id: number; name: string };
      result?: {
        lessonScore?: number;
        homeworkScore?: number;
        attendance?: boolean;
        absentReason?: string;
      } | null;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const qs = new URLSearchParams();
    if (params?.type) qs.append('type', params.type);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    const url = `/students/${studentId}/exams${qs.toString() ? `?${qs.toString()}` : ''}`;
    return await apiClient.get(url);
  },

  // ===== PDP ENDPOINTS =====
  async getStudentPdp(studentId: number): Promise<PdpPlan[]> {
    return await apiClient.get<PdpPlan[]>(`/students/${studentId}/pdp`);
  },

  async createStudentPdp(studentId: number, data: CreatePdpPlanInput): Promise<PdpPlan> {
    return await apiClient.post<PdpPlan>(`/students/${studentId}/pdp`, data);
  },

  async updatePdpPlan(planId: number, data: UpdatePdpPlanInput): Promise<PdpPlan> {
    return await apiClient.patch<PdpPlan>(`/students/pdp/${planId}`, data);
  },

  async deletePdpPlan(planId: number): Promise<any> {
    return await apiClient.delete(`/students/pdp/${planId}`);
  },

  async addPdpGoal(planId: number, data: CreatePdpGoalInput): Promise<PdpGoal> {
    return await apiClient.post<PdpGoal>(`/students/pdp/${planId}/goals`, data);
  },

  async updatePdpGoal(goalId: number, data: UpdatePdpGoalInput): Promise<PdpGoal> {
    return await apiClient.patch<PdpGoal>(`/students/pdp/goals/${goalId}`, data);
  },

  async deletePdpGoal(goalId: number): Promise<any> {
    return await apiClient.delete(`/students/pdp/goals/${goalId}`);
  }
};
