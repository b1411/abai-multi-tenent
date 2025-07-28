import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter as FilterIcon,
  Plus,
  X,
  Calendar,
  Table,
  FileSpreadsheet,
  Bot,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { PermissionGuard } from '../components/PermissionGuard';
import { Button, Loading, Modal, Autocomplete, TimePicker } from '../components/ui';
import AILessonGeneratorModal from '../components/AILessonGeneratorModal';
import lessonScheduleService, { AILessonsResponse, AvailableLesson } from '../services/lessonScheduleService';

// import WeekGrid from '../components/WeekGrid';
import scheduleService, { ScheduleService } from '../services/scheduleService';
import {
  ScheduleItem,
  Schedule,
  CreateScheduleDto,
  GroupOption,
  TeacherOption,
  StudyPlanOption,
  ClassroomOption,
  ScheduleFilters
} from '../types/schedule';
import * as XLSX from 'xlsx';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleItem: Partial<ScheduleItem>, id?: string) => void;
  initialData?: Partial<ScheduleItem>;
  isEdit?: boolean;
}

interface ScheduleModalInternalProps extends ScheduleModalProps {
  groups: GroupOption[];
  teachers: TeacherOption[];
  studyPlans: StudyPlanOption[];
  classrooms: ClassroomOption[];
}

