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

class ScheduleService {
  private baseUrl = '/schedule';

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
  async generateFromStudyPlans(params: any): Promise<any> {
    return apiClient.post<any>(`${this.baseUrl}/study-plans/from-ai`, params);
  }

  async analyzeWithAI(scheduleItems: any[]): Promise<any> {
    return apiClient.post<any>(`${this.baseUrl}/ai-analyze`, scheduleItems);
  }

  async validateAISchedule(scheduleItems: any[]): Promise<any> {
    return apiClient.post<any>(`${this.baseUrl}/ai-validate`, scheduleItems);
  }

  async applySchedule(applyData: { generatedSchedules: any[], replaceExisting?: boolean }): Promise<any> {
    return apiClient.post<any>(`${this.baseUrl}/lessons/apply`, applyData);
  }

  async updateScheduleDayAndTime(id: string, day: string, startTime: string, endTime: string) {
    const dayOfWeek = this.getDayNumber(day);
    const response = await apiClient.patch<{ data: Schedule }>(`/schedule/${id}`, { dayOfWeek, startTime, endTime });
    return response.data;
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
      const groups = await apiClient.get<any[]>('/groups');
      return groups.map(group => ({
        id: group.id,
        name: group.name,
        courseNumber: group.courseNumber || 1
      }));
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async getTeachers(): Promise<TeacherOption[]> {
    try {
      const teachers = await apiClient.get<any[]>('/teachers');
      return teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user?.name || '',
        surname: teacher.user?.surname || '',
        email: teacher.user?.email || ''
      }));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  }

  async getStudyPlans(params?: { search?: string; limit?: number }): Promise<StudyPlanOption[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      queryParams.append('page', '1');

      const url = `/study-plans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.get<{ data: any[], meta: any }>(url);

      return response.data.map(plan => {
        // Предполагаем, что у плана есть массив group и мы берем первую группу
        const group = plan.group && plan.group.length > 0 ? plan.group[0] : null;
        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          teacherId: plan.teacherId,
          groupId: group ? group.id : 0,
          groupName: group ? group.name : 'N/A',
        };
      });
    } catch (error) {
      console.error('Error fetching study plans:', error);
      return [];
    }
  }

  async searchStudyPlans(searchTerm: string): Promise<StudyPlanOption[]> {
    return this.getStudyPlans({ search: searchTerm, limit: 50 });
  }
  
  async getStudyPlanById(id: number): Promise<StudyPlanOption | null> {
    try {
      const plan = await apiClient.get<any>(`/study-plans/${id}`);
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

    return {
      id: schedule.id,
      day: dayNames[schedule.dayOfWeek] as ScheduleItem['day'],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classId: schedule.group?.name || '',
      subject: schedule.studyPlan?.name || '', // используем name вместо subject
      teacherId: schedule.teacherId.toString(),
      teacherName: schedule.teacher ? `${schedule.teacher.user.name} ${schedule.teacher.user.surname}` : '',
      roomId: schedule.classroom?.name || schedule.classroomId?.toString() || '',
      type: 'lesson', // Default type, можно расширить логику
      repeat: 'weekly', // Default repeat
      status: 'upcoming'
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
      endTime: item.endTime || ''
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
