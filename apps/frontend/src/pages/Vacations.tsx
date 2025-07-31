import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  Users,
  Plus,
  Filter,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  User,
  CalendarDays,
  BookOpen
} from 'lucide-react';
import { useVacations } from '../hooks/useVacations';
import { useAuth } from '../hooks/useAuth';
import { useTeachers } from '../hooks/useTeachers';
import { useTeacherLessons } from '../hooks/useTeacherLessons';
import { vacationService } from '../services/vacationService';
import {
  Vacation,
  VacationType,
  VacationStatus,
  CreateVacationRequest,
  UpdateVacationStatusRequest,
  VACATION_TYPE_LABELS,
  VACATION_STATUS_LABELS,
  VACATION_STATUS_COLORS
} from '../types/vacation';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

const VacationCard: React.FC<{ 
  vacation: Vacation; 
  currentUserId: number;
  userRole: string;
  onEdit: (vacation: Vacation) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: VacationStatus) => void;
  onViewDetails: (vacation: Vacation) => void;
}> = ({ vacation, currentUserId, userRole, onEdit, onDelete, onStatusChange, onViewDetails }) => {
  const canEdit = vacationService.canEdit(vacation, currentUserId, userRole);
  const canChangeStatus = vacationService.canChangeStatus(userRole);
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {vacation.teacher.user.name} {vacation.teacher.user.surname}
            </h3>
            <p className="text-sm text-gray-600">{vacation.teacher.user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${vacationService.getTypeColor(vacation.type)}`}>
            {VACATION_TYPE_LABELS[vacation.type]}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${VACATION_STATUS_COLORS[vacation.status]}`}>
            {VACATION_STATUS_LABELS[vacation.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {vacationService.formatPeriod(vacation.startDate, vacation.endDate)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{vacation.days} дней</span>
        </div>
      </div>

      {vacation.substitute && (
        <div className="flex items-center space-x-2 mb-4">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Замещение: {vacation.substitute.user.name} {vacation.substitute.user.surname}
          </span>
        </div>
      )}

      {vacation.comment && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {vacation.comment}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(vacation)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Просмотр</span>
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(vacation)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Редактировать</span>
            </button>
          )}
          {canEdit && vacation.status === 'pending' && (
            <button
              onClick={() => onDelete(vacation.id)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить</span>
            </button>
          )}
        </div>

        {canChangeStatus && vacation.status === 'pending' && userRole !== 'TEACHER' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onStatusChange(vacation.id, VacationStatus.approved)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Одобрить</span>
            </button>
            <button
              onClick={() => onStatusChange(vacation.id, VacationStatus.rejected)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Отклонить</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const VacationForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vacation?: Vacation | null;
  onSubmit: (data: CreateVacationRequest) => void;
}> = ({ isOpen, onClose, vacation, onSubmit }) => {
  const { user } = useAuth();
  const { teachers } = useTeachers();
  const [formData, setFormData] = useState<CreateVacationRequest>({
    type: VacationType.vacation,
    startDate: '',
    endDate: '',
    days: 0,
    substituteId: undefined,
    comment: '',
    lectureTopics: '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [affectedSchedule, setAffectedSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Для админов и HR - выбор преподавателя, для которого создается заявка
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>(undefined);

  // Получаем ID преподавателя для текущего пользователя (нужно найти teacher record по userId)
  const [currentTeacherId, setCurrentTeacherId] = useState<number | undefined>(undefined);
  
  // Получаем уроки преподавателя
  const { lessons, loading: lessonsLoading } = useTeacherLessons(currentTeacherId);

  // Проверяем, может ли пользователь создавать заявки от имени других
  const canCreateForOthers = user?.role === 'HR' || user?.role === 'ADMIN';

  // Находим ID преподавателя по userId или используем выбранного
  useEffect(() => {
    if (user?.role === 'TEACHER' && teachers.length > 0) {
      const teacher = teachers.find(t => t.user.id === user.id);
      setCurrentTeacherId(teacher?.id);
    } else if (canCreateForOthers && selectedTeacherId) {
      setCurrentTeacherId(selectedTeacherId);
    }
  }, [user, teachers, selectedTeacherId, canCreateForOthers]);

  useEffect(() => {
    if (vacation) {
      setFormData({
        type: vacation.type,
        startDate: vacation.startDate.split('T')[0],
        endDate: vacation.endDate.split('T')[0],
        days: vacation.days,
        substituteId: vacation.substituteId || undefined,
        comment: vacation.comment || '',
        lectureTopics: vacation.lectureTopics || '',
      });
    }
  }, [vacation]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = vacationService.calculateDays(formData.startDate, formData.endDate);
      setFormData(prev => ({ ...prev, days }));
      
      // Загружаем затронутое расписание
      if (currentTeacherId) {
        loadAffectedSchedule();
      }
    }
  }, [formData.startDate, formData.endDate, currentTeacherId]);

  // Загрузка затронутого расписания
  const loadAffectedSchedule = async () => {
    if (!currentTeacherId || !formData.startDate || !formData.endDate) return;
    
    setScheduleLoading(true);
    try {
      const schedule = await vacationService.getTeacherSchedule(
        currentTeacherId,
        formData.startDate,
        formData.endDate
      );
      setAffectedSchedule(schedule);
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
      setAffectedSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = vacationService.validateDates(formData.startDate, formData.endDate);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Для админов и HR - проверяем что выбран преподаватель
    if (canCreateForOthers && !selectedTeacherId) {
      setErrors(['Необходимо выбрать преподавателя']);
      return;
    }

    setErrors([]);
    onSubmit({
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      lessonIds: selectedLessons.length > 0 ? selectedLessons : undefined,
      teacherId: canCreateForOthers ? selectedTeacherId : undefined, // Передаем ID выбранного преподавателя
    });
  };

  const handleLessonToggle = (lessonId: number) => {
    setSelectedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {vacation ? 'Редактировать отпуск' : 'Новая заявка на отпуск'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.length > 0 && (
            <Alert variant="error" title="Ошибки валидации">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Выбор преподавателя для админов и HR */}
          {canCreateForOthers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Преподаватель</span>
                </div>
              </label>
              <select
                value={selectedTeacherId || ''}
                onChange={(e) => setSelectedTeacherId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите преподавателя</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.name} {teacher.user.surname}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип отпуска
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as VacationType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.values(VacationType).map(type => (
                  <option key={type} value={type}>
                    {VACATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Замещающий преподаватель
              </label>
              <select
                value={formData.substituteId || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  substituteId: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите преподавателя</option>
                {teachers
                  .filter(teacher => teacher.id !== selectedTeacherId) // Исключаем выбранного преподавателя из списка замещающих
                  .map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.name} {teacher.user.surname}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата начала
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество дней
              </label>
              <input
                type="number"
                value={formData.days}
                onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Дополнительная информация..."
            />
          </div>

          {/* Затронутое расписание */}
          {formData.startDate && formData.endDate && currentTeacherId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Затронутое расписание</span>
                </div>
              </label>
              
              {scheduleLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : affectedSchedule.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto border border-amber-200 rounded-lg p-4 bg-amber-50">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800">
                      Найдено {affectedSchedule.length} занятий в выбранном периоде
                    </span>
                  </div>
                  
                  {affectedSchedule.map((item, index) => (
                    <div
                      key={`${item.type}-${item.id}-${index}`}
                      className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {item.type === 'schedule' ? (
                          <Clock className="w-4 h-4 text-amber-600" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-amber-600" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(item.date).toLocaleDateString('ru-RU')}</span>
                              </span>
                              {item.startTime && item.endTime && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{item.startTime} - {item.endTime}</span>
                                </span>
                              )}
                              {item.groups.length > 0 && (
                                <span className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>{item.groups.map((g: any) => g.name).join(', ')}</span>
                                </span>
                              )}
                              {item.classroom && (
                                <span className="flex items-center space-x-1">
                                  <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                                  <span>{item.classroom.name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded">
                        {item.type === 'schedule' ? 'Расписание' : 'Урок'}
                      </div>
                    </div>
                  ))}
                  
                  {formData.substituteId && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Эти занятия требуют замещения выбранным преподавателем
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border border-gray-200 rounded-lg bg-gray-50">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    В выбранном периоде нет запланированных занятий
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {vacation ? 'Сохранить' : 'Создать заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VacationDetailsModal: React.FC<{
  vacation: Vacation | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ vacation, isOpen, onClose }) => {
  const [affectedSchedule, setAffectedSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Загружаем затронутое расписание при открытии модалки
  useEffect(() => {
    if (vacation && isOpen) {
      loadAffectedSchedule();
    }
  }, [vacation, isOpen]);

  const loadAffectedSchedule = async () => {
    if (!vacation) return;
    
    setScheduleLoading(true);
    try {
      const schedule = await vacationService.getTeacherSchedule(
        vacation.teacherId,
        vacation.startDate.split('T')[0],
        vacation.endDate.split('T')[0]
      );
      setAffectedSchedule(schedule);
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
      setAffectedSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  if (!isOpen || !vacation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Подробности заявки на отпуск
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о сотруднике</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{vacation.teacher.user.name} {vacation.teacher.user.surname}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Email: {vacation.teacher.user.email}
                  </div>
                  {vacation.teacher.user.phone && (
                    <div className="text-sm text-gray-600">
                      Телефон: {vacation.teacher.user.phone}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Детали отпуска</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Тип:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${vacationService.getTypeColor(vacation.type)}`}>
                      {VACATION_TYPE_LABELS[vacation.type]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Статус:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${VACATION_STATUS_COLORS[vacation.status]}`}>
                      {VACATION_STATUS_LABELS[vacation.status]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Период:</span>
                    <span className="font-medium">
                      {vacationService.formatPeriod(vacation.startDate, vacation.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Количество дней:</span>
                    <span className="font-medium">{vacation.days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дата создания:</span>
                    <span className="text-sm">{new Date(vacation.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {vacation.substitute && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Замещающий преподаватель</h3>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{vacation.substitute.user.name} {vacation.substitute.user.surname}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Email: {vacation.substitute.user.email}
                    </div>
                  </div>
                </div>
              )}

              {vacation.comment && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Комментарий</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{vacation.comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Затронутое расписание */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Затронутое расписание</h3>
            
            {scheduleLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : affectedSchedule.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium text-amber-800">
                    Найдено {affectedSchedule.length} занятий в периоде отпуска
                  </span>
                </div>
                
                {affectedSchedule.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {item.type === 'schedule' ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-amber-600" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(item.date).toLocaleDateString('ru-RU')}</span>
                            </span>
                            {item.startTime && item.endTime && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.startTime} - {item.endTime}</span>
                              </span>
                            )}
                            {item.groups.length > 0 && (
                              <span className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{item.groups.map((g: any) => g.name).join(', ')}</span>
                              </span>
                            )}
                            {item.classroom && (
                              <span className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                                <span>{item.classroom.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded">
                      {item.type === 'schedule' ? 'Расписание' : 'Урок'}
                    </div>
                  </div>
                ))}
                
                {vacation.substitute && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Эти занятия замещает: {vacation.substitute.user.name} {vacation.substitute.user.surname}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-gray-200 rounded-lg bg-gray-50">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  В периоде отпуска нет запланированных занятий
                </p>
              </div>
            )}
          </div>

          {/* Затронутые уроки */}
          {vacation.affectedLessons && vacation.affectedLessons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Дополнительные уроки для замещения</h3>
              <div className="space-y-2">
                {vacation.affectedLessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lesson.name}</p>
                        <div className="text-xs text-gray-600 flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(lesson.date).toLocaleDateString('ru-RU')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{lesson.studyPlan.name}</span>
                          </span>
                          {lesson.group && (
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{lesson.group.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      Требует замещения
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Документы */}
          {vacation.documents && vacation.documents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Прикрепленные документы</h3>
              <div className="space-y-2">
                {vacation.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file.originalName}</p>
                        <p className="text-xs text-gray-600">
                          {doc.type} • {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Скачать
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Vacations: React.FC = () => {
  const { user } = useAuth();
  const {
    vacations,
    summary,
    total,
    loading,
    error,
    createVacation,
    updateVacation,
    updateVacationStatus,
    deleteVacation,
    loadVacations
  } = useVacations();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VacationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<VacationType | ''>('');
  const [viewingVacation, setViewingVacation] = useState<Vacation | null>(null);

  const handleCreateVacation = async (data: CreateVacationRequest) => {
    try {
      if (editingVacation) {
        await updateVacation(editingVacation.id, data);
      } else {
        await createVacation(data);
      }
      setIsFormOpen(false);
      setEditingVacation(null);
    } catch (error) {
      console.error('Ошибка при сохранении отпуска:', error);
    }
  };

  const handleEditVacation = (vacation: Vacation) => {
    setEditingVacation(vacation);
    setIsFormOpen(true);
  };

  const handleDeleteVacation = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
      try {
        await deleteVacation(id);
      } catch (error) {
        console.error('Ошибка при удалении отпуска:', error);
      }
    }
  };

  const handleStatusChange = async (id: number, status: VacationStatus) => {
    try {
      const statusUpdate: UpdateVacationStatusRequest = {
        status,
        notifyEmployee: true
      };
      await updateVacationStatus(id, statusUpdate);
    } catch (error) {
      console.error('Ошибка при изменении статуса:', error);
    }
  };

  const handleSearch = () => {
    loadVacations({
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined
    });
  };

  const handleViewDetails = (vacation: Vacation) => {
    console.log('Viewing vacation details:', vacation);
    console.log('Affected lessons:', vacation.affectedLessons);
    setViewingVacation(vacation);
  };

  const filteredVacations = vacations.filter(vacation => {
    if (searchTerm && !vacation.teacher.user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !vacation.teacher.user.surname.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && vacation.status !== statusFilter) {
      return false;
    }
    if (typeFilter && vacation.type !== typeFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'TEACHER' ? 'Мои отпуска' : 'Управление отпусками'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'TEACHER' 
              ? 'Ваши заявки на отпуск и больничные листы'
              : 'Заявки на отпуск и больничные листы'
            }
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVacation(null);
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Новая заявка</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Сейчас в отпуске</p>
                <p className="text-2xl font-bold text-gray-900">{summary.currentMonth.onVacation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">На больничном</p>
                <p className="text-2xl font-bold text-gray-900">{summary.currentMonth.onSickLeave}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Запланировано</p>
                <p className="text-2xl font-bold text-gray-900">{summary.currentMonth.planned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего заявок</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск по имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VacationStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все статусы</option>
            {Object.values(VacationStatus).map(status => (
              <option key={status} value={status}>
                {VACATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as VacationType | '')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все типы</option>
            {Object.values(VacationType).map(type => (
              <option key={type} value={type}>
                {VACATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Применить</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      )}

      {/* Vacations List */}
      <div className="space-y-4">
        {filteredVacations.length > 0 ? (
          filteredVacations.map(vacation => (
            <VacationCard
              key={vacation.id}
              vacation={vacation}
              currentUserId={user?.id || 0}
              userRole={user?.role || ''}
              onEdit={handleEditVacation}
              onDelete={handleDeleteVacation}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Заявки не найдены</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || typeFilter
                ? 'Попробуйте изменить параметры поиска'
                : 'Создайте первую заявку на отпуск'
              }
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <VacationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVacation(null);
        }}
        vacation={editingVacation}
        onSubmit={handleCreateVacation}
      />

      {/* Details Modal */}
      <VacationDetailsModal
        vacation={viewingVacation}
        isOpen={!!viewingVacation}
        onClose={() => setViewingVacation(null)}
      />
    </div>
  );
};

export default Vacations;
