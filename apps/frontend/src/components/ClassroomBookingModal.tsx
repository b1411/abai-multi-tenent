import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendar, FaClock, FaUser, FaPhone, FaBuilding, FaInfoCircle } from 'react-icons/fa';
import { Classroom } from '../types/classroom';
import { CreateClassroomBookingDto, ClassroomBooking, BookingTimeSlot } from '../types/classroomBooking';
import { useToast } from '../hooks/useToast';

interface ClassroomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
}

// Mock данные существующих бронирований для проверки пересечений
const mockBookings: ClassroomBooking[] = [
  {
    id: '1',
    classroomId: 1,
    date: '2025-01-22',
    startTime: '10:00',
    endTime: '12:00',
    purpose: 'Лекция по математике',
    responsiblePerson: 'Иванов И.И.',
    contactInfo: '+7 777 123 4567',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    classroomId: 2,
    date: '2025-01-22',
    startTime: '14:00',
    endTime: '16:00',
    purpose: 'Семинар по физике',
    responsiblePerson: 'Петров П.П.',
    contactInfo: '+7 777 987 6543',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  },
];

const ClassroomBookingModal: React.FC<ClassroomBookingModalProps> = ({
  isOpen,
  onClose,
  classrooms,
}) => {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState<CreateClassroomBookingDto>({
    classroomId: 0,
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    responsiblePerson: '',
    description: '',
    contactInfo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем сохраненные бронирования из localStorage
  const getSavedBookings = (): ClassroomBooking[] => {
    try {
      const saved = localStorage.getItem('classroomBookings');
      return saved ? JSON.parse(saved) : mockBookings;
    } catch {
      return mockBookings;
    }
  };

  // Сохраняем бронирование в localStorage
  const saveBooking = (booking: ClassroomBooking) => {
    try {
      const existing = getSavedBookings();
      const updated = [...existing, booking];
      localStorage.setItem('classroomBookings', JSON.stringify(updated));
    } catch (error) {
      console.error('Ошибка при сохранении бронирования:', error);
    }
  };

  // Сброс формы
  const resetForm = () => {
    setFormData({
      classroomId: 0,
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      responsiblePerson: '',
      description: '',
      contactInfo: '',
    });
    setErrors({});
  };

  // Сброс формы при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Проверка пересечения времени
  const checkTimeConflict = (bookingData: CreateClassroomBookingDto): boolean => {
    const existingBookings = getSavedBookings();
    
    return existingBookings.some(booking => {
      if (booking.classroomId !== bookingData.classroomId || booking.date !== bookingData.date) {
        return false;
      }

      const bookingStart = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const bookingEnd = new Date(`${bookingData.date}T${bookingData.endTime}`);
      const existingStart = new Date(`${booking.date}T${booking.startTime}`);
      const existingEnd = new Date(`${booking.date}T${booking.endTime}`);

      return (
        (bookingStart >= existingStart && bookingStart < existingEnd) ||
        (bookingEnd > existingStart && bookingEnd <= existingEnd) ||
        (bookingStart <= existingStart && bookingEnd >= existingEnd)
      );
    });
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.classroomId) {
      newErrors.classroomId = 'Выберите аудиторию';
    }

    if (!formData.date) {
      newErrors.date = 'Выберите дату';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Нельзя выбрать дату в прошлом';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Выберите время начала';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Выберите время окончания';
    }

    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);
      if (endTime <= startTime) {
        newErrors.endTime = 'Время окончания должно быть больше времени начала';
      }
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Укажите цель бронирования';
    }

    if (!formData.responsiblePerson.trim()) {
      newErrors.responsiblePerson = 'Укажите ответственного';
    }

    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Укажите контактную информацию';
    }

    // Проверка пересечения времени
    if (Object.keys(newErrors).length === 0 && checkTimeConflict(formData)) {
      newErrors.timeConflict = 'На выбранное время аудитория уже забронирована';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Имитируем отправку на сервер
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBooking: ClassroomBooking = {
        id: Date.now().toString(),
        ...formData,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        classroom: classrooms.find(c => c.id === formData.classroomId),
      };
      
      saveBooking(newBooking);
      
      success('Ваше бронирование отправлено');
      onClose();
    } catch (err) {
      showError('Ошибка при отправке бронирования');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработка изменений в форме
  const handleInputChange = (field: keyof CreateClassroomBookingDto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Получение минимальной даты (сегодня)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  const selectedClassroom = classrooms.find(c => c.id === formData.classroomId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Бронирование аудитории
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Заполните форму для бронирования аудитории
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Выбор аудитории */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaBuilding className="inline w-4 h-4 mr-2" />
                Аудитория *
              </label>
              <select
                value={formData.classroomId}
                onChange={(e) => handleInputChange('classroomId', parseInt(e.target.value))}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.classroomId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value={0}>Выберите аудиторию</option>
                {classrooms.map(classroom => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - {classroom.building}, {classroom.floor} этаж ({classroom.capacity} мест)
                  </option>
                ))}
              </select>
              {errors.classroomId && (
                <p className="text-red-600 text-sm mt-1">{errors.classroomId}</p>
              )}
              {selectedClassroom && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedClassroom.name}</strong> - {selectedClassroom.building}, {selectedClassroom.floor} этаж
                  </p>
                  <p className="text-sm text-blue-600">
                    Вместимость: {selectedClassroom.capacity} мест
                  </p>
                  {selectedClassroom.equipment.length > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      Оборудование: {selectedClassroom.equipment.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Дата и время */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendar className="inline w-4 h-4 mr-2" />
                  Дата *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={getMinDate()}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline w-4 h-4 mr-2" />
                  Время начала *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline w-4 h-4 mr-2" />
                  Время окончания *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Ошибка пересечения времени */}
            {errors.timeConflict && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.timeConflict}</p>
              </div>
            )}

            {/* Цель бронирования */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaInfoCircle className="inline w-4 h-4 mr-2" />
                Цель бронирования *
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                placeholder="Например: Лекция по математике, Семинар, Конференция"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.purpose ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.purpose && (
                <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>
              )}
            </div>

            {/* Ответственный и контакты */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline w-4 h-4 mr-2" />
                  Ответственное лицо *
                </label>
                <input
                  type="text"
                  value={formData.responsiblePerson}
                  onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                  placeholder="ФИО ответственного"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.responsiblePerson ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.responsiblePerson && (
                  <p className="text-red-600 text-sm mt-1">{errors.responsiblePerson}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline w-4 h-4 mr-2" />
                  Контактная информация *
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                  placeholder="Телефон или email"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.contactInfo ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.contactInfo && (
                  <p className="text-red-600 text-sm mt-1">{errors.contactInfo}</p>
                )}
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дополнительная информация
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Дополнительные требования, количество участников и т.д."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base min-h-[44px] order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base min-h-[44px] order-1 sm:order-2"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassroomBookingModal;
