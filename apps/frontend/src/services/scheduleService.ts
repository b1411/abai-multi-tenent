import {
  Schedule,
  ScheduleItem,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleFilters,
  GroupOption,
  TeacherOption,
  StudyPlanOption,
  ClassroomOption,
  ScheduleListResponse
} from '../types/schedule';
import apiClient from './apiClient';
import {
  GenerationParams,
  DraftResponse,
  OptimizeRequestBody,
  OptimizedScheduleResponse,
  ValidationResult as FlowValidationResult,
  ApplyResponse,
  DraftItem
} from '../types/aiScheduleFlow';

class ScheduleService {
  private baseUrl = '/schedule';
  // Временные внутренние типы для API ответов (минимально необходимые поля)
  private static mapGroup(raw: { id: number; name: string; courseNumber?: number | null }): GroupOption {
    return { id: raw.id, name: raw.name, courseNumber: raw.courseNumber ?? 1 };
  }

  private static mapTeacher(raw: { id: number; user?: { name?: string; surname?: string; email?: string } }): TeacherOption {
    return {
      id: raw.id,
      name: raw.user?.name || '',
      surname: raw.user?.surname || '',
      email: raw.user?.email || ''
    };
  }

  // Backend API methods
  async findAll(): Promise<Schedule[]> {
    return apiClient.get<Schedule[]>(this.baseUrl);
  }

  async findOne(id: string): Promise<Schedule> {
    return apiClient.get<Schedule>(`${this.baseUrl}/${id}`);
  }

  async findByGroup(groupId: number): Promise<Schedule[]> {
    return apiClient.get<Schedule[]>(`${this.baseUrl}/group/${groupId}`);
  }

  async findByTeacher(teacherId: number): Promise<Schedule[]> {
    return apiClient.get<Schedule[]>(`${this.baseUrl}/teacher/${teacherId}`);
  }

  async findByClassroom(classroomId: number): Promise<Schedule[]> {
    return apiClient.get<Schedule[]>(`${this.baseUrl}/classroom/${classroomId}`);
  }

  async findByDayOfWeek(dayOfWeek: number): Promise<Schedule[]> {
    return apiClient.get<Schedule[]>(`${this.baseUrl}/day/${dayOfWeek}`);
  }

  async create(data: CreateScheduleDto): Promise<Schedule> {
    return apiClient.post<Schedule>(this.baseUrl, data);
  }

