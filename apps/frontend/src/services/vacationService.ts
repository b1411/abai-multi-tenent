import apiClient from './apiClient';
import {
  Vacation,
  CreateVacationRequest,
  UpdateVacationRequest,
  UpdateVacationStatusRequest,
  VacationFilterParams,
  VacationListResponse,
  VacationSummary,
  TeacherVacationSummary,
  SubstitutionsResponse
} from '../types/vacation';

class VacationService {
  private readonly baseUrl = '/vacations';

  async getVacations(params?: VacationFilterParams): Promise<VacationListResponse> {
    let url = this.baseUrl;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      url += `?${searchParams.toString()}`;
    }
    return await apiClient.get<VacationListResponse>(url);
  }

  async getVacation(id: number): Promise<Vacation> {
    return await apiClient.get<Vacation>(`${this.baseUrl}/${id}`);
  }

  async createVacation(vacation: CreateVacationRequest): Promise<Vacation> {
    return await apiClient.post<Vacation>(this.baseUrl, vacation);
  }

  async updateVacation(id: number, vacation: UpdateVacationRequest): Promise<Vacation> {
    return await apiClient.patch<Vacation>(`${this.baseUrl}/${id}`, vacation);
  }

  async updateVacationStatus(id: number, statusUpdate: UpdateVacationStatusRequest): Promise<Vacation> {
    return await apiClient.patch<Vacation>(`${this.baseUrl}/${id}/status`, statusUpdate);
  }

  async deleteVacation(id: number): Promise<void> {
    await apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  async getVacationsSummary(): Promise<VacationSummary> {
    return await apiClient.get<VacationSummary>(`${this.baseUrl}/summary`);
  }

  async getTeacherVacationSummary(teacherId: number): Promise<TeacherVacationSummary> {
    return await apiClient.get<TeacherVacationSummary>(`${this.baseUrl}/teacher/${teacherId}/summary`);
  }

  async getSubstitutions(params?: {
    date?: string;
    department?: string;
    substituteId?: string;
  }): Promise<SubstitutionsResponse> {
    let url = `${this.baseUrl}/substitutions`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      url += `?${searchParams.toString()}`;
    }
    return await apiClient.get<SubstitutionsResponse>(url);
  }

  // Вспомогательные методы для расчета дней
  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // включая оба дня
  }

  // Проверка пересечения дат
  checkDateOverlap(
    startDate1: string,
    endDate1: string,
    startDate2: string,
    endDate2: string
  ): boolean {
    const start1 = new Date(startDate1);
    const end1 = new Date(endDate1);
    const start2 = new Date(startDate2);
    const end2 = new Date(endDate2);

    return start1 <= end2 && start2 <= end1;
  }

  // Форматирование периода
  formatPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  // Получение цвета статуса
  getStatusColor(status: string): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  }

  // Получение цвета типа отпуска
  getTypeColor(type: string): string {
    const colors = {
      vacation: 'bg-blue-100 text-blue-800',
      sick_leave: 'bg-orange-100 text-orange-800',
      maternity_leave: 'bg-pink-100 text-pink-800',
      unpaid_leave: 'bg-gray-100 text-gray-800',
      business_trip: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || colors.vacation;
  }

  // Проверка возможности редактирования
  canEdit(vacation: Vacation, currentUserId: number, userRole: string): boolean {
    // Только создатель или HR/Админ может редактировать
    const isOwner = vacation.teacher.user.id === currentUserId;
    const isHROrAdmin = ['HR', 'ADMIN'].includes(userRole);

    // Нельзя редактировать одобренные или завершенные отпуска
    const isEditable = !['approved', 'completed'].includes(vacation.status);

    return (isOwner || isHROrAdmin) && isEditable;
  }

  // Проверка возможности изменения статуса
  canChangeStatus(userRole: string): boolean {
    return ['HR', 'ADMIN'].includes(userRole);
  }

  // Валидация дат
  validateDates(startDate: string, endDate: string): string[] {
    const errors: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      errors.push('Дата начала не может быть в прошлом');
    }

    if (end <= start) {
      errors.push('Дата окончания должна быть позже даты начала');
    }

    // Проверка максимального периода (например, 1 год)
    const maxDays = 365;
    const diffDays = this.calculateDays(startDate, endDate);
    if (diffDays > maxDays) {
      errors.push(`Максимальный период отпуска: ${maxDays} дней`);
    }

    return errors;
  }

  // Получение следующих рабочих дней (исключая выходные)
  getWorkingDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // 0 = воскресенье, 6 = суббота
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  // Получение уроков преподавателя для замещения
  async getTeacherLessons(teacherId: number): Promise<{
    teacher: { id: number; name: string };
    lessons: Array<{
      id: number;
      name: string;
      description?: string;
      date: string;
      studyPlan: { id: number; name: string; description?: string };
      groups: Array<{ id: number; name: string }>;
    }>;
  }> {
    return await apiClient.get(`${this.baseUrl}/teacher/${teacherId}/lessons`);
  }

  // Получение расписания преподавателя на период отпуска
  async getTeacherSchedule(teacherId: number, startDate: string, endDate: string): Promise<{
    id: string | number;
    type: 'schedule' | 'lesson';
    name: string;
    date: string;
    startTime?: string;
    endTime?: string;
    studyPlan: {
      id: number;
      name: string;
    };
    groups: {
      id: number;
      name: string;
    }[];
    classroom?: {
      id: number;
      name: string;
    };
  }[]> {
    return await apiClient.get(`${this.baseUrl}/teacher/${teacherId}/schedule?startDate=${startDate}&endDate=${endDate}`);
  }
}

export const vacationService = new VacationService();