const ScheduleModal: React.FC<ScheduleModalInternalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  isEdit = false,
  groups,
  teachers,
  studyPlans,
  classrooms
}) => {
  const [selectedLesson, setSelectedLesson] = useState<AvailableLesson | null>(null);
  const [availableLessons, setAvailableLessons] = useState<AvailableLesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<ScheduleItem>>({
    id: initialData?.id || '',
    day: (initialData?.day || '') as ScheduleItem['day'],
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    classId: initialData?.classId || '',
    subject: initialData?.subject || '',
    teacherId: initialData?.teacherId || '',
    teacherName: initialData?.teacherName || '',
    roomId: initialData?.roomId || '',
    type: (initialData?.type || 'lesson') as ScheduleItem['type'],
    repeat: (initialData?.repeat || 'weekly') as ScheduleItem['repeat'],
    status: (initialData?.status || 'upcoming') as ScheduleItem['status']
  });

  const lessonSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Обновляем данные формы при изменении initialData (для режима редактирования)
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        day: (initialData.day || '') as ScheduleItem['day'],
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        classId: initialData.classId || '',
        subject: initialData.subject || '',
        teacherId: initialData.teacherId || '',
        teacherName: initialData.teacherName || '',
        roomId: initialData.roomId || '',
        type: (initialData.type || 'lesson') as ScheduleItem['type'],
        repeat: (initialData.repeat || 'weekly') as ScheduleItem['repeat'],
        status: (initialData.status || 'upcoming') as ScheduleItem['status']
      });
    }
  }, [initialData]);

  // Загружаем доступные уроки при открытии модального окна
  useEffect(() => {
    if (isOpen && !isEdit) {
      loadAvailableLessons();
    }
  }, [isOpen, isEdit]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (lessonSearchTimeoutRef.current) {
        clearTimeout(lessonSearchTimeoutRef.current);
      }
    };
  }, []);

  const loadAvailableLessons = async (search?: string) => {
    try {
      setIsLoadingLessons(true);
      const lessons = await lessonScheduleService.getAvailableLessons({
        search,
        groupIds: groups.map(g => g.id),
        teacherIds: teachers.map(t => t.id),
        subjectIds: studyPlans.map(sp => sp.id)
      });
      setAvailableLessons(lessons);
    } catch (error) {
      console.error('Ошибка при загрузке уроков:', error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleLessonSearch = (query: string) => {
    setSearchQuery(query);
    
    if (lessonSearchTimeoutRef.current) {
      clearTimeout(lessonSearchTimeoutRef.current);
    }

    lessonSearchTimeoutRef.current = setTimeout(() => {
      loadAvailableLessons(query);
    }, 300);
  };

  const handleLessonSelect = (lesson: AvailableLesson) => {
    setSelectedLesson(lesson);
    
    // Определяем день недели из даты урока
    let dayOfWeek = '';
    if (lesson.scheduledDate) {
      const lessonDate = new Date(lesson.scheduledDate);
      const dayNumber = lessonDate.getDay(); // 0 = Sunday, 1 = Monday, ...
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      dayOfWeek = dayMap[dayNumber];
    }
    
    // Автоматически заполняем форму данными из урока
    setFormData(prev => ({
      ...prev,
      subject: lesson.studyPlanName,
      teacherId: lesson.teacherId.toString(),
      teacherName: lesson.teacherName,
      classId: lesson.groupName,
      day: dayOfWeek as ScheduleItem['day'] || prev.day,
      endTime: prev.startTime ? getEndTimeFromLesson(prev.startTime, lesson.estimatedDuration) : ''
    }));
  };

  const getEndTimeFromLesson = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, isEdit ? formData.id : undefined);
    onClose();
  };

  if (!isOpen) return null;

  // Для режима редактирования показываем старую форму
  if (isEdit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-[500px]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Редактировать занятие</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  День недели
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value as ScheduleItem['day'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Выберите день</option>
                  <option value="monday">Понедельник</option>
                  <option value="tuesday">Вторник</option>
                  <option value="wednesday">Среда</option>
                  <option value="thursday">Четверг</option>
                  <option value="friday">Пятница</option>
                </select>
              </div>
              <div>
                <TimePicker
                  label="Время начала"
                  value={formData.startTime || ''}
                  onChange={(time) => setFormData({ ...formData, startTime: time })}
                  placeholder="Выберите время начала"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Аудитория
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите аудиторию</option>
                {classrooms.map(classroom => (
                  <option key={classroom.id} value={classroom.name}>
                    {classroom.name} ({classroom.building})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Добавить занятие в расписание</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор урока */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите урок из календарно-тематического планирования
            </label>
            
            {/* Поиск уроков */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Поиск урока по названию, предмету или преподавателю..."
                value={searchQuery}
                onChange={(e) => handleLessonSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Список доступных уроков */}
            <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
              {isLoadingLessons ? (
                <div className="p-4 text-center text-gray-500">
                  <Loading text="Загрузка уроков..." />
                </div>
              ) : availableLessons.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Нет доступных уроков для планирования
                </div>
              ) : (
                availableLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedLesson?.id === lesson.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{lesson.name}</div>
                        <div className="text-sm text-gray-600">
                          {lesson.studyPlanName} • {lesson.groupName} • {lesson.teacherName}
                        </div>
                        {lesson.description && (
                          <div className="text-xs text-gray-500 mt-1">{lesson.description}</div>
                        )}
                      </div>
                      <div className="ml-3 text-right">
                        <div className="text-xs text-gray-500">
                          {lesson.estimatedDuration} мин
                        </div>
                        {lesson.difficulty && (
                          <div className="text-xs mt-1">
                            {lessonScheduleService.getDifficultyIcon(lesson.difficulty)}
                          </div>
                        )}
                        {lesson.isCompleted && (
                          <div className="text-xs text-green-600 mt-1">✓ Завершен</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Информация о выбранном уроке */}
          {selectedLesson && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="font-medium text-blue-900 mb-2">Выбранный урок:</h4>
              <div className="text-sm text-blue-800">
                <div><strong>Название:</strong> {selectedLesson.name}</div>
                <div><strong>Предмет:</strong> {selectedLesson.studyPlanName}</div>
                <div><strong>Группа:</strong> {selectedLesson.groupName}</div>
                <div><strong>Преподаватель:</strong> {selectedLesson.teacherName}</div>
                {selectedLesson.scheduledDate && (
                  <div><strong>Запланированная дата:</strong> {new Date(selectedLesson.scheduledDate).toLocaleDateString('ru-RU')}</div>
                )}
                <div><strong>Длительность:</strong> {selectedLesson.estimatedDuration} минут</div>
                {selectedLesson.homework && (
                  <div><strong>Домашнее задание:</strong> {selectedLesson.homework.name}</div>
                )}
              </div>
            </div>
          )}

          {/* Планирование времени */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                День недели {selectedLesson?.scheduledDate && <span className="text-xs text-gray-500">(из даты урока)</span>}
              </label>
              <select
                value={formData.day}
                onChange={(e) => {
                  const newDay = e.target.value as ScheduleItem['day'];
                  setFormData({ 
                    ...formData, 
                    day: newDay,
                    endTime: formData.startTime && selectedLesson ? 
                      getEndTimeFromLesson(formData.startTime, selectedLesson.estimatedDuration) : 
                      formData.endTime
                  });
                }}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedLesson?.scheduledDate ? 'bg-gray-50 text-gray-600' : ''
                }`}
                disabled={!!selectedLesson?.scheduledDate}
                required
              >
                <option value="">Выберите день</option>
                <option value="monday">Понедельник</option>
                <option value="tuesday">Вторник</option>
                <option value="wednesday">Среда</option>
                <option value="thursday">Четверг</option>
                <option value="friday">Пятница</option>
              </select>
            </div>
            <div>
              <TimePicker
                label="Время начала"
                value={formData.startTime || ''}
                onChange={(time: string) => {
                  setFormData({ 
                    ...formData, 
                    startTime: time,
                    endTime: selectedLesson ? 
                      getEndTimeFromLesson(time, selectedLesson.estimatedDuration) : 
                      ''
                  });
                }}
                placeholder="Выберите время начала"
                required
              />
            </div>
          </div>

          {/* Время окончания (автоматически рассчитывается) */}
          {formData.endTime && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время окончания
              </label>
              <input
                type="text"
                value={formData.endTime}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
          )}

          {/* Выбор аудитории */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Аудитория
            </label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Выберите аудиторию</option>
              {classrooms.map(classroom => (
                <option key={classroom.id} value={classroom.name}>
                  {classroom.name} ({classroom.building})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!selectedLesson || !formData.day || !formData.startTime || !formData.roomId}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Запланировать урок
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const SchedulePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomFilter = searchParams.get('room');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [filters, setFilters] = useState({
    day: '',
    groupId: '',
    studyPlanId: '',
    teacherId: '',
    classroomId: roomFilter || ''
  });
  // Пагинация
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<ScheduleItem> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILessonModalOpen, setIsAILessonModalOpen] = useState(false);

  // Состояние для данных фильтров
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlanOption[]>([]);
  const [isLoadingStudyPlans, setIsLoadingStudyPlans] = useState<boolean>(false);

  // Реф для дебаунса поиска учебных планов
  const studyPlanSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (studyPlanSearchTimeoutRef.current) {
        clearTimeout(studyPlanSearchTimeoutRef.current);
      }
    };
  }, []);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);

  const { user, hasPermission } = useAuth();
  const role = user?.role;

  // Загрузка фильтров из URL при первом рендере
  useEffect(() => {
    if (roomFilter) {
      setFilters(prev => ({
        ...prev,
        classroomId: roomFilter
      }));
    }

    // Загрузка других параметров из URL
    const day = searchParams.get('day');
    const groupId = searchParams.get('group');
    const teacherId = searchParams.get('teacher');
    const studyPlanId = searchParams.get('studyPlan');

    // Логируем для отладки
    if (studyPlanId) {
      console.log('Загружен ID учебного плана из URL:', studyPlanId);
    }

    setFilters(prev => ({
      ...prev,
      day: day || prev.day,
      groupId: groupId || prev.groupId,
      teacherId: teacherId || prev.teacherId,
      studyPlanId: studyPlanId || prev.studyPlanId
    }));
  }, [roomFilter, searchParams]);

  // Обновление URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.day) params.set('day', filters.day);
    if (filters.groupId) params.set('group', filters.groupId);
    if (filters.teacherId) params.set('teacher', filters.teacherId);
    if (filters.classroomId) params.set('room', filters.classroomId);
    if (filters.studyPlanId) params.set('studyPlan', filters.studyPlanId);

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Определяем, какие фильтры доступны для данной роли
  const getAvailableFilters = () => {
    const availableFilters = {
      day: true,        // День недели доступен всем
      studyPlan: true,  // Учебный план доступен всем
      group: false,     // По умолчанию выключено
      teacher: false,   // По умолчанию выключено
      classroom: false  // По умолчанию выключено
    };

    switch (role) {
      case 'ADMIN':
        // Администратор видит все фильтры
        availableFilters.group = true;
        availableFilters.teacher = true;
        availableFilters.classroom = true;
        break;

      case 'TEACHER':
        // Преподаватель видит фильтры по группам и кабинетам
        availableFilters.group = true;
        availableFilters.classroom = true;
        break;

      case 'STUDENT':
        // Студенту доступна фильтрация по преподавателям
        availableFilters.teacher = true;
        break;

      case 'PARENT':
        // Родителю доступна фильтрация по преподавателям
        availableFilters.teacher = true;
        break;
    }

    return availableFilters;
  };

  const availableFilters = getAvailableFilters();

  useEffect(() => {
    // Загрузка данных с API и фильтров
    loadScheduleData();
    loadFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сбрасываем страницу при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Перезагружаем расписание при изменении фильтров или страницы
  useEffect(() => {
    console.log('Изменились фильтры или страница, обновляем данные. Учебный план:', filters.studyPlanId);
    loadScheduleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSize]);

  // Загрузка данных для фильтров
  const loadFilterData = async () => {
    try {
      // Если в URL или фильтрах есть ID учебного плана, нужно загрузить информацию о нем
      const studyPlanId = searchParams.get('studyPlan') || filters.studyPlanId;

      const [groupsData, teachersData, studyPlansData, classroomsData] = await Promise.all([
        scheduleService.getGroups(),
        scheduleService.getTeachers(),
        scheduleService.getStudyPlans(),
        scheduleService.getClassrooms()
      ]);

      // Если у нас есть ID учебного плана, но нет его в списке, нужно его загрузить
      if (studyPlanId && !studyPlansData.some(plan => plan.id.toString() === studyPlanId)) {
        console.log('Загрузка детальной информации об учебном плане:', studyPlanId);
        try {
          // Тут нужно будет добавить метод для загрузки одного учебного плана по ID
          const studyPlanDetail = await scheduleService.getStudyPlanById(parseInt(studyPlanId));
          if (studyPlanDetail) {
            // Добавляем найденный учебный план к существующим
            studyPlansData.push(studyPlanDetail);
          }
        } catch (error) {
          console.error('Ошибка при загрузке детальной информации об учебном плане:', error);
        }
      }

      setGroups(groupsData);
      setTeachers(teachersData);
      setStudyPlans(studyPlansData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error('Ошибка загрузки данных фильтров:', error);
    }
  };

  const loadScheduleData = async () => {
    try {
      setIsLoading(true);

      const requestFilters = {
        ...(filters.groupId && { groupId: parseInt(filters.groupId) }),
        ...(filters.teacherId && { teacherId: parseInt(filters.teacherId) }),
        ...(filters.classroomId && { classroomId: parseInt(filters.classroomId) }),
        ...(filters.studyPlanId && { studyPlanId: parseInt(filters.studyPlanId) }),
        ...(filters.day && { dayOfWeek: getDayNumber(filters.day) }),
        page,
        pageSize
      };

      // Логирование для отладки
      console.log('Запрос расписания с фильтрами:', requestFilters);
      console.log('Текущий фильтр учебного плана:', filters.studyPlanId);

      // Получаем расписание с учетом роли пользователя
      const response = await scheduleService.getScheduleForUser(
        user?.role || 'STUDENT',
        user?.id,
        requestFilters
      );
      // Если backend возвращает total, используем его, иначе считаем вручную
      if (Array.isArray(response)) {
        setSchedule(response.slice(0, pageSize));
        setTotal(response.length);
      } else {
        setSchedule(response.items || []);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      setSchedule([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Вспомогательная функция для конвертации дня недели в число
  const getDayNumber = (day: string): number => {
    const dayMap: { [key: string]: number } = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    return dayMap[day] || 1;
  };

  // Функция проверки конфликтов расписания
  const checkScheduleConflicts = (newItem: CreateScheduleDto, existingSchedule: ScheduleItem[]): string[] => {
    const conflicts: string[] = [];
    
    // Конвертируем номер дня обратно в строку для сравнения
    const dayName = Object.entries({
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    }).find(([_, num]) => num === newItem.dayOfWeek)?.[0] as ScheduleItem['day'];

    // Функция для проверки пересечения времени
    const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
      const time1Start = new Date(`2000-01-01T${start1}:00`);
      const time1End = new Date(`2000-01-01T${end1}:00`);
      const time2Start = new Date(`2000-01-01T${start2}:00`);
      const time2End = new Date(`2000-01-01T${end2}:00`);

      return (time1Start < time2End && time1End > time2Start);
    };

    for (const existingItem of existingSchedule) {
      // Проверяем только занятия в тот же день
      if (existingItem.day !== dayName) continue;

      const newEndTime = newItem.endTime || getEndTime(newItem.startTime);
      const existingEndTime = existingItem.endTime || getEndTime(existingItem.startTime);

      // Проверяем пересечение времени
      if (timesOverlap(newItem.startTime, newEndTime, existingItem.startTime, existingEndTime)) {
        
        // Конфликт преподавателя
        if (newItem.teacherId.toString() === existingItem.teacherId) {
          conflicts.push(`Преподаватель занят в это время (${existingItem.startTime}-${existingEndTime})`);
        }

        // Конфликт аудитории
        if (newItem.classroomId && existingItem.roomId && 
            newItem.classroomId.toString() === existingItem.roomId) {
          conflicts.push(`Аудитория ${existingItem.roomId} занята в это время (${existingItem.startTime}-${existingEndTime})`);
        }

        // Конфликт группы
        if (newItem.groupId.toString() === existingItem.classId) {
          conflicts.push(`Группа ${existingItem.classId} уже имеет занятие в это время (${existingItem.startTime}-${existingEndTime})`);
        }
      }
    }

    return conflicts;
  };

  // Функция фильтрации расписания в зависимости от роли
  // Теперь фильтрация происходит на сервере, здесь просто возвращаем schedule
  const getFilteredSchedule = () => schedule;
  // Обработчик смены страницы
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Обработчик смены размера страницы
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  // Функция проверки прав на редактирование
  const canEditSchedule = () => {
    return hasPermission('schedule', 'update');
  };

  const handleAddClick = (day?: ScheduleItem['day'], time?: string) => {
    setSelectedItem(day && time ? { day, startTime: time } : {});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: ScheduleItem) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Вы действительно хотите удалить это занятие?')) {
      try {
        // Вызываем API для удаления
        await scheduleService.remove(id);
        
        // Обновляем локальное состояние после успешного удаления
        setSchedule(prev => prev.filter(item => item.id !== id));
        
        // Обновляем общее количество
        setTotal(prev => prev - 1);
      } catch (error) {
        console.error('Ошибка при удалении занятия:', error);
        alert('Ошибка при удалении занятия. Попробуйте еще раз.');
      }
    }
  };

  const handleScheduleSave = async (scheduleItem: Partial<ScheduleItem>, id?: string) => {
    try {
      if (id) {
        // Редактирование существующего занятия
        // Пока оставляем локальное обновление, так как нужны дополнительные данные для конвертации
        const updatedSchedule = schedule.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...scheduleItem,
              // Обновляем имя преподавателя на основе загруженных данных
              teacherName: teachers.find(t => t.id.toString() === scheduleItem.teacherId)?.name + ' ' + 
                          teachers.find(t => t.id.toString() === scheduleItem.teacherId)?.surname || 
                          scheduleItem.teacherName || item.teacherName,
            };
          }
          return item;
        });

        setSchedule(updatedSchedule);

        // TODO: Реализовать вызов API для обновления
        // const updateDto = ScheduleService.convertToUpdateDto(scheduleItem);
        // await scheduleService.update(id, updateDto);
      } else {
        // Создание нового занятия
        // Нужно найти реальные ID для создания через API
        const selectedGroup = groups.find(g => g.name === scheduleItem.classId);
        const selectedTeacher = teachers.find(t => t.id.toString() === scheduleItem.teacherId);
        const selectedClassroom = classrooms.find(c => c.name === scheduleItem.roomId);
        const selectedStudyPlan = studyPlans.find(sp => sp.name === scheduleItem.subject);

        if (!selectedGroup || !selectedTeacher || !selectedStudyPlan) {
          throw new Error('Не удалось найти необходимые данные для создания занятия');
        }

        // Создаем DTO для API
        const createDto: CreateScheduleDto = {
          studyPlanId: selectedStudyPlan.id,
          groupId: selectedGroup.id,
          teacherId: selectedTeacher.id,
          classroomId: selectedClassroom?.id,
          dayOfWeek: getDayNumber(scheduleItem.day!),
          startTime: scheduleItem.startTime!,
          endTime: scheduleItem.endTime || getEndTime(scheduleItem.startTime!)
        };

        // Вызываем API для создания
        const createdSchedule = await scheduleService.create(createDto);
        
        // Конвертируем ответ API в формат для отображения
        const newScheduleItem = ScheduleService.convertToScheduleItem(createdSchedule);
        
        // Добавляем к существующему расписанию
        setSchedule(prev => [...prev, newScheduleItem]);
        setTotal(prev => prev + 1);
      }
    } catch (error) {
      console.error('Ошибка при сохранении расписания:', error);
      alert('Ошибка при сохранении занятия: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  // Вспомогательная функция для вычисления времени окончания
  const getEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1; // Занятие длится 1 час по умолчанию
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedSchedule: ScheduleItem[] = jsonData.map((row: unknown) => {
          const rowData = row as Record<string, unknown>;
          const dayMapping: Record<string, ScheduleItem['day']> = {
            'понедельник': 'monday',
            'вторник': 'tuesday',
            'среда': 'wednesday',
            'четверг': 'thursday',
            'пятница': 'friday',
            'суббота': 'saturday',
            'воскресенье': 'sunday',
            'monday': 'monday',
            'tuesday': 'tuesday',
            'wednesday': 'wednesday',
            'thursday': 'thursday',
            'friday': 'friday',
            'saturday': 'saturday',
            'sunday': 'sunday'
          };

          const day = typeof rowData['День недели'] === 'string'
            ? dayMapping[rowData['День недели'].toLowerCase()] || 'monday'
            : 'monday';

          const typeMapping: Record<string, ScheduleItem['type']> = {
            'урок': 'lesson',
            'консультация': 'consultation',
            'дополнительно': 'extra',
            'lesson': 'lesson',
            'consultation': 'consultation',
            'extra': 'extra'
          };

          const type = typeof rowData['Тип занятия'] === 'string'
            ? typeMapping[rowData['Тип занятия'].toLowerCase()] || 'lesson'
            : 'lesson';

          const repeatMapping: Record<string, ScheduleItem['repeat']> = {
            'еженедельно': 'weekly',
            'раз в две недели': 'biweekly',
            'один раз': 'once',
            'weekly': 'weekly',
            'biweekly': 'biweekly',
            'once': 'once'
          };

          const repeat = typeof rowData['Повторение'] === 'string'
            ? repeatMapping[rowData['Повторение'].toLowerCase()] || 'weekly'
            : 'weekly';

          return {
            id: Math.random().toString(36).substr(2, 9),
            day,
            startTime: typeof rowData['Время начала'] === 'string' ? rowData['Время начала'] : '',
            endTime: typeof rowData['Время окончания'] === 'string' ? rowData['Время окончания'] : '',
            classId: typeof rowData['ID группы'] === 'string' || typeof rowData['ID группы'] === 'number' ? String(rowData['ID группы']) : '',
            subject: typeof rowData['Предмет'] === 'string' ? rowData['Предмет'] : '',
            teacherId: typeof rowData['ID преподавателя'] === 'string' || typeof rowData['ID преподавателя'] === 'number' ? String(rowData['ID преподавателя']) : '',
            teacherName: typeof rowData['Имя преподавателя'] === 'string' ? rowData['Имя преподавателя'] : '',
            roomId: typeof rowData['Кабинет'] === 'string' || typeof rowData['Кабинет'] === 'number' ? String(rowData['Кабинет']) : '',
            type,
            repeat,
            status: 'upcoming' as const
          };
        });

        setSchedule(importedSchedule);
      } catch (error) {
        console.error('Ошибка при импорте Excel:', error);
        alert('Произошла ошибка при импорте файла. Пожалуйста, проверьте формат файла.');
      }
    };

    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAIGenerate = async (result: any) => {
    console.log('AI generated schedule FULL result:', JSON.stringify(result, null, 2));
    
    if (result.generatedSchedule && Array.isArray(result.generatedSchedule)) {
      try {
        console.log('Начинаем сохранение AI расписания в БД...');
        console.log('Доступные группы:', groups.map(g => ({ id: g.id, name: g.name })));
        console.log('Доступные преподаватели:', teachers.map(t => ({ id: t.id, name: `${t.name} ${t.surname}` })));
        console.log('Доступные учебные планы:', studyPlans.map(sp => ({ id: sp.id, name: sp.name })));
        console.log('Доступные аудитории:', classrooms.map(c => ({ id: c.id, name: c.name })));
        
        // Загружаем ПОЛНОЕ расписание из БД для проверки конфликтов
        console.log('Загружаем полное расписание из БД для проверки конфликтов...');
        let fullSchedule: ScheduleItem[] = [];
        
        try {
          // Получаем все расписание без фильтров для проверки конфликтов
          const fullScheduleResponse = await scheduleService.getScheduleForUser(
            user?.role || 'STUDENT',
            user?.id,
            { 
              page: 1, 
              pageSize: 10000 // Большой размер чтобы получить все записи
            }
          );
          
          if (Array.isArray(fullScheduleResponse)) {
            fullSchedule = fullScheduleResponse;
          } else {
            fullSchedule = fullScheduleResponse.items || [];
          }
          
          console.log(`Загружено ${fullSchedule.length} существующих записей расписания для проверки конфликтов`);
          console.log('Образец существующих записей:', fullSchedule.slice(0, 3));
          
        } catch (error) {
          console.warn('Ошибка при загрузке полного расписания, используем текущие данные:', error);
          fullSchedule = schedule; // Fallback на текущие данные
        }
        
        // Сохраняем каждую запись через API
        const savedScheduleItems: ScheduleItem[] = [];
        const errors: string[] = [];
        
        for (let i = 0; i < result.generatedSchedule.length; i++) {
          const aiItem = result.generatedSchedule[i];
          console.log(`\n--- Обрабатываем запись ${i + 1}/${result.generatedSchedule.length} ---`);
          console.log('AI Item:', JSON.stringify(aiItem, null, 2));
          
          try {
            // Находим реальные ID для создания через API
            console.log('Поиск группы...');
            const selectedGroup = groups.find(g => 
              g.name === aiItem.groupName || 
              g.name === aiItem.group ||
              g.id.toString() === aiItem.groupId ||
              g.name.toLowerCase().includes((aiItem.groupName || aiItem.group || '').toLowerCase())
            );
            console.log('Найденная группа:', selectedGroup);

            console.log('Поиск преподавателя...');
            const selectedTeacher = teachers.find(t => {
              const fullName = `${t.name} ${t.surname}`;
              return fullName === aiItem.teacherName || 
                     fullName === aiItem.teacher ||
                     t.id.toString() === aiItem.teacherId ||
                     fullName.toLowerCase().includes((aiItem.teacherName || aiItem.teacher || '').toLowerCase());
            });
            console.log('Найденный преподаватель:', selectedTeacher);

            console.log('Поиск аудитории...');
            const selectedClassroom = classrooms.find(c => 
              c.name === aiItem.roomId || 
              c.name === aiItem.room ||
              c.name === aiItem.classroom ||
              c.id.toString() === aiItem.classroomId ||
              c.name.toLowerCase().includes((aiItem.roomId || aiItem.room || aiItem.classroom || '').toLowerCase())
            );
            console.log('Найденная аудитория:', selectedClassroom);

            console.log('Поиск учебного плана...');
            const selectedStudyPlan = studyPlans.find(sp => 
              sp.name === aiItem.subject || 
              sp.name === aiItem.studyPlan ||
              sp.id.toString() === aiItem.studyPlanId ||
              sp.name.toLowerCase().includes((aiItem.subject || aiItem.studyPlan || '').toLowerCase())
            );
            console.log('Найденный учебный план:', selectedStudyPlan);

            if (!selectedGroup) {
              const errorMsg = `Группа не найдена для: ${aiItem.groupName || aiItem.group || 'undefined'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              continue;
            }

            if (!selectedTeacher) {
              const errorMsg = `Преподаватель не найден для: ${aiItem.teacherName || aiItem.teacher || 'undefined'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              continue;
            }

            if (!selectedStudyPlan) {
              const errorMsg = `Учебный план не найден для: ${aiItem.subject || aiItem.studyPlan || 'undefined'}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              continue;
            }

            // Создаем DTO для API
            const createDto: CreateScheduleDto = {
              studyPlanId: selectedStudyPlan.id,
              groupId: selectedGroup.id,
              teacherId: selectedTeacher.id,
              classroomId: selectedClassroom?.id,
              dayOfWeek: getDayNumber(aiItem.day || aiItem.dayOfWeek || 'monday'),
              startTime: aiItem.startTime || aiItem.time || '09:00',
              endTime: aiItem.endTime || getEndTime(aiItem.startTime || aiItem.time || '09:00')
            };

            console.log('Создаем запись расписания с DTO:', JSON.stringify(createDto, null, 2));

            // Проверяем конфликты перед созданием
            console.log('Проверяем конфликты с полным расписанием...');
            const conflictCheckSchedule = [...fullSchedule, ...savedScheduleItems];
            console.log(`Проверяем против ${conflictCheckSchedule.length} существующих записей`);
            
            const conflicts = checkScheduleConflicts(createDto, conflictCheckSchedule);
            
            if (conflicts.length > 0) {
              const conflictMsg = `Конфликт расписания для записи ${i + 1}: ${conflicts.join(', ')}`;
              console.warn(conflictMsg);
              errors.push(conflictMsg);
              continue;
            }

            console.log('Конфликтов не найдено, создаем запись...');

            // Вызываем API для создания
            const createdSchedule = await scheduleService.create(createDto);
            
            // Конвертируем ответ API в формат для отображения
            const newScheduleItem = ScheduleService.convertToScheduleItem(createdSchedule);
            savedScheduleItems.push(newScheduleItem);
            
            console.log('Запись успешно создана:', newScheduleItem);
            
          } catch (error) {
            const errorMsg = `Ошибка при создании записи ${i + 1}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
            console.error(errorMsg, error);
            errors.push(errorMsg);
          }
        }

        console.log('\n--- Результаты сохранения ---');
        console.log(`Успешно сохранено: ${savedScheduleItems.length} записей`);
        console.log(`Ошибок: ${errors.length}`);
        if (errors.length > 0) {
          console.log('Список ошибок:', errors);
        }

        if (savedScheduleItems.length > 0) {
          // Добавляем сохраненные записи к существующему расписанию
          setSchedule(prev => [...prev, ...savedScheduleItems]);
          setTotal(prev => prev + savedScheduleItems.length);
          
          const message = errors.length > 0 
            ? `Создано ${savedScheduleItems.length} записей. ${errors.length} записей пропущено из-за ошибок.`
            : `Успешно создано ${savedScheduleItems.length} записей расписания!`;
          
          console.log(message);
          alert(message);
          
          if (errors.length > 0) {
            console.warn('Детали ошибок:', errors.join('\n'));
          }
        } else {
          const errorMessage = 'Не удалось создать ни одной записи расписания.\n\nОшибки:\n' + errors.join('\n');
          console.error(errorMessage);
          alert(errorMessage);
        }
        
      } catch (error) {
        console.error('Критическая ошибка при сохранении AI расписания:', error);
        alert('Критическая ошибка при сохранении расписания: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      }
    } else {
      console.error('Неверный формат результата AI:', result);
      alert('Неверный формат результата от AI. Проверьте консоль для деталей.');
    }
  };

  const handleAILessonGenerate = async (result: AILessonsResponse) => {
    console.log('AI generated lessons result:', result);
    
    // Просто показываем результат пользователю, так как применение уже произошло в модальном окне
    const message = result.success 
      ? `Расписание успешно применено! Создано ${result.statistics.schedulesCreated} записей.`
      : 'Возникли проблемы при применении расписания.';
    
    alert(message);
    
    // Обновляем расписание
    loadScheduleData();
  };

  const handleRoomClick = (roomId: string) => {
    console.log(`Выбрана аудитория ${roomId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Загрузка расписания..." />
      </div>
    );
  }

  return (
    <>
      <div className="p-3 md:p-6 max-w-[1600px] mx-auto">
        {/* Заголовок и кнопки - мобильная адаптация */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              {role === 'STUDENT' ? 'Моё расписание' :
                role === 'PARENT' ? 'Расписание занятий' :
                  role === 'TEACHER' ? 'Мои занятия' :
                    'Управление расписанием'}
            </h1>

            {/* Показываем кнопку AI только пользователям с разрешениями */}
            <PermissionGuard module="schedule" action="create">
              <button
                onClick={() => setIsAILessonModalOpen(true)}
                disabled={isLoading}
                className="w-full sm:w-auto px-3 md:px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center justify-center transition-colors disabled:opacity-50 text-sm md:text-base"
              >
                <Bot className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">AI Планирование</span>
                <span className="sm:hidden">AI План</span>
              </button>
            </PermissionGuard>
          </div>

          {/* Кнопки управления */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {canEditSchedule() && (
              <button
                onClick={() => handleAddClick()}
                className="w-full sm:w-auto px-3 md:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center transition-colors text-sm md:text-base"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Добавить занятие</span>
                <span className="sm:hidden">Добавить</span>
              </button>
            )}
            
            {/* Переключатель вида */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-2 transition-colors text-sm md:text-base ${
                  viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Table className="h-4 w-4 inline-block mr-1 md:mr-2" />
                Таблица
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-2 transition-colors text-sm md:text-base ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4 inline-block mr-1 md:mr-2" />
                Сетка
              </button>
            </div>
          </div>
        </div>

        {/* Панель фильтров - адаптированная под роли с реальными данными из API */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Фильтры</h3>
            <button
              onClick={() => {
                setFilters({
                  day: '',
                  groupId: '',
                  studyPlanId: '',
                  teacherId: '',
                  classroomId: ''
                });
                setPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Сбросить все
            </button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {/* День недели доступен всем */}
            <div>
              <select
                value={filters.day}
                onChange={(e) => setFilters({ ...filters, day: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">День недели</option>
                <option value="monday">Понедельник</option>
                <option value="tuesday">Вторник</option>
                <option value="wednesday">Среда</option>
                <option value="thursday">Четверг</option>
                <option value="friday">Пятница</option>
                <option value="saturday">Суббота</option>
                <option value="sunday">Воскресенье</option>
              </select>
            </div>

            {/* Группа */}
            {availableFilters.group && (
              <div>
                <select
                  value={filters.groupId}
                  onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите группу</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id.toString()}>
                      {group.name} (курс {group.courseNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Учебный план (предмет) */}
            {availableFilters.studyPlan && (
              <div>
                <div className="relative">
                  <Autocomplete
                    placeholder="Поиск предмета..."
                    options={studyPlans.map(plan => ({
                      id: plan.id,
                      label: plan.name,
                      value: plan.id.toString()
                    }))}
                    value={filters.studyPlanId ? {
                      id: parseInt(filters.studyPlanId),
                      label: studyPlans.find(plan => plan.id.toString() === filters.studyPlanId)?.name || `План #${filters.studyPlanId}`,
                      value: filters.studyPlanId
                    } : null}
                    onChange={(option) => {
                      // Обновляем фильтр, что автоматически обновит URL и вызовет загрузку данных
                      setFilters({
                        ...filters,
                        studyPlanId: option ? option.value.toString() : ''
                      });

                      // Сбрасываем страницу при изменении фильтра
                      setPage(1);
                    }}
                    onSearch={(query: string) => {
                      // Очищаем предыдущий таймаут, если он есть
                      if (studyPlanSearchTimeoutRef.current) {
                        clearTimeout(studyPlanSearchTimeoutRef.current);
                      }

                      // Поиск только при вводе минимум 2 символов
                      if (query.length >= 2) {
                        setIsLoadingStudyPlans(true);

                        // Создаем новый таймаут для дебаунса
                        studyPlanSearchTimeoutRef.current = setTimeout(() => {
                          scheduleService.searchStudyPlans(query)
                            .then(plans => {
                              setStudyPlans(plans);
                              setIsLoadingStudyPlans(false);
                            })
                            .catch(error => {
                              console.error('Ошибка при поиске учебных планов:', error);
                              setIsLoadingStudyPlans(false);
                            });
                        }, 300);
                      } else if (query.length === 0) {
                        // Загрузить все планы при очистке поля
                        setIsLoadingStudyPlans(true);
                        scheduleService.getStudyPlans()
                          .then(plans => {
                            setStudyPlans(plans);
                            setIsLoadingStudyPlans(false);
                          })
                          .catch(error => {
                            console.error('Ошибка при загрузке учебных планов:', error);
                            setIsLoadingStudyPlans(false);
                          });
                      }
                    }}
                    isLoading={isLoadingStudyPlans}
                    label="Учебный план"
                    helperText="Начните вводить название предмета для поиска"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Преподаватель виден только администратору */}
        {role === 'ADMIN' && (
          <div>
            <select
              value={filters.teacherId}
              onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите преподавателя</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id.toString()}>
                  {teacher.name} {teacher.surname}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Аудитория */}
        {availableFilters.classroom && (
          <div>
            <select
              value={filters.classroomId}
              onChange={(e) => setFilters({ ...filters, classroomId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите аудиторию</option>
              {classrooms.map(classroom => (
                <option key={classroom.id} value={classroom.id.toString()}>
                  {classroom.name} ({classroom.building})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      )

      {/* Таблица расписания */}
      {
        viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    День недели
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Группа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Предмет
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Преподаватель
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Аудитория
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Повторение
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  {canEditSchedule() && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredSchedule().map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.day === 'monday' ? 'Понедельник' :
                        item.day === 'tuesday' ? 'Вторник' :
                          item.day === 'wednesday' ? 'Среда' :
                            item.day === 'thursday' ? 'Четверг' : 'Пятница'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {item.startTime} - {item.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.classId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {item.teacherName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleRoomClick(item.roomId)}
                        className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.roomId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'consultation' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                        {item.type === 'lesson' ? 'Урок' :
                          item.type === 'consultation' ? 'Консультация' : 'Доп. занятие'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.repeat === 'weekly' ? 'Еженедельно' :
                        item.repeat === 'biweekly' ? 'Раз в 2 недели' : 'Единожды'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                        item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {item.status === 'upcoming' ? 'Предстоит' :
                          item.status === 'completed' ? 'Завершено' : 'Отменено'}
                      </span>
                    </td>
                    {canEditSchedule() && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Пагинация */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center space-x-2">
                <span>Строк на странице:</span>
                <select value={pageSize} onChange={handlePageSizeChange} className="border rounded px-2 py-1">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Назад
                </button>
                <span>Страница {page} из {Math.ceil(total / pageSize) || 1}</span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Вперёд
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Всего: {total}
              </div>
            </div>
          </div>
        )
      }

      {/* Сетка расписания */}
      {
        viewMode === 'grid' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-4">
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-1"></div>
              <div className="text-center font-medium py-2 bg-gray-100">Понедельник</div>
              <div className="text-center font-medium py-2 bg-gray-100">Вторник</div>
              <div className="text-center font-medium py-2 bg-gray-100">Среда</div>
              <div className="text-center font-medium py-2 bg-gray-100">Четверг</div>
              <div className="text-center font-medium py-2 bg-gray-100">Пятница</div>

              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map((time) => (
                <React.Fragment key={time}>
                  <div className="text-center font-medium py-2 bg-gray-50">{time}</div>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                    const scheduleForTimeAndDay = getFilteredSchedule().filter(
                      (item) => item.day === day && item.startTime === time
                    );

                    return (
                      <div
                        key={`${day}-${time}`}
                        className="border border-gray-200 p-1 min-h-16 relative"
                        onClick={() => canEditSchedule() && handleAddClick(day as ScheduleItem['day'], time)}
                      >
                        {scheduleForTimeAndDay.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2 mb-1 rounded text-xs ${item.type === 'lesson' ? 'bg-blue-50 border-l-4 border-blue-500' :
                              item.type === 'consultation' ? 'bg-green-50 border-l-4 border-green-500' :
                                'bg-purple-50 border-l-4 border-purple-500'
                              }`}
                          >
                            <div className="font-semibold">{item.subject}</div>
                            <div className="text-gray-600">{item.classId}</div>
                            <div className="text-gray-500 flex items-center mt-1">
                              <User className="h-3 w-3 mr-1" />
                              {item.teacherName}
                            </div>
                            <div className="text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {item.roomId}
                            </div>
                            {canEditSchedule() && (
                              <div className="absolute top-1 right-1 flex space-x-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                  className="bg-white p-1 rounded-full shadow-sm hover:bg-gray-100"
                                >
                                  <Edit className="h-3 w-3 text-gray-500" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
                                  className="bg-white p-1 rounded-full shadow-sm hover:bg-gray-100"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )
      }

      {/* Модальные окна показываются только если есть права на редактирование */}
      <AnimatePresence>
        {isModalOpen && canEditSchedule() && (
          <ScheduleModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedItem(null);
            }}
            onSave={handleScheduleSave}
            initialData={selectedItem || undefined}
            isEdit={isEditMode}
            groups={groups}
            teachers={teachers}
            studyPlans={studyPlans}
            classrooms={classrooms}
          />
        )}
      </AnimatePresence>

      {/* AI Lesson Generator Modal */}
      <AILessonGeneratorModal
        isOpen={isAILessonModalOpen}
        onClose={() => setIsAILessonModalOpen(false)}
        onGenerate={handleAILessonGenerate}
        groups={groups}
        teachers={teachers}
        studyPlans={studyPlans}
      />
    </>
  )
};

export default SchedulePage;
