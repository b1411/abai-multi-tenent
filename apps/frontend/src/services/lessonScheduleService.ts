import apiClient from './apiClient';

export interface GeneratedLesson {
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  studyPlanId: number;
  studyPlanName: string;
  groupId: number;
  groupName: string;
  teacherId: number;
  teacherName: string;
  classroomId?: number;
  classroomName?: string;
  description?: string;
  lessonNumber?: number;
  topicNumber?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AILessonsResponse {
  success: boolean;
  message: string;
  schedules: any[];
  generatedLessons?: GeneratedLesson[];
  summary?: {
    totalLessons: number;
    lessonsPerSubject: { [subjectName: string]: number };
    lessonsPerGroup: { [groupName: string]: number };
    startDate: string;
    endDate: string;
    academicYear: string;
    semester: number;
  };
  analysis?: {
    overallScore: number;
    efficiency: number;
    teacherSatisfaction: number;
    studentSatisfaction: number;
    resourceUtilization: number;
  };
  statistics: {
    totalLessons: number;
    schedulesCreated: number;
    errors: number;
  };
  recommendations: string[];
  conflicts: string[];
  warnings?: string[];
  errors: string[];
  generatedAt?: string;
  aiModel?: string;
  algorithmVersion?: string;
}

export interface GenerateLessonsParams {
  groupIds: number[];
  teacherIds?: number[];
  subjectIds?: number[];
  startDate: string;
  endDate: string;
  academicYear: string;
  semester: number;
  lessonDuration?: number;
  weeklyHoursPerSubject?: { [studyPlanId: number]: number };
  excludeDates?: string[];
  additionalInstructions?: string;
  constraints?: {
    workingHours: {
      start: string;
      end: string;
    };
    maxConsecutiveHours?: number;
    preferredBreaks?: string[];
  };
}

export interface LessonScheduleFilters {
  startDate?: string;
  endDate?: string;
  groupIds?: number[];
  teacherIds?: number[];
  studyPlanIds?: number[];
  page?: number;
  pageSize?: number;
}

export interface LessonScheduleItem {
  id: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  classId: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  type: 'lesson' | 'consultation' | 'extra';
  repeat: 'once' | 'weekly' | 'biweekly';
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface LessonScheduleResponse {
  items: LessonScheduleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LessonCalendarData {
  [date: string]: {
    id: number;
    name: string;
    time: { start: string; end: string };
    subject: string;
    teacher: string;
    groups: string[];
    description: string;
  }[];
}

export interface LessonStatistics {
  totalLessons: number;
  lessonsPerSubject: any;
  lessonsPerTeacher: any;
  lessonsPerGroup: any;
}

export interface AvailableLesson {
  id: number;
  name: string;
  description?: string;
  studyPlanId: number;
  studyPlanName: string;
  groupId: number;
  groupName: string;
  teacherId: number;
  teacherName: string;
  lessonNumber?: number;
  topicNumber?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // в минутах
  materials?: {
    lecture?: string;
    videoUrl?: string;
    presentationUrl?: string;
    additionalNotes?: string;
  };
  homework?: {
    name: string;
    description: string;
    estimatedHours?: number;
  };
  isCompleted: boolean;
  scheduledDate?: string; // Если уже запланирован
}

class LessonScheduleService {
  /**
   * Генерирует календарно-тематическое планирование с помощью AI
   */
  async generateLessonsWithAI(params: GenerateLessonsParams): Promise<AILessonsResponse> {
    return await apiClient.post<AILessonsResponse>('/schedule/lessons/from-ai', params);
  }

  /**
   * Получает расписание на основе уроков
   */
  async getLessonSchedule(filters: LessonScheduleFilters): Promise<LessonScheduleResponse> {
    // Преобразуем фильтры в query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    const url = `/schedule/lessons${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get<LessonScheduleResponse>(url);
  }

  /**
   * Получает расписание для конкретного пользователя
   */
  async getLessonScheduleForUser(
    userRole: string,
    userId: number,
    filters: LessonScheduleFilters
  ): Promise<LessonScheduleResponse> {
    const queryParams = new URLSearchParams();
    Object.entries({ ...filters, role: userRole }).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    const url = `/schedule/lessons/user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get<LessonScheduleResponse>(url);
  }

  /**
   * Получает календарное представление уроков
   */
  async getLessonCalendar(filters: {
    startDate: string;
    endDate: string;
    groupIds?: number[];
    teacherIds?: number[];
  }): Promise<LessonCalendarData> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    const url = `/schedule/lessons/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get<LessonCalendarData>(url);
  }

  /**
   * Получает статистику по урокам
   */
  async getLessonStatistics(filters: {
    startDate?: string;
    endDate?: string;
    groupIds?: number[];
    teacherIds?: number[];
  }): Promise<LessonStatistics> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    const url = `/schedule/lessons/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get<LessonStatistics>(url);
  }

  /**
   * Применяет предварительное расписание уроков
   */
  async applyLessonSchedule(generatedLessons: any[]): Promise<any> {
    return await apiClient.post<any>('/schedule/lessons/apply', { 
      generatedLessons,
      replaceExisting: false 
    });
  }

  /**
   * Получает детали урока
   */
  async getLessonDetails(lessonId: number): Promise<any> {
    return await apiClient.get<any>(`/lessons/${lessonId}`);
  }

  /**
   * Обновляет урок
   */
  async updateLesson(lessonId: number, data: any): Promise<any> {
    return await apiClient.put<any>(`/lessons/${lessonId}`, data);
  }

  /**
   * Удаляет урок
   */
  async deleteLesson(lessonId: number): Promise<void> {
    await apiClient.delete<void>(`/lessons/${lessonId}`);
  }

  /**
   * Получает материалы урока
   */
  async getLessonMaterials(lessonId: number): Promise<any> {
    return await apiClient.get<any>(`/lessons/${lessonId}/materials`);
  }

  /**
   * Получает домашние задания урока
   */
  async getLessonHomework(lessonId: number): Promise<any> {
    return await apiClient.get<any>(`/lessons/${lessonId}/homework`);
  }

  /**
   * Получает доступные уроки для создания занятий в расписании
   */
  async getAvailableLessons(filters?: {
    groupIds?: number[];
    teacherIds?: number[];
    subjectIds?: number[];
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<AvailableLesson[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    
    const url = `/lessons/available${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get<AvailableLesson[]>(url);
  }

  /**
   * Конвертирует дату в формат для отображения
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Конвертирует день недели
   */
  getDayName(dayString: string): string {
    const days = {
      'monday': 'Понедельник',
      'tuesday': 'Вторник', 
      'wednesday': 'Среда',
      'thursday': 'Четверг',
      'friday': 'Пятница',
      'saturday': 'Суббота',
      'sunday': 'Воскресенье'
    };
    return days[dayString as keyof typeof days] || dayString;
  }

  /**
   * Получает цвет для типа урока
   */
  getLessonTypeColor(type: string): string {
    const colors = {
      'lesson': 'bg-blue-500',
      'consultation': 'bg-green-500',
      'extra': 'bg-purple-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  }

  /**
   * Получает иконку для уровня сложности
   */
  getDifficultyIcon(difficulty: string): string {
    const icons = {
      'beginner': '🟢',
      'intermediate': '🟡', 
      'advanced': '🔴'
    };
    return icons[difficulty as keyof typeof icons] || '⚪';
  }
}

export const lessonScheduleService = new LessonScheduleService();
export default lessonScheduleService;
