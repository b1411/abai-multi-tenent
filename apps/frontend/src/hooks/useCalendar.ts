import { useState, useEffect, useCallback } from 'react';
import { calendarService, CalendarEvent, CreateEventDto, UpdateEventDto } from '../services/calendarService';

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка событий для определенного месяца
  const loadEventsForMonth = useCallback(async (year: number, month: number) => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await calendarService.getEventsForMonth(year, month);
      setEvents(eventsData);
    } catch (err) {
      setError('Ошибка загрузки событий');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка событий на сегодня
  const loadTodaysEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await calendarService.getTodaysEvents();
      setEvents(eventsData);
    } catch (err) {
      setError('Ошибка загрузки событий на сегодня');
      console.error('Error loading today events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание нового события
  const createEvent = useCallback(async (eventData: CreateEventDto) => {
    try {
      setLoading(true);
      setError(null);
      const newEvent = await calendarService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError('Ошибка создания события');
      console.error('Error creating event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление события
  const updateEvent = useCallback(async (eventId: number, eventData: UpdateEventDto) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvent = await calendarService.updateEvent(eventId, eventData);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      setError('Ошибка обновления события');
      console.error('Error updating event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Удаление события
  const deleteEvent = useCallback(async (eventId: number) => {
    try {
      setLoading(true);
      setError(null);
      await calendarService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError('Ошибка удаления события');
      console.error('Error deleting event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление статуса участия
  const updateParticipantStatus = useCallback(async (
    eventId: number,
    status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE',
    comment?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await calendarService.updateParticipantStatus(eventId, status, comment);
      // Обновляем локальное состояние
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            participants: event.participants.map(p => {
              // Предполагаем, что это текущий пользователь
              return { ...p, status };
            })
          };
        }
        return event;
      }));
    } catch (err) {
      setError('Ошибка обновления статуса участия');
      console.error('Error updating participant status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание напоминания
  const createReminder = useCallback(async (
    eventId: number,
    minutes: number,
    method: string = 'email'
  ) => {
    try {
      setLoading(true);
      setError(null);
      await calendarService.createReminder(eventId, minutes, method);
    } catch (err) {
      setError('Ошибка создания напоминания');
      console.error('Error creating reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Удаление напоминания
  const deleteReminder = useCallback(async (reminderId: number) => {
    try {
      setLoading(true);
      setError(null);
      await calendarService.deleteReminder(reminderId);
    } catch (err) {
      setError('Ошибка удаления напоминания');
      console.error('Error deleting reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение событий для определенной даты
  const getEventsForDate = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  }, [events]);

  // Конвертация события для отображения
  const convertEventForDisplay = useCallback((event: CalendarEvent) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    return {
      ...event,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: endDate.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      attendees: event.participants?.map(p => `${p.user.name} ${p.user.surname}`) || [],
    };
  }, []);

  return {
    events,
    loading,
    error,
    loadEventsForMonth,
    loadTodaysEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    updateParticipantStatus,
    createReminder,
    deleteReminder,
    getEventsForDate,
    convertEventForDisplay,
  };
};