  async update(id: string, data: UpdateScheduleDto): Promise<Schedule> {
    return apiClient.patch<Schedule>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  // AI Schedule Generation methods
  async generateFromStudyPlans(params: GenerationParams): Promise<OptimizedScheduleResponse> {
    return apiClient.post<OptimizedScheduleResponse>(`${this.baseUrl}/study-plans/from-ai`, params);
  }

  async analyzeWithAI(scheduleItems: DraftItem[]): Promise<FlowValidationResult> {
    return apiClient.post<FlowValidationResult>(`${this.baseUrl}/ai-analyze`, scheduleItems);
  }

  async validateAISchedule(scheduleItems: DraftItem[]): Promise<FlowValidationResult> {
    return apiClient.post<FlowValidationResult>(`${this.baseUrl}/ai-validate`, scheduleItems);
  }

  async applySchedule(applyData: { generatedSchedules: DraftItem[]; replaceExisting?: boolean }): Promise<ApplyResponse> {
    return apiClient.post<ApplyResponse>(`${this.baseUrl}/lessons/apply`, applyData);
  }

  async generateWithAI(params: GenerationParams): Promise<OptimizedScheduleResponse> {
    return apiClient.post<OptimizedScheduleResponse>(`${this.baseUrl}/generate-ai`, params);
  }

  // --- New AI Flow endpoints ---
  async flowDraft(params: GenerationParams): Promise<DraftResponse> {
    return apiClient.post<DraftResponse>(`/schedule-flow/draft`, params);
  }

  async flowOptimize(body: OptimizeRequestBody): Promise<OptimizedScheduleResponse> {
    return apiClient.post<OptimizedScheduleResponse>(`/schedule-flow/optimize`, body);
  }

  async flowValidate(generated: OptimizedScheduleResponse): Promise<FlowValidationResult> {
    return apiClient.post<FlowValidationResult>(`/schedule-flow/validate`, { generated });
  }

  async flowApply(generated: OptimizedScheduleResponse): Promise<ApplyResponse> {
    return apiClient.post<ApplyResponse>(`/schedule-flow/apply`, { generated });
  }

  async updateStatuses(): Promise<{ updated: number }> {
    return apiClient.post<{ updated: number }>(`${this.baseUrl}/update-statuses`);
  }

  async updateScheduleDayAndTime(id: string, day: string, startTime: string, endTime: string) {
    const dayOfWeek = this.getDayNumber(day);
    const response = await apiClient.patch<{ data: Schedule }>(`/schedule/${id}`, { dayOfWeek, startTime, endTime });
    return response.data;
  }

  // Новый метод для переноса занятия на конкретную дату
  async rescheduleLesson(id: string, rescheduleData: {
    date?: string;
    startTime?: string;
    endTime?: string;
    classroomId?: number;
    reason?: string;
  }): Promise<Schedule> {
    return apiClient.patch<Schedule>(`${this.baseUrl}/${id}/reschedule`, rescheduleData);
  }

  private getDayNumber(day: string): number {
    const dayMap: { [key: string]: number } = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    return dayMap[day.toLowerCase()] || 1;
  }

  // Методы для получения данных для выпадающих списков (из реального API)
  async getGroups(): Promise<GroupOption[]> {
    try {
  const groups = await apiClient.get<Array<{ id: number; name: string; courseNumber?: number | null }>>('/groups');
  return groups.map(ScheduleService.mapGroup);
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async getTeachers(): Promise<TeacherOption[]> {
    try {
  const teachers = await apiClient.get<Array<{ id: number; user?: { name?: string; surname?: string; email?: string } }>>('/teachers');
  return teachers.map(ScheduleService.mapTeacher);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  }

  async getStudyPlans(params?: { search?: string; limit?: number; groupId?: number; teacherId?: number }): Promise<StudyPlanOption[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.groupId) queryParams.append('groupId', params.groupId.toString());
      if (params?.teacherId) queryParams.append('teacherId', params.teacherId.toString());
      queryParams.append('page', '1');

      const url = `/study-plans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.get<{ data: Array<{ id: number; name: string; description?: string; teacherId: number; group?: Array<{ id: number; name: string }> }>; meta: unknown }>(url);

      const rawPlans = response.data || [];
      const filteredPlans = params?.groupId
        ? rawPlans.filter(p => Array.isArray(p.group) && p.group.some(g => g.id === params.groupId))
        : rawPlans;

      return filteredPlans.map(plan => {
        const group = Array.isArray(plan.group) && plan.group.length > 0
          ? (params?.groupId ? (plan.group.find(g => g.id === params.groupId) || plan.group[0]) : plan.group[0])
          : undefined;
        return {
          id: plan.id,
            name: plan.name,
            description: plan.description,
            teacherId: plan.teacherId,
            groupId: group ? group.id : 0,
            groupName: group ? group.name : 'N/A'
        };
      });
    } catch (error) {
      console.error('Error fetching study plans:', error);
      return [];
    }
  }

  async searchStudyPlans(searchTerm: string, groupId?: number): Promise<StudyPlanOption[]> {
    return this.getStudyPlans({ search: searchTerm, limit: 50, groupId });
  }
  
  async getStudyPlanById(id: number): Promise<StudyPlanOption | null> {
    try {
  const plan = await apiClient.get<{ id: number; name: string; description?: string; teacherId: number; group?: Array<{ id: number; name: string }> }>(`/study-plans/${id}`);
      if (!plan) return null;

      const group = plan.group && plan.group.length > 0 ? plan.group[0] : null;
      
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        teacherId: plan.teacherId,
        groupId: group ? group.id : 0,
        groupName: group ? group.name : 'N/A',
      };
    } catch (error) {
      console.error(`Error fetching study plan with ID ${id}:`, error);
      return null;
    }
  }

  async getClassrooms(): Promise<ClassroomOption[]> {
    try {
      const classrooms = await apiClient.get<Record<string, unknown>[]>('/classrooms');
      return classrooms.map(classroom => ({
        id: Number(classroom.id),
        name: String(classroom.name || ''),
        building: String(classroom.building || ''),
        capacity: Number(classroom.capacity || 0),
        type: String(classroom.type || '')
      }));
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      return [];
    }
  }

  // Helper methods to convert backend data to frontend format
  static convertToScheduleItem(schedule: Schedule): ScheduleItem {
    const dayNames = ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Конвертация статусов из backend в frontend формат с проверкой времени
    const convertStatus = (backendStatus: string, startTime: string, endTime: string, date?: Date, dayOfWeek?: number): ScheduleItem['status'] => {
      // Если backend уже установил статус как завершенный или отмененный, используем его
      if (backendStatus === 'COMPLETED') return 'completed';
      if (backendStatus === 'CANCELLED') return 'cancelled';
      
      // Для статуса SCHEDULED проверяем время на фронтенде
      if (backendStatus === 'SCHEDULED') {
        const now = new Date();
        
        // Если есть конкретная дата, используем её
        if (date) {
          const scheduleDate = new Date(date);
          const endDateTime = new Date(scheduleDate);
          const [hours, minutes] = endTime.split(':');
          endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          return endDateTime <= now ? 'completed' : 'upcoming';
        }
        
        // Если нет конкретной даты, проверяем по дню недели и времени
        if (dayOfWeek) {
          const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
          
          // Если это сегодняшний день недели
          if (currentDayOfWeek === dayOfWeek) {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endDateTime = new Date(today);
            const [hours, minutes] = endTime.split(':');
            endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            return endDateTime <= now ? 'completed' : 'upcoming';
          }
        }
        
        return 'upcoming';
      }
      
      // Перенесенные показываем как предстоящие
      if (['RESCHEDULED', 'MOVED', 'POSTPONED'].includes(backendStatus)) {
        return 'upcoming';
      }
      
      return 'upcoming';
    };

    // Конвертация типов занятий из backend в frontend формат
    const convertType = (backendType: string): ScheduleItem['type'] => {
      switch (backendType) {
        case 'REGULAR':
          return 'lesson';
        case 'MAKEUP':
        case 'SUBSTITUTE':
        case 'EXTRA':
          return 'extra';
        default:
          return 'lesson';
      }
    };

    // Конвертация периодичности из backend в frontend формат
    const convertRepeat = (backendRepeat: string): ScheduleItem['repeat'] => {
      switch (backendRepeat) {
        case 'weekly':
          return 'weekly';
        case 'biweekly':
          return 'biweekly';
        case 'once':
          return 'once';
        default:
          return 'weekly';
      }
    };

    return {
      id: schedule.id,
      day: dayNames[schedule.dayOfWeek] as ScheduleItem['day'],
      date: schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : undefined,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classId: schedule.group?.name || '',
      subject: schedule.studyPlan?.name || '',
      teacherId: schedule.teacherId.toString(),
      teacherName: schedule.teacher ? `${schedule.teacher.user.name} ${schedule.teacher.user.surname}` : '',
      roomId: schedule.classroom?.name || schedule.classroomId?.toString() || '',
      type: convertType(schedule.type || 'REGULAR'),
      repeat: convertRepeat(schedule.repeat || 'weekly'),
      startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : undefined,
      endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : undefined,
      periodPreset: schedule.periodPreset as any,
      status: convertStatus(
        schedule.status || 'SCHEDULED',
        schedule.startTime,
        schedule.endTime,
        schedule.date ? new Date(schedule.date) : undefined,
        schedule.dayOfWeek
      )
    };
  }

  static convertToCreateDto(item: Partial<ScheduleItem>, additionalData: {
    studyPlanId: number;
    groupId: number;
    teacherId: number;
    classroomId?: number;
  }): CreateScheduleDto {
    const dayNumbers = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };

    return {
      studyPlanId: additionalData.studyPlanId,
      groupId: additionalData.groupId,
      teacherId: additionalData.teacherId,
      classroomId: additionalData.classroomId,
      dayOfWeek: dayNumbers[item.day as keyof typeof dayNumbers] || 1,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      ...(item.repeat ? { repeat: item.repeat } : {}),
      ...(item.periodPreset ? { periodPreset: item.periodPreset } : {}),
      ...(!item.periodPreset && item.startDate && item.endDate ? { startDate: item.startDate, endDate: item.endDate } : {}),
      ...(item.repeat === 'once' && item.date ? { date: item.date } : {})
    };
  }

  // Методы для фильтрации расписания по ролям
  static filterScheduleByRole(schedules: Schedule[], userRole: string, userId?: number): Schedule[] {
    switch (userRole) {
      case 'STUDENT':
        // Студент видит только расписание своей группы
        // Нужно получить groupId студента из контекста
        return schedules; // TODO: фильтрация по группе студента

      case 'PARENT':
        // Родитель видит расписание групп своих детей
        return schedules; // TODO: фильтрация по группам детей

      case 'TEACHER':
        // Преподаватель видит только свои занятия
        return schedules.filter(schedule =>
          schedule.teacher?.userId === userId
        );

      case 'ADMIN':
        // Администратор видит все расписание
        return schedules;

      default:
        return [];
    }
  }

  // Получение расписания с учетом роли пользователя
  async getScheduleForUser(userRole: string, userId?: number, filters?: ScheduleFilters): Promise<ScheduleItem[] | ScheduleListResponse> {
    try {
      let schedules: Schedule[] = [];

      // Получаем данные в зависимости от фильтров
      if (filters?.groupId) {
        schedules = await this.findByGroup(filters.groupId);
      } else if (filters?.teacherId) {
        schedules = await this.findByTeacher(filters.teacherId);
      } else if (filters?.classroomId) {
        schedules = await this.findByClassroom(filters.classroomId);
      } else if (filters?.dayOfWeek) {
        schedules = await this.findByDayOfWeek(filters.dayOfWeek);
      } else {
        schedules = await this.findAll();
      }

      // Фильтруем по роли
      const filteredSchedules = ScheduleService.filterScheduleByRole(schedules, userRole, userId);

      // Конвертируем в формат для отображения
      const convertedSchedules = filteredSchedules.map(schedule =>
        ScheduleService.convertToScheduleItem(schedule)
      );

      // Если указана пагинация, применяем её
      if (filters?.page && filters?.pageSize) {
        const page = filters.page;
        const pageSize = filters.pageSize;
        const total = convertedSchedules.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedItems = convertedSchedules.slice(startIndex, endIndex);

        // Возвращаем объект с пагинацией
        return {
          items: paginatedItems,
          total: total,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(total / pageSize)
        };
      }

      // Если пагинация не указана, возвращаем весь массив
      return convertedSchedules;
    } catch (error) {
      console.error('Error fetching schedule:', error);

      if (filters?.page && filters?.pageSize) {
        return {
          items: [],
          total: 0,
          page: filters.page,
          pageSize: filters.pageSize,
          totalPages: 0
        };
      }

      return [];
    }
  }

  // Utility methods for date manipulation
  static formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static formatDateRange(startTime: string, endTime: string): string {
    const start = this.formatTime(startTime);
    const end = this.formatTime(endTime);
    return `${start} - ${end}`;
  }

  static getTypeColor(type: string): string {
    switch (type) {
      case 'lesson':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'event':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  static getTypeIcon(type: string): string {
    switch (type) {
      case 'lesson':
        return 'BookOpen';
      case 'exam':
        return 'FileText';
      case 'meeting':
        return 'Users';
      case 'event':
        return 'Calendar';
      default:
        return 'Clock';
    }
  }

  static isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }

  static isUpcoming(date: string, startTime: string): boolean {
    const now = new Date();
    const scheduleDateTime = new Date(`${date}T${startTime}`);
    return scheduleDateTime > now;
  }

  static isOngoing(date: string, startTime: string, endTime: string): boolean {
    const now = new Date();
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    return now >= startDateTime && now <= endDateTime;
  }

  static getDuration(startTime: string, endTime: string): string {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} мин`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (mins === 0) {
      return `${hours} ч`;
    }

    return `${hours} ч ${mins} мин`;
  }
}

export { ScheduleService };
export default new ScheduleService();
