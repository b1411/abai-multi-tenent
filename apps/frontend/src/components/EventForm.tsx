import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Bell, Repeat, Palette } from 'lucide-react';
import { CalendarEvent, CreateEventDto, UpdateEventDto } from '../services/calendarService';
import { teacherService } from '../services/teacherService';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  middlename?: string;
}

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateEventDto | UpdateEventDto) => Promise<void>;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
}

const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  selectedDate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
    location: '',
    color: '#3B82F6',
    isRecurring: false,
    recurrenceRule: '',
    participantIds: [] as number[]
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const colorOptions = [
    { value: '#3B82F6', label: 'Синий', color: 'bg-blue-500' },
    { value: '#10B981', label: 'Зеленый', color: 'bg-green-500' },
    { value: '#F59E0B', label: 'Желтый', color: 'bg-yellow-500' },
    { value: '#EF4444', label: 'Красный', color: 'bg-red-500' },
    { value: '#8B5CF6', label: 'Фиолетовый', color: 'bg-purple-500' },
    { value: '#F97316', label: 'Оранжевый', color: 'bg-orange-500' },
    { value: '#EC4899', label: 'Розовый', color: 'bg-pink-500' },
    { value: '#6B7280', label: 'Серый', color: 'bg-gray-500' }
  ];

  // Загрузка пользователей при открытии формы
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (event) {
        populateFormFromEvent(event);
      } else if (selectedDate) {
        populateFormFromSelectedDate(selectedDate);
      } else {
        resetForm();
      }
    }
  }, [isOpen, event, selectedDate]);

  const loadUsers = async () => {
    try {
      const availableUsers = await teacherService.getAvailableUsers();
      setUsers(availableUsers);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const populateFormFromEvent = (eventData: CalendarEvent) => {
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);

    setFormData({
      title: eventData.title,
      description: eventData.description || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: eventData.isAllDay ? '' : startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: eventData.isAllDay ? '' : endDate.toTimeString().slice(0, 5),
      isAllDay: eventData.isAllDay || false,
      location: eventData.location || '',
      color: eventData.color || '#3B82F6',
      isRecurring: eventData.isRecurring || false,
      recurrenceRule: eventData.recurrenceRule || '',
      participantIds: eventData.participants?.map(p => p.userId) || []
    });
  };

  const populateFormFromSelectedDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const now = new Date();
    const defaultStartTime = `${now.getHours().toString().padStart(2, '0')}:${Math.ceil(now.getMinutes() / 15) * 15}`.slice(0, 5);
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

    setFormData({
      title: '',
      description: '',
      startDate: dateString,
      startTime: defaultStartTime,
      endDate: dateString,
      endTime: defaultEndTime,
      isAllDay: false,
      location: '',
      color: '#3B82F6',
      isRecurring: false,
      recurrenceRule: '',
      participantIds: []
    });
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const defaultStartTime = `${now.getHours().toString().padStart(2, '0')}:${Math.ceil(now.getMinutes() / 15) * 15}`.slice(0, 5);
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

    setFormData({
      title: '',
      description: '',
      startDate: today,
      startTime: defaultStartTime,
      endDate: today,
      endTime: defaultEndTime,
      isAllDay: false,
      location: '',
      color: '#3B82F6',
      isRecurring: false,
      recurrenceRule: '',
      participantIds: []
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название события обязательно';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Дата начала обязательна';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Дата окончания обязательна';
    }

    if (!formData.isAllDay) {
      if (!formData.startTime) {
        newErrors.startTime = 'Время начала обязательно';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'Время окончания обязательно';
      }

      // Проверка что время окончания больше времени начала
      if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        
        if (endDateTime <= startDateTime) {
          newErrors.endTime = 'Время окончания должно быть позже времени начала';
        }
      }
    } else {
      // Для целодневных событий проверяем только даты
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        
        if (endDate < startDate) {
          newErrors.endDate = 'Дата окончания должна быть не раньше даты начала';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let startDateTime: string;
      let endDateTime: string;

      if (formData.isAllDay) {
        // Для целодневных событий устанавливаем время 00:00 и 23:59
        startDateTime = `${formData.startDate}T00:00:00.000Z`;
        endDateTime = `${formData.endDate}T23:59:59.999Z`;
      } else {
        startDateTime = `${formData.startDate}T${formData.startTime}:00.000Z`;
        endDateTime = `${formData.endDate}T${formData.endTime}:00.000Z`;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        isAllDay: formData.isAllDay,
        location: formData.location.trim() || undefined,
        color: formData.color,
        isRecurring: formData.isRecurring,
        recurrenceRule: formData.isRecurring ? formData.recurrenceRule : undefined,
        participantIds: formData.participantIds.length > 0 ? formData.participantIds : undefined
      };

      await onSubmit(eventData);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения события:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter(id => id !== userId)
        : [...prev.participantIds, userId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Редактировать событие' : 'Новое событие'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Название события */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название события *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Введите название события"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Описание события"
            />
          </div>

          {/* Целый день */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-700">
              Весь день
            </label>
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата начала *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата окончания *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          {/* Время (только если не весь день) */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Время начала *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Время окончания *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>
          )}

          {/* Место проведения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Место проведения
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Укажите место проведения"
            />
          </div>

          {/* Цвет события */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Цвет события
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                  className={`w-8 h-8 rounded-full ${option.color} border-2 ${
                    formData.color === option.value ? 'border-gray-900' : 'border-gray-300'
                  } hover:border-gray-500 transition-colors`}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          {/* Участники */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Участники
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm">Загрузка пользователей...</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.participantIds.includes(user.id)}
                        onChange={() => handleParticipantToggle(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {user.name} {user.surname} ({user.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Повторение */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                <Repeat className="w-4 h-4 inline mr-1" />
                Повторяющееся событие
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Правило повторения
                </label>
                <select
                  value={formData.recurrenceRule}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceRule: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите периодичность</option>
                  <option value="DAILY">Ежедневно</option>
                  <option value="WEEKLY">Еженедельно</option>
                  <option value="MONTHLY">Ежемесячно</option>
                  <option value="YEARLY">Ежегодно</option>
                </select>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : (event ? 'Сохранить изменения' : 'Создать событие')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
