import apiClient from './apiClient';

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  timezone?: string;
  createdById: number;
  participants: {
    id: number;
    userId: number;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
    comment?: string;
    user: {
      id: number;
      name: string;
      surname: string;
      avatar?: string;
    };
  }[];
  createdBy: {
    id: number;
    name: string;
    surname: string;
    avatar?: string;
  };
  reminders?: {
    id: number;
    minutes: number;
    method: string;
  }[];
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  participantIds?: number[];
  color?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  timezone?: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventFilterDto {
  startDate?: string;
  endDate?: string;
  search?: string;
  timezone?: string;
}

class CalendarService {
  // Получить события пользователя
  async getEvents(filters?: EventFilterDto): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.timezone) params.append('timezone', filters.timezone);

    return apiClient.get<CalendarEvent[]>(`/calendar/events?${params.toString()}`);
  }

  // Получить события на сегодня
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    return apiClient.get<CalendarEvent[]>('/calendar/events/today');
  }

  // Получить событие по ID
  async getEvent(eventId: number): Promise<CalendarEvent> {
    return apiClient.get<CalendarEvent>(`/calendar/events/${eventId}`);
  }

  // Создать новое событие
  async createEvent(eventData: CreateEventDto): Promise<CalendarEvent> {
    return apiClient.post<CalendarEvent>('/calendar/events', eventData);
  }

  // Обновить событие
  async updateEvent(eventId: number, eventData: UpdateEventDto): Promise<CalendarEvent> {
    return apiClient.put<CalendarEvent>(`/calendar/events/${eventId}`, eventData);
  }

  // Удалить событие
  async deleteEvent(eventId: number): Promise<void> {
    await apiClient.delete(`/calendar/events/${eventId}`);
  }

  // Обновить статус участия в событии
  async updateParticipantStatus(
    eventId: number,
    status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE',
    comment?: string
  ): Promise<void> {
    await apiClient.put(`/calendar/events/${eventId}/status`, { status, comment });
  }

  // Создать напоминание
  async createReminder(
    eventId: number,
    minutes: number,
    method: string = 'email'
  ): Promise<void> {
    await apiClient.post(`/calendar/events/${eventId}/reminders`, { minutes, method });
  }

  // Удалить напоминание
  async deleteReminder(reminderId: number): Promise<void> {
    await apiClient.delete(`/calendar/reminders/${reminderId}`);
  }

  // Получить события для определенного месяца
  async getEventsForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return this.getEvents({ startDate, endDate });
  }

  // Получить события для определенной даты
  async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    const dateString = date.toISOString().split('T')[0];
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayString = nextDay.toISOString().split('T')[0];
    
    return this.getEvents({ startDate: dateString, endDate: nextDayString });
  }
}

export const calendarService = new CalendarService();
