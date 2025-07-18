import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaListUl,
  FaClock,
  FaTimes,
  FaCheck,
  FaTrash,
  FaEdit,
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserTie,
  FaBuilding
} from 'react-icons/fa';

interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  description?: string;
  location?: string;
  type?: 'meeting' | 'task' | 'reminder' | 'event' | 'class';
  participants?: {
    type: 'teacher' | 'student' | 'parent' | 'staff';
    groups?: string[];
  }[];
  classroom?: string;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Педагогический совет',
      start: '2025-04-01T10:00:00',
      end: '2025-04-01T12:00:00',
      type: 'meeting',
      location: 'Конференц-зал',
      description: 'Обсуждение учебного плана на следующий семестр',
      participants: [{ type: 'teacher' }],
      color: 'var(--corporate-secondary)'
    },
    {
      id: '2',
      title: 'Родительское собрание 9А',
      start: '2025-04-02T18:00:00',
      end: '2025-04-02T19:30:00',
      type: 'meeting',
      location: 'Кабинет 205',
      description: 'Итоги четверти и подготовка к экзаменам',
      participants: [
        { type: 'teacher', groups: ['9А'] },
        { type: 'parent', groups: ['9А'] }
      ],
      color: 'var(--corporate-secondary)'
    },
    {
      id: '3',
      title: 'Урок математики 10Б',
      start: '2025-03-31T09:00:00',
      end: '2025-03-31T09:45:00',
      type: 'class',
      location: 'Кабинет 301',
      participants: [
        { type: 'teacher', groups: ['10Б'] },
        { type: 'student', groups: ['10Б'] }
      ],
      color: 'var(--corporate-primary)'
    },
    {
      id: '4',
      title: 'Консультация по физике',
      start: '2025-04-03T14:30:00',
      end: '2025-04-03T16:00:00',
      type: 'class',
      location: 'Кабинет 401',
      description: 'Подготовка к олимпиаде',
      participants: [
        { type: 'teacher' },
        { type: 'student', groups: ['10А', '10Б', '11А', '11Б'] }
      ],
      color: 'var(--corporate-secondary)'
    },
    {
      id: '5',
      title: 'Совещание завучей',
      start: '2025-04-04T15:00:00',
      end: '2025-04-04T16:30:00',
      type: 'meeting',
      location: 'Кабинет директора',
      description: 'Планирование мероприятий на следующий месяц',
      participants: [{ type: 'staff' }],
      color: 'var(--corporate-accent)'
    },
    {
      id: '6',
      title: 'Школьный концерт',
      start: '2024-04-20',
      allDay: true,
      type: 'event',
      location: 'Актовый зал',
      description: 'Праздничный концерт к 8 марта',
      participants: [
        { type: 'teacher' },
        { type: 'student' },
        { type: 'parent' }
      ],
      color: 'var(--corporate-tertiary)'
    },
    {
      id: '7',
      title: 'Сдача отчетов',
      start: '2024-04-22',
      allDay: true,
      type: 'task',
      description: 'Сдача квартальных отчетов',
      participants: [{ type: 'teacher' }],
      color: 'var(--corporate-accent)'
    },
    {
      id: '8',
      title: 'Открытый урок по химии 11А',
      start: '2024-04-19T10:00:00',
      end: '2024-04-19T10:45:00',
      type: 'class',
      location: 'Кабинет 401',
      description: 'Демонстрация опытов по органической химии',
      participants: [
        { type: 'teacher', groups: ['11А'] },
        { type: 'student', groups: ['11А'] },
        { type: 'staff' }
      ],
      color: 'var(--corporate-tertiary)'
    },
    {
      id: '9',
      title: 'Спортивные соревнования',
      start: '2024-04-21',
      end: '2024-04-23',
      allDay: true,
      type: 'event',
      location: 'Спортзал',
      description: 'Межшкольные соревнования по волейболу',
      participants: [
        { type: 'teacher' },
        { type: 'student', groups: ['9А', '9Б', '10А', '10Б'] },
        { type: 'parent' }
      ],
      color: 'var(--corporate-primary)'
    },
    {
      id: '10',
      title: 'Мастер-класс по робототехнике',
      start: '2024-04-15T14:00:00',
      end: '2024-04-15T16:00:00',
      type: 'class',
      location: 'Кабинет 202',
      description: 'Практическое занятие по программированию роботов',
      participants: [
        { type: 'teacher' },
        { type: 'student', groups: ['8А', '8Б'] }
      ],
      color: 'var(--corporate-secondary)'
    },
    {
      id: '11',
      title: 'Собрание школьного совета',
      start: '2024-04-20T13:00:00',
      end: '2024-04-20T14:30:00',
      type: 'meeting',
      location: 'Конференц-зал',
      description: 'Обсуждение подготовки к выпускному вечеру',
      participants: [
        { type: 'teacher' },
        { type: 'student', groups: ['11А', '11Б'] },
        { type: 'staff' }
      ],
      color: 'var(--corporate-primary)'
    },
    {
      id: '12',
      title: 'Психологический тренинг',
      start: '2024-04-18T09:00:00',
      end: '2024-04-18T11:00:00',
      type: 'event',
      location: 'Кабинет 105',
      description: 'Тренинг по управлению стрессом для учителей',
      participants: [
        { type: 'teacher' },
        { type: 'staff' }
      ],
      color: 'var(--corporate-secondary)'
    }
  ]);

  const classrooms: Classroom[] = [
    { id: '101', name: 'Кабинет 101', capacity: 30, equipment: ['Проектор', 'Компьютер'] },
    { id: '102', name: 'Кабинет 102', capacity: 25, equipment: ['Интерактивная доска'] },
    { id: '201', name: 'Кабинет 201', capacity: 35, equipment: ['Проектор', 'Компьютер'] },
    { id: '202', name: 'Кабинет 202', capacity: 30, equipment: ['Компьютеры'] },
    { id: 'conf', name: 'Конференц-зал', capacity: 100, equipment: ['Проектор', 'Звуковая система'] },
    { id: 'act', name: 'Актовый зал', capacity: 200, equipment: ['Сцена', 'Звуковая система'] },
  ];

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState('timeGridWeek');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Добавляем состояние для фильтров
  const [selectedTypes, setSelectedTypes] = useState<Event['type'][]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Функция фильтрации событий
  const filteredEvents = events.filter(event => {
    // Фильтр по поиску
    const matchesSearch = searchQuery
      ? event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Фильтр по типу события
    const matchesType = selectedTypes.length === 0 || (event.type && selectedTypes.includes(event.type));

    // Фильтр по участникам
    const matchesParticipants = selectedParticipants.length === 0 ||
      (event.participants && event.participants.some(p => selectedParticipants.includes(p.type)));

    // Фильтр по группам
    const matchesGroups = selectedGroups.length === 0 ||
      (event.participants && event.participants.some(p => 
        p.groups && p.groups.some(g => selectedGroups.includes(g))
      ));

    return matchesSearch && matchesType && matchesParticipants && matchesGroups;
  });

  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent({
      id: String(Date.now()),
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      participants: []
    });
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(events.find(event => event.id === clickInfo.event.id) || null);
    setShowEventModal(true);
  };

  const handleEventDrop = (dropInfo: any) => {
    const updatedEvents = events.map(event => {
      if (event.id === dropInfo.event.id) {
        return {
          ...event,
          start: dropInfo.event.startStr,
          end: dropInfo.event.endStr
        };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Верхняя панель */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-corporate-primary">Календарь</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedEvent({
                  id: String(Date.now()),
                  title: '',
                  start: new Date().toISOString(),
                  participants: []
                });
                setShowEventModal(true);
              }}
              className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
            >
              <FaPlus className="mr-2" />
              Добавить событие
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск событий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-corporate-primary/10 text-corporate-primary' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <FaFilter />
            </button>
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-corporate-primary mb-3">
                Тип события
              </label>
              <div className="space-y-2">
                {['meeting', 'task', 'reminder', 'event', 'class'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type as Event['type'])}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTypes([...selectedTypes, type as Event['type']]);
                        } else {
                          setSelectedTypes(selectedTypes.filter(t => t !== type));
                        }
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <span className="text-sm text-gray-700">
                      {type === 'meeting' && 'Встреча'}
                      {type === 'task' && 'Задача'}
                      {type === 'reminder' && 'Напоминание'}
                      {type === 'event' && 'Событие'}
                      {type === 'class' && 'Урок'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-corporate-primary mb-3">
                Участники
              </label>
              <div className="space-y-2">
                {['teacher', 'student', 'parent', 'staff'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedParticipants([...selectedParticipants, type]);
                        } else {
                          setSelectedParticipants(selectedParticipants.filter(t => t !== type));
                        }
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <span className="text-sm text-gray-700">
                      {type === 'teacher' && 'Учителя'}
                      {type === 'student' && 'Ученики'}
                      {type === 'parent' && 'Родители'}
                      {type === 'staff' && 'Персонал'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-corporate-primary mb-3">
                Классы
              </label>
              <div className="space-y-2">
                {['8А', '8Б', '9А', '9Б', '10А', '10Б', '11А', '11Б'].map((group) => (
                  <label key={group} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups([...selectedGroups, group]);
                        } else {
                          setSelectedGroups(selectedGroups.filter(g => g !== group));
                        }
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <span className="text-sm text-gray-700">{group}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
              <button
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedParticipants([]);
                  setSelectedGroups([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-corporate-primary hover:bg-corporate-primary/10 rounded-lg transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Основная область календаря */}
      <div className="flex-1 p-4 bg-white rounded-lg shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView="dayGridMonth"
          initialDate="2025-04-01"
          locale={ruLocale}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={false}
          weekends={true}
          events={filteredEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="100%"
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          allDayText="Весь день"
          buttonText={{
            today: 'Сегодня',
            month: 'Месяц',
            week: 'Неделя',
            day: 'День',
            list: 'Список'
          }}
          firstDay={1}
          dayHeaderClassNames="text-sm font-semibold text-gray-700 py-2"
          dayCellClassNames="min-h-[120px] p-1 hover:bg-gray-50 transition-colors"
          slotLabelClassNames="text-xs font-medium text-gray-500 w-16"
          eventClassNames="rounded-lg shadow-sm"
          nowIndicatorClassNames="bg-corporate-primary"
          slotEventOverlap={false}
          eventContent={(eventInfo) => {
            const event = events.find(e => e.id === eventInfo.event.id);
            const isMonthView = eventInfo.view.type === 'dayGridMonth';
            
            return (
              <div className={`
                h-full rounded-lg border-l-4 
                ${isMonthView ? 'p-1.5' : 'p-2'} 
                bg-white shadow-sm hover:shadow-md transition-all
                ${event?.type === 'class' 
                  ? 'border-corporate-primary' 
                  : event?.type === 'meeting' 
                    ? 'border-corporate-secondary'
                    : event?.type === 'task' 
                      ? 'border-corporate-accent'
                      : 'border-corporate-tertiary'
                }
              `}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-1.5">
                    {event?.type === 'class' && <FaChalkboardTeacher size={12} className="text-corporate-primary flex-shrink-0" />}
                    {event?.type === 'meeting' && <FaUsers size={12} className="text-corporate-secondary flex-shrink-0" />}
                    {event?.type === 'task' && <FaClock size={12} className="text-corporate-accent flex-shrink-0" />}
                    {event?.type === 'event' && <FaCalendarAlt size={12} className="text-corporate-tertiary flex-shrink-0" />}
                    <div className="font-semibold text-sm text-gray-800 truncate flex-1">
                      {eventInfo.event.title}
                    </div>
                  </div>
                  
                  {!isMonthView && (
                    <div className="mt-1 space-y-1">
                      {!eventInfo.event.allDay && (
                        <div className="flex items-center gap-1">
                          <FaClock size={10} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600">
                            {eventInfo.timeText}
                          </span>
                        </div>
                      )}
                      {event?.location && (
                        <div className="flex items-center gap-1">
                          <FaBuilding size={10} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate">
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
          moreLinkContent={({ num }) => (
            <div className="text-xs font-medium text-corporate-primary hover:text-corporate-primary/80 transition-colors">
              +{num} ещё
            </div>
          )}
          moreLinkClassNames="bg-corporate-primary/5 rounded-full px-2 py-0.5"
          dayCellContent={(arg) => (
            <div className="text-sm font-medium text-gray-700">
              {arg.dayNumberText}
            </div>
          )}
          views={{
            dayGridMonth: {
              dayMaxEventRows: 4,
              dayHeaderFormat: { weekday: 'short', day: 'numeric' }
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: 'short', day: 'numeric' }
            },
            timeGridDay: {
              dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' }
            }
          }}
        />
      </div>

      {/* Модальное окно создания/редактирования события */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-corporate-primary">
                {selectedEvent.id ? 'Редактировать событие' : 'Новое событие'}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={selectedEvent.title}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary focus:ring-1 focus:ring-corporate-primary"
                  placeholder="Введите название события"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-corporate-primary mb-2">
                    Начало
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedEvent.start.slice(0, 16)}
                    onChange={(e) =>
                      setSelectedEvent({ ...selectedEvent, start: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary focus:ring-1 focus:ring-corporate-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-corporate-primary mb-2">
                    Конец
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedEvent.end?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setSelectedEvent({ ...selectedEvent, end: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary focus:ring-1 focus:ring-corporate-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Тип события
                </label>
                <select
                  value={selectedEvent.type || 'event'}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      type: e.target.value as Event['type']
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary focus:ring-1 focus:ring-corporate-primary"
                >
                  <option value="meeting">Встреча</option>
                  <option value="task">Задача</option>
                  <option value="reminder">Напоминание</option>
                  <option value="event">Событие</option>
                  <option value="class">Урок</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Аудитория
                </label>
                <select
                  value={selectedEvent.classroom || ''}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      classroom: e.target.value,
                      location: classrooms.find(c => c.id === e.target.value)?.name
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary focus:ring-1 focus:ring-corporate-primary"
                >
                  <option value="">Выберите аудиторию</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} (вместимость: {classroom.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Участники
                </label>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEvent.participants?.some(p => p.type === 'teacher')}
                      onChange={(e) => {
                        const participants = selectedEvent.participants || [];
                        if (e.target.checked) {
                          participants.push({ type: 'teacher' });
                        } else {
                          const index = participants.findIndex(p => p.type === 'teacher');
                          if (index !== -1) participants.splice(index, 1);
                        }
                        setSelectedEvent({ ...selectedEvent, participants });
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <FaChalkboardTeacher className="mr-2 text-corporate-primary" />
                    <span className="text-sm text-gray-700">Учителя</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEvent.participants?.some(p => p.type === 'student')}
                      onChange={(e) => {
                        const participants = selectedEvent.participants || [];
                        if (e.target.checked) {
                          participants.push({ type: 'student' });
                        } else {
                          const index = participants.findIndex(p => p.type === 'student');
                          if (index !== -1) participants.splice(index, 1);
                        }
                        setSelectedEvent({ ...selectedEvent, participants });
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <FaUserGraduate className="mr-2 text-corporate-primary" />
                    <span className="text-sm text-gray-700">Ученики</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEvent.participants?.some(p => p.type === 'parent')}
                      onChange={(e) => {
                        const participants = selectedEvent.participants || [];
                        if (e.target.checked) {
                          participants.push({ type: 'parent' });
                        } else {
                          const index = participants.findIndex(p => p.type === 'parent');
                          if (index !== -1) participants.splice(index, 1);
                        }
                        setSelectedEvent({ ...selectedEvent, participants });
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <FaUsers className="mr-2 text-corporate-primary" />
                    <span className="text-sm text-gray-700">Родители</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEvent.participants?.some(p => p.type === 'staff')}
                      onChange={(e) => {
                        const participants = selectedEvent.participants || [];
                        if (e.target.checked) {
                          participants.push({ type: 'staff' });
                        } else {
                          const index = participants.findIndex(p => p.type === 'staff');
                          if (index !== -1) participants.splice(index, 1);
                        }
                        setSelectedEvent({ ...selectedEvent, participants });
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                    />
                    <FaUserTie className="mr-2 text-corporate-primary" />
                    <span className="text-sm text-gray-700">Персонал</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-corporate-primary mb-2">
                  Описание
                </label>
                <textarea
                  value={selectedEvent.description || ''}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      description: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-corporate-primary focus:ring-1 focus:ring-corporate-primary resize-none"
                  rows={3}
                  placeholder="Добавьте описание события"
                />
              </div>

              <div className="flex justify-between pt-6">
                {selectedEvent.id && (
                  <button
                    onClick={() => {
                      setEvents(events.filter((e) => e.id !== selectedEvent.id));
                      setShowEventModal(false);
                    }}
                    className="flex items-center px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash className="mr-2" />
                    Удалить
                  </button>
                )}
                <div className="space-x-2">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      if (selectedEvent.id) {
                        setEvents(
                          events.map((e) =>
                            e.id === selectedEvent.id ? selectedEvent : e
                          )
                        );
                      } else {
                        setEvents([...events, selectedEvent]);
                      }
                      setShowEventModal(false);
                    }}
                    className="flex items-center px-4 py-2 bg-corporate-primary text-white rounded-lg hover:bg-corporate-primary/90 transition-colors"
                  >
                    <FaCheck className="mr-2" />
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 