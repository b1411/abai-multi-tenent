import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaPlus, FaTimes, FaCalendar, FaTable, FaFileExcel, FaRobot } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import WeekGrid from '../components/WeekGrid';
import ClassroomModal from '../components/ClassroomModal';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

// Типы данных
interface Schedule {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string;
  endTime: string;
  classId: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  type: 'lesson' | 'consultation' | 'extra';
  repeat: 'weekly' | 'biweekly' | 'once';
  comment?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface FilterState {
  day: string;
  classId: string;
  subject: string;
  teacherId: string;
  roomId: string;
}

// Временные данные для примера
const INITIAL_SCHEDULE: Schedule[] = [
  {
    id: '1',
    day: 'monday',
    startTime: '08:00',
    endTime: '08:45',
    classId: 'МК24-1М',
    subject: 'Алгебра',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '301',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '2',
    day: 'monday',
    startTime: '09:00',
    endTime: '09:45',
    classId: 'МК24-2М',
    subject: 'Физика',
    teacherId: 'petrov',
    teacherName: 'Петров А.',
    roomId: '302',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '3',
    day: 'monday',
    startTime: '10:00',
    endTime: '10:45',
    classId: 'ПК24-1П',
    subject: 'Химия',
    teacherId: 'sidorov',
    teacherName: 'Сидоров В.',
    roomId: '303',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '4',
    day: 'tuesday',
    startTime: '08:00',
    endTime: '08:45',
    classId: 'ПР24-1Ю',
    subject: 'Биология',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '304',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '5',
    day: 'tuesday',
    startTime: '09:00',
    endTime: '09:45',
    classId: 'МК24-1М',
    subject: 'Физика',
    teacherId: 'petrov',
    teacherName: 'Петров А.',
    roomId: '302',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '6',
    day: 'tuesday',
    startTime: '10:00',
    endTime: '10:45',
    classId: 'МК24-2М',
    subject: 'Алгебра',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '301',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '7',
    day: 'wednesday',
    startTime: '08:00',
    endTime: '08:45',
    classId: 'ПК24-1П',
    subject: 'Физика',
    teacherId: 'petrov',
    teacherName: 'Петров А.',
    roomId: '302',
    type: 'consultation',
    repeat: 'biweekly',
    status: 'upcoming'
  },
  {
    id: '8',
    day: 'wednesday',
    startTime: '09:00',
    endTime: '09:45',
    classId: 'ПР24-1Ю',
    subject: 'Химия',
    teacherId: 'sidorov',
    teacherName: 'Сидоров В.',
    roomId: '303',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '9',
    day: 'wednesday',
    startTime: '10:00',
    endTime: '10:45',
    classId: 'МК24-1М',
    subject: 'Биология',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '304',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '10',
    day: 'thursday',
    startTime: '08:00',
    endTime: '08:45',
    classId: 'МК24-2М',
    subject: 'Химия',
    teacherId: 'sidorov',
    teacherName: 'Сидоров В.',
    roomId: '303',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '11',
    day: 'thursday',
    startTime: '09:00',
    endTime: '09:45',
    classId: 'ПК24-1П',
    subject: 'Алгебра',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '301',
    type: 'extra',
    repeat: 'once',
    status: 'upcoming'
  },
  {
    id: '12',
    day: 'thursday',
    startTime: '10:00',
    endTime: '10:45',
    classId: 'ПР24-1Ю',
    subject: 'Физика',
    teacherId: 'petrov',
    teacherName: 'Петров А.',
    roomId: '302',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '13',
    day: 'friday',
    startTime: '08:00',
    endTime: '08:45',
    classId: 'МК24-1М',
    subject: 'Химия',
    teacherId: 'sidorov',
    teacherName: 'Сидоров В.',
    roomId: '303',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '14',
    day: 'friday',
    startTime: '09:00',
    endTime: '09:45',
    classId: 'МК24-2М',
    subject: 'Биология',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '304',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '15',
    day: 'friday',
    startTime: '10:00',
    endTime: '10:45',
    classId: 'ПК24-1П',
    subject: 'Физика',
    teacherId: 'petrov',
    teacherName: 'Петров А.',
    roomId: '302',
    type: 'consultation',
    repeat: 'biweekly',
    status: 'upcoming'
  },
  {
    id: '16',
    day: 'monday',
    startTime: '11:00',
    endTime: '11:45',
    classId: 'ПР24-1Ю',
    subject: 'Алгебра',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '301',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '17',
    day: 'tuesday',
    startTime: '11:00',
    endTime: '11:45',
    classId: 'МК24-1М',
    subject: 'Химия',
    teacherId: 'sidorov',
    teacherName: 'Сидоров В.',
    roomId: '303',
    type: 'extra',
    repeat: 'once',
    status: 'upcoming'
  },
  {
    id: '18',
    day: 'wednesday',
    startTime: '11:00',
    endTime: '11:45',
    classId: 'МК24-2М',
    subject: 'Физика',
    teacherId: 'petrov',
    teacherName: 'Петров А.',
    roomId: '302',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '19',
    day: 'thursday',
    startTime: '11:00',
    endTime: '11:45',
    classId: 'ПК24-1П',
    subject: 'Биология',
    teacherId: 'ivanova',
    teacherName: 'Иванова Л.',
    roomId: '304',
    type: 'lesson',
    repeat: 'weekly',
    status: 'upcoming'
  },
  {
    id: '20',
    day: 'friday',
    startTime: '11:00',
    endTime: '11:45',
    classId: 'ПР24-1Ю',
    subject: 'Химия',
    teacherId: 'sidorov',
    teacherName: 'Сидоров В.',
    roomId: '303',
    type: 'consultation',
    repeat: 'biweekly',
    status: 'upcoming'
  }
];

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleItem: Partial<Schedule>) => void;
  initialData?: {
    day: string;
    startTime: string;
  };
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Schedule>>({
    day: (initialData?.day || '') as Schedule['day'],
    startTime: initialData?.startTime || '',
    endTime: '',
    classId: '',
    subject: '',
    teacherId: '',
    roomId: '',
    type: 'lesson' as Schedule['type'],
    repeat: 'weekly' as Schedule['repeat']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
          <h3 className="text-lg font-medium">Добавить занятие</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
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
                onChange={(e) => setFormData({ ...formData, day: e.target.value as Schedule['day'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Schedule['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                onChange={(e) => setFormData({ ...formData, repeat: e.target.value as Schedule['repeat'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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
  const [searchParams] = useSearchParams();
  const roomFilter = searchParams.get('room');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [schedule, setSchedule] = useState<Schedule[]>(INITIAL_SCHEDULE);
  const [filters, setFilters] = useState({
    day: '',
    classId: '',
    subject: '',
    teacherId: '',
    roomId: roomFilter || ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: Schedule['day']; startTime: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<null>(null);
  const { user } = useAuth();
  const role = user?.role;

  useEffect(() => {
    if (roomFilter) {
      setFilters(prev => ({
        ...prev,
        roomId: roomFilter
      }));
    }
  }, [roomFilter]);

  // Функция фильтрации расписания в зависимости от роли
  const getFilteredSchedule = () => {
    let filtered = [...schedule];

    switch (role) {
      case 'STUDENT':
        // Студент видит только расписание своей группы (допустим, он в МК24-1М)
        filtered = filtered.filter(item => item.classId === 'МК24-1М');
        break;
      
      case 'PARENT':
        // Родитель видит расписание группы своего ребенка (допустим, МК24-2М)
        filtered = filtered.filter(item => item.classId === 'МК24-2М');
        break;
      
      case 'TEACHER':
        // Учитель видит только свои занятия
        filtered = filtered.filter(item => item.teacherId === 'ivanova'); // Предполагаем, что текущий учитель - Иванова
        break;
      
      case 'ADMIN':
        // Администратор видит все расписание
        break;
    }

    // Применяем дополнительные фильтры
    return filtered.filter(item => {
      const matchesDay = !filters.day || item.day === filters.day;
      const matchesClass = !filters.classId || item.classId === filters.classId;
      const matchesSubject = !filters.subject || item.subject === filters.subject;
      const matchesTeacher = !filters.teacherId || item.teacherId === filters.teacherId;
      const matchesRoom = !filters.roomId || item.roomId === filters.roomId;
      
      return matchesDay && matchesClass && matchesSubject && matchesTeacher && matchesRoom;
    });
  };

  // Функция проверки прав на редактирование
  const canEditSchedule = () => {
    return role === 'ADMIN';
  };

  const handleCellClick = (day: Schedule['day'], time: string) => {
    setSelectedCell({ day, startTime: time });
    setIsModalOpen(true);
  };

  const handleScheduleSave = (scheduleItem: Partial<Schedule>) => {
    const newSchedule: Schedule = {
      id: Math.random().toString(36).substr(2, 9),
      day: scheduleItem.day as Schedule['day'],
      startTime: scheduleItem.startTime!,
      endTime: scheduleItem.startTime!.split(':')[0] + ':45',
      classId: scheduleItem.classId!,
      subject: scheduleItem.subject!,
      teacherId: scheduleItem.teacherId!,
      teacherName: scheduleItem.teacherId === 'ivanova' ? 'Иванова Л.' :
                  scheduleItem.teacherId === 'petrov' ? 'Петров А.' : 'Сидоров В.',
      roomId: scheduleItem.roomId!,
      type: scheduleItem.type as Schedule['type'],
      repeat: scheduleItem.repeat as Schedule['repeat'],
      status: 'upcoming'
    };

    setSchedule([...schedule, newSchedule]);
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

        const importedSchedule: Schedule[] = jsonData.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          day: row['День недели']?.toLowerCase() || 'monday',
          startTime: row['Время начала'] || '08:00',
          endTime: row['Время окончания'] || '08:45',
          classId: row['Группа'] || '',
          subject: row['Предмет'] || '',
          teacherId: row['ID преподавателя'] || 'ivanova',
          teacherName: row['Преподаватель'] || '',
          roomId: row['Аудитория']?.toString() || '',
          type: (row['Тип занятия']?.toLowerCase() || 'lesson') as Schedule['type'],
          repeat: (row['Повторение']?.toLowerCase() || 'weekly') as Schedule['repeat'],
          status: 'upcoming'
        }));

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
    // Временно отключаем функциональность с ClassroomModal
    console.log(`Выбрана аудитория ${roomId}`);
  };

  return (
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
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
              >
                <FaFileExcel className="mr-2" />
                Импорт Excel
              </button>
              <button
                onClick={handleAISchedule}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center"
              >
                <FaRobot className="mr-2" />
                AI Расписание
              </button>
            </div>
          )}
        </div>

        {/* Переключатель вида доступен всем */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <FaTable className="inline-block mr-2" />
            Таблица
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <FaCalendar className="inline-block mr-2" />
            Сетка
          </button>
        </div>
      </div>

      {/* Панель фильтров - адаптированная под роли */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-5 gap-4">
          {/* День недели доступен всем */}
          <div>
            <select
              value={filters.day}
              onChange={(e) => setFilters({ ...filters, day: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">День недели</option>
              <option value="monday">Понедельник</option>
              <option value="tuesday">Вторник</option>
              <option value="wednesday">Среда</option>
              <option value="thursday">Четверг</option>
              <option value="friday">Пятница</option>
            </select>
          </div>

          {/* Группа видна только администратору и учителю */}
          {(role === 'ADMIN' || role === 'TEACHER') && (
            <div>
              <select
                value={filters.classId}
                onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Выберите группу</option>
                <option value="МК24-1М">МК24-1М (Менеджмент)</option>
                <option value="МК24-2М">МК24-2М (Менеджмент)</option>
                <option value="ПК24-1П">ПК24-1П (Программирование)</option>
                <option value="ПР24-1Ю">ПР24-1Ю (Право)</option>
                <option value="ПР24-2Ю">ПР24-2Ю (Право)</option>
              </select>
            </div>
          )}

          {/* Предмет доступен всем */}
          <div>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Предмет</option>
              <option value="Алгебра">Алгебра</option>
              <option value="Физика">Физика</option>
              <option value="Химия">Химия</option>
              <option value="Биология">Биология</option>
            </select>
          </div>

          {/* Преподаватель виден только администратору */}
          {role === 'ADMIN' && (
            <div>
              <select
                value={filters.teacherId}
                onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Преподаватель</option>
                <option value="ivanova">Иванова Л.</option>
                <option value="petrov">Петров А.</option>
                <option value="sidorov">Сидоров В.</option>
              </select>
            </div>
          )}

          {/* Аудитория доступна всем */}
          <div>
            <select
              value={filters.roomId}
              onChange={(e) => setFilters({ ...filters, roomId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Аудитория</option>
              <option value="301">301</option>
              <option value="302">302</option>
              <option value="303">303</option>
              <option value="304">304</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица расписания */}
      {viewMode === 'table' && (
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredSchedule().map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.day === 'monday' ? 'Понедельник' :
                     item.day === 'tuesday' ? 'Вторник' :
                     item.day === 'wednesday' ? 'Среда' :
                     item.day === 'thursday' ? 'Четверг' : 'Пятница'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.startTime} - {item.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.classId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.teacherName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleRoomClick(item.roomId)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {item.roomId}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.type === 'lesson' ? 'Урок' :
                     item.type === 'consultation' ? 'Консультация' : 'Доп. занятие'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.repeat === 'weekly' ? 'Еженедельно' :
                     item.repeat === 'biweekly' ? 'Раз в 2 недели' : 'Единожды'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                      item.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'upcoming' ? 'Предстоит' :
                       item.status === 'completed' ? 'Завершено' : 'Отменено'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Сетка расписания */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <WeekGrid
            schedule={getFilteredSchedule()}
            onCellClick={canEditSchedule() ? handleCellClick : undefined}
          />
        </div>
      )}

      {/* Модальные окна показываются только если есть права на редактирование */}
      <AnimatePresence>
        {isModalOpen && canEditSchedule() && (
          <ScheduleModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedCell(null);
            }}
            onSave={handleScheduleSave}
            initialData={selectedCell || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulePage;
