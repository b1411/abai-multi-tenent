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
import { Button, Loading, Modal, Autocomplete } from '../components/ui';

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

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, initialData, isEdit = false }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, isEdit ? formData.id : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-[500px]"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{isEdit ? 'Редактировать занятие' : 'Добавить занятие'}</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время начала
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите время</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Группа
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите группу</option>
                <option value="МК24-1М">МК24-1М (Менеджмент)</option>
                <option value="МК24-2М">МК24-2М (Менеджмент)</option>
                <option value="ПК24-1П">ПК24-1П (Программирование)</option>
                <option value="ПР24-1Ю">ПР24-1Ю (Право)</option>
                <option value="ПР24-2Ю">ПР24-2Ю (Право)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Предмет
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите предмет</option>
                <option value="Алгебра">Алгебра</option>
                <option value="Физика">Физика</option>
                <option value="Химия">Химия</option>
                <option value="Биология">Биология</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Преподаватель
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите преподавателя</option>
                <option value="ivanova">Иванова Л.</option>
                <option value="petrov">Петров А.</option>
                <option value="sidorov">Сидоров В.</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Аудитория
              </label>
              <input
                type="text"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: 301"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип занятия
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleItem['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lesson">Урок</option>
                <option value="consultation">Консультация</option>
                <option value="extra">Доп. занятие</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Повторение
              </label>
              <select
                value={formData.repeat}
                onChange={(e) => setFormData({ ...formData, repeat: e.target.value as ScheduleItem['repeat'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Еженедельно</option>
                <option value="biweekly">Раз в 2 недели</option>
                <option value="once">Единожды</option>
              </select>
            </div>
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

  const { user } = useAuth();
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
    return role === 'ADMIN';
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
        // Для демо просто удаляем из состояния
        setSchedule(prev => prev.filter(item => item.id !== id));

        // В реальном приложении здесь был бы вызов API
        // await scheduleService.remove(id);
      } catch (error) {
        console.error('Ошибка при удалении занятия:', error);
      }
    }
  };

  const handleScheduleSave = async (scheduleItem: Partial<ScheduleItem>, id?: string) => {
    try {
      if (id) {
        // Редактирование существующего занятия
        const updatedSchedule = schedule.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...scheduleItem,
              // Обновляем имя преподавателя на основе ID
              teacherName: scheduleItem.teacherId === 'ivanova' ? 'Иванова Л.' :
                scheduleItem.teacherId === 'petrov' ? 'Петров А.' : 'Сидоров В.',
            };
          }
          return item;
        });

        setSchedule(updatedSchedule);

        // В реальном приложении здесь был бы вызов API
        // const updateDto = ScheduleService.convertToUpdateDto(scheduleItem);
        // await scheduleService.update(id, updateDto);
      } else {
        // Создание нового занятия
        const newSchedule: ScheduleItem = {
          id: Math.random().toString(36).substr(2, 9),
          day: scheduleItem.day as ScheduleItem['day'],
          startTime: scheduleItem.startTime!,
          endTime: scheduleItem.endTime || scheduleItem.startTime!.split(':')[0] + ':45', // Автоматически устанавливаем время окончания, если не указано
          classId: scheduleItem.classId!,
          subject: scheduleItem.subject!,
          teacherId: scheduleItem.teacherId!,
          teacherName: scheduleItem.teacherId === 'ivanova' ? 'Иванова Л.' :
            scheduleItem.teacherId === 'petrov' ? 'Петров А.' : 'Сидоров В.',
          roomId: scheduleItem.roomId!,
          type: scheduleItem.type as ScheduleItem['type'],
          repeat: scheduleItem.repeat as ScheduleItem['repeat'],
          status: 'upcoming'
        };

        setSchedule(prev => [...prev, newSchedule]);

        // В реальном приложении здесь был бы вызов API
        // const createDto = ScheduleService.convertToCreateDto(scheduleItem, { ... });
        // await scheduleService.create(createDto);
      }
    } catch (error) {
      console.error('Ошибка при сохранении расписания:', error);
    }
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

  const handleAISchedule = async () => {
    setIsLoading(true);
    // Здесь будет логика AI
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
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
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Заголовок и кнопки */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {role === 'STUDENT' ? 'Моё расписание' :
                role === 'PARENT' ? 'Расписание занятий' :
                  role === 'TEACHER' ? 'Мои занятия' :
                    'Управление расписанием'}
            </h1>

            {/* Показываем кнопки импорта и AI только администратору */}
            {role === 'ADMIN' && (
              <div className="flex space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelImport}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Импорт Excel
                </button>
                <button
                  onClick={handleAISchedule}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center transition-colors disabled:opacity-50"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Расписание
                </button>
              </div>
            )}
          </div>

          {/* Переключатель вида доступен всем */}
          <div className="flex items-center space-x-2">
            {canEditSchedule() && (
              <button
                onClick={() => handleAddClick()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition-colors mr-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить занятие
              </button>
            )}
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Table className="h-4 w-4 inline-block mr-2" />
              Таблица
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Calendar className="h-4 w-4 inline-block mr-2" />
              Сетка
            </button>
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
          />
        )}
      </AnimatePresence>
    </>
  )
};

export default SchedulePage;
