import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTimes, FaCalendar, FaClock, FaUser, FaPhone, FaBuilding, FaInfoCircle } from 'react-icons/fa';
import { Classroom } from '../types/classroom';
import { CreateClassroomBookingDto, ClassroomBooking } from '../types/classroomBooking';
import { useToast } from '../hooks/useToast';
import ClassroomService from '../services/classroomService';

interface ClassroomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  classroomId?: number; // фиксированная аудитория (для модалки деталей)
  onCreated?: (booking: ClassroomBooking) => void;
}

const statusLabels: Record<ClassroomBooking['status'], string> = {
  PENDING: 'Ожидает',
  APPROVED: 'Подтверждено',
  REJECTED: 'Отклонено',
  CANCELLED: 'Отменено'
};

const statusColors: Record<ClassroomBooking['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700'
};

const ClassroomBookingModal: React.FC<ClassroomBookingModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  classroomId,
  onCreated
}) => {
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<CreateClassroomBookingDto>({
    classroomId: classroomId || 0,
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

  // bookings state
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const hideClassroomSelect = !!classroomId;

  // Reset form when closing
  const resetForm = () => {
    setFormData({
      classroomId: classroomId || 0,
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      responsiblePerson: '',
      description: '',
      contactInfo: '',
    });
    setErrors({});
    setBookings([]);
    setBookingsError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else if (classroomId) {
      setFormData(prev => ({ ...prev, classroomId }));
    }
  }, [isOpen, classroomId]);

  // Fetch bookings for selected classroom (and date if chosen)
  const fetchBookings = useCallback(async () => {
    if (!isOpen) return;
    if (!formData.classroomId) {
      setBookings([]);
      return;
    }
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const data = await ClassroomService.listBookings(formData.classroomId, formData.date || undefined);
      // Сортировка по времени
      const sorted = [...data].sort((a, b) => {
        if (a.date === b.date) {
          return a.startTime.localeCompare(b.startTime);
        }
        return a.date.localeCompare(b.date);
      });
      setBookings(sorted);
    } catch (e: any) {
      setBookingsError('Не удалось загрузить бронирования');
    } finally {
      setLoadingBookings(false);
    }
  }, [isOpen, formData.classroomId, formData.date]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Time conflict check (client-side pre-validation)
  const hasTimeConflict = useCallback((data: CreateClassroomBookingDto): boolean => {
    if (!data.date || !data.startTime || !data.endTime) return false;
    return bookings.some(b => {
      if (b.classroomId !== data.classroomId) return false;
      if (b.date !== data.date) return false;
      // Only consider bookings that are not rejected/cancelled
      if (['REJECTED', 'CANCELLED'].includes(b.status)) return false;

      const start = data.startTime;
      const end = data.endTime;
      const existingStart = b.startTime;
      const existingEnd = b.endTime;

      // Overlap if:
      // start < existingEnd AND end > existingStart
      return start < existingEnd && end > existingStart;
    });
  }, [bookings]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.classroomId) newErrors.classroomId = 'Выберите аудиторию';
    if (!formData.date) {
      newErrors.date = 'Выберите дату';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) newErrors.date = 'Нельзя выбрать дату в прошлом';
    }
    if (!formData.startTime) newErrors.startTime = 'Выберите время начала';
    if (!formData.endTime) newErrors.endTime = 'Выберите время окончания';

    if (formData.startTime && formData.endTime) {
      if (formData.endTime <= formData.startTime) {
        newErrors.endTime = 'Время окончания должно быть больше начала';
      }
    }

    if (!formData.purpose.trim()) newErrors.purpose = 'Укажите цель';
    if (!formData.responsiblePerson.trim()) newErrors.responsiblePerson = 'Укажите ответственного';
    if (!formData.contactInfo.trim()) newErrors.contactInfo = 'Укажите контакты';

    if (Object.keys(newErrors).length === 0 && hasTimeConflict(formData)) {
      newErrors.timeConflict = 'На выбранное время аудитория уже забронирована';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateClassroomBookingDto, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'classroomId') {
      // Clear bookings to fetch new
      setBookings([]);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { classroomId: cId, ...rest } = formData;
      const booking = await ClassroomService.createBooking(cId, rest);
      success('Заявка отправлена');
      onCreated?.(booking);
      onClose();
    } catch (e: any) {
      showError(e?.message || 'Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClassroom = useMemo(
    () => classrooms.find(c => c.id === formData.classroomId),
    [classrooms, formData.classroomId]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Бронирование аудитории</h2>
            <p className="text-sm text-gray-600 mt-1">Заполните форму для бронирования</p>
          </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes className="w-5 h-5" />
            </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Аудитория */}
            {!hideClassroomSelect && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaBuilding className="inline w-4 h-4 mr-2" />Аудитория *
                </label>
                <select
                  value={formData.classroomId}
                  onChange={(e) => handleInputChange('classroomId', parseInt(e.target.value))}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.classroomId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Выберите аудиторию</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.building}, {c.floor} этаж ({c.capacity} мест)
                    </option>
                  ))}
                </select>
                {errors.classroomId && <p className="text-red-600 text-sm mt-1">{errors.classroomId}</p>}
              </div>
            )}

            {selectedClassroom && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedClassroom.name}</strong> - {selectedClassroom.building}, {selectedClassroom.floor} этаж
                </p>
                <p className="text-sm text-blue-600">Вместимость: {selectedClassroom.capacity} мест</p>
                {selectedClassroom.equipment.length > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    Оборудование: {selectedClassroom.equipment.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Дата и время */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendar className="inline w-4 h-4 mr-2" />Дата *
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
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline w-4 h-4 mr-2" />Время начала *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline w-4 h-4 mr-2" />Время окончания *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {errors.timeConflict && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.timeConflict}</p>
              </div>
            )}

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaInfoCircle className="inline w-4 h-4 mr-2" />Цель *
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                placeholder="Лекция, Семинар, Конференция..."
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.purpose ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.purpose && <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>}
            </div>

            {/* Responsible + Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline w-4 h-4 mr-2" />Ответственный *
                </label>
                <input
                  type="text"
                  value={formData.responsiblePerson}
                  onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                  placeholder="ФИО"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.responsiblePerson ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.responsiblePerson && <p className="text-red-600 text-sm mt-1">{errors.responsiblePerson}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline w-4 h-4 mr-2" />Контакты *
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
                {errors.contactInfo && <p className="text-red-600 text-sm mt-1">{errors.contactInfo}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительная информация</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="Дополнительные требования, количество участников и т.д."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
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

          {/* Existing bookings (for selected classroom/date) */}
          {formData.classroomId && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                Существующие бронирования{formData.date && ` на ${formData.date}`}
              </h3>
              {bookingsError && (
                <div className="text-sm text-red-600">{bookingsError}</div>
              )}
              {loadingBookings ? (
                <div className="text-sm text-gray-500">Загрузка...</div>
              ) : bookings.length === 0 ? (
                <div className="text-sm text-gray-500">Нет бронирований</div>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-auto pr-1">
                  {bookings.map(b => (
                    <li key={b.id} className="border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{b.date} {b.startTime}-{b.endTime}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusColors[b.status]}`}>
                          {statusLabels[b.status]}
                        </span>
                      </div>
                      <div className="text-gray-700 truncate">{b.purpose}</div>
                      <div className="text-gray-500 truncate">{b.responsiblePerson}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomBookingModal;
