import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Loader, Edit, X } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { calendarService, CalendarEvent } from '../services/calendarService';
import EventForm from '../components/EventForm';
import EventDetailsModal from '../components/EventDetailsModal';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Загрузка событий для текущего месяца
  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const eventsData = await calendarService.getEventsForMonth(year, month);
      setEvents(eventsData);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
      // Fallback на моковые данные при ошибке
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Конвертация события backend в формат для отображения
  const convertEventForDisplay = (event: CalendarEvent) => {
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
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateString;
    }).map(convertEventForDisplay);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const today = new Date();
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getEventColor = (event: CalendarEvent) => {
    return event.color || '#3B82F6'; // default blue
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      await calendarService.createEvent(eventData);
      await loadEvents();
      setShowEventModal(false);
      setEditingEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('Ошибка создания события:', error);
    }
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!editingEvent) return;
    
    try {
      await calendarService.updateEvent(editingEvent.id, eventData);
      await loadEvents();
      setShowEventModal(false);
      setEditingEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('Ошибка обновления события:', error);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm('Вы уверены, что хотите удалить это событие?')) {
      try {
        await calendarService.deleteEvent(eventId);
        await loadEvents();
      } catch (error) {
        console.error('Ошибка удаления события:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const handleEventSubmit = async (eventData: any) => {
    if (editingEvent) {
      await handleUpdateEvent(eventData);
    } else {
      await handleCreateEvent(eventData);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Загрузка календаря...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Календарь</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              День
            </button>
          </div>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Новое событие
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {getDaysInMonth(currentDate).map((date, index) => {
              if (!date) {
                return <div key={index} className="h-32 border-r border-b border-gray-100"></div>;
              }

              const dayEvents = getEventsForDate(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`h-32 border-r border-b border-gray-100 p-2 cursor-pointer hover:bg-gray-50 ${
                    !isSameMonth(date) ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedDate(date);
                    setShowEventModal(true);
                  }}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday(date) 
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : !isSameMonth(date)
                      ? 'text-gray-400'
                      : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: getEventColor(event) }}
                        title={event.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowEventDetails(true);
                        }}
                      >
                        {event.startTime} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} еще
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events sidebar for selected date */}
      {selectedDate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            События на {formatDate(selectedDate)}
          </h3>
          <div className="space-y-3">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-center py-8">Нет событий на этот день</p>
            ) : (
              getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDetails(true);
                      }}
                    >
                      <h4 className="font-medium text-gray-900 hover:text-blue-600">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.attendees.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Редактировать событие"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Удалить событие"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getEventColor(event) }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Today's events summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Сегодня ({formatDate(today)})
        </h3>
        <div className="space-y-3">
          {getEventsForDate(today).length === 0 ? (
            <p className="text-gray-500">Сегодня нет событий</p>
          ) : (
            getEventsForDate(today).map((event) => (
              <div 
                key={event.id} 
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventDetails(true);
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getEventColor(event) }}
                ></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className="text-sm text-gray-500">{event.startTime} - {event.endTime}</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={showEventDetails}
        onClose={() => setShowEventDetails(false)}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Event Form Modal */}
      <EventForm
        isOpen={showEventModal}
        onClose={handleCloseModal}
        onSubmit={handleEventSubmit}
        event={editingEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Calendar;
