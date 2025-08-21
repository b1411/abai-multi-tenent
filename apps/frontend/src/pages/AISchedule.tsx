import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Settings,
  BookOpen,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Bot,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  Shuffle,
  Filter,
  Building,
  Edit3,
  X,
  User,
  Heart,
  Star,
  Maximize,
  Minimize
} from 'lucide-react';
import { Button, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import ScheduleGrid from '../components/ScheduleGrid';

// Константы для праздников Казахстана
const KAZAKHSTAN_HOLIDAYS_2024_2025: { [key: string]: string } = {
  '2024-01-01': 'Новый год',
  '2024-01-02': 'Новый год',
  '2024-01-07': 'Православное Рождество',
  '2024-03-08': 'Международный женский день',
  '2024-03-21': 'Наурыз',
  '2024-03-22': 'Наурыз', 
  '2024-03-23': 'Наурыз',
  '2024-05-01': 'День единства народа',
  '2024-05-07': 'День защитника Отечества',
  '2024-05-09': 'День Победы',
  '2024-07-06': 'День столицы',
  '2024-08-30': 'День Конституции',
  '2024-10-25': 'День Республики',
  '2024-12-16': 'День независимости',
  '2025-01-01': 'Новый год',
  '2025-01-02': 'Новый год',
  '2025-01-07': 'Православное Рождество',
  '2025-03-08': 'Международный женский день',
  '2025-03-21': 'Наурыз',
  '2025-03-22': 'Наурыз',
  '2025-03-23': 'Наурыз',
  '2025-05-01': 'День единства народа',
  '2025-05-07': 'День защитника Отечества',
  '2025-05-09': 'День Победы',
  '2025-07-06': 'День столицы',
  '2025-08-30': 'День Конституции',
  '2025-10-25': 'День Республики',
  '2025-12-16': 'День независимости'
};

// Стандартные четверти учебного года
const ACADEMIC_QUARTERS = {
  1: { 
    label: '1 четверть',
    start: '2024-09-02', 
    end: '2024-10-27',
    description: 'Сентябрь - Октябрь (8-9 недель)'
  },
  2: { 
    label: '2 четверть',
    start: '2024-11-05', 
    end: '2024-12-22',
    description: 'Ноябрь - Декабрь (7-8 недель)'
  },
  3: { 
    label: '3 четверть',
    start: '2025-01-09', 
    end: '2025-03-16',
    description: 'Январь - Март (9-10 недель)'
  },
  4: { 
    label: '4 четверть',
    start: '2025-04-01', 
    end: '2025-05-25',
    description: 'Апрель - Май (7-8 недель)'
  }
};

// Моковые данные для демонстрации
const MOCK_GROUPS = [
  { id: 1, name: '10А', courseNumber: 10, studentsCount: 28 },
  { id: 2, name: '10Б', courseNumber: 10, studentsCount: 26 },
  { id: 3, name: '11А', courseNumber: 11, studentsCount: 24 },
  { id: 4, name: '11Б', courseNumber: 11, studentsCount: 25 }
];

const MOCK_SUBJECTS: { [key: number]: any[] } = {
  1: [ // 10А
    { id: 1, name: 'Математика', teacherId: 1, teacherName: 'Иванова А.С.', hoursPerWeek: 4, roomType: 'обычный' },
    { id: 2, name: 'Русский язык', teacherId: 2, teacherName: 'Петров Б.И.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 3, name: 'История', teacherId: 3, teacherName: 'Сидорова В.П.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 4, name: 'Физика', teacherId: 4, teacherName: 'Козлов Г.М.', hoursPerWeek: 3, roomType: 'лаборатория' },
    { id: 5, name: 'Химия', teacherId: 5, teacherName: 'Морозова Д.А.', hoursPerWeek: 2, roomType: 'лаборатория' },
    { id: 6, name: 'Биология', teacherId: 6, teacherName: 'Волкова Е.Н.', hoursPerWeek: 2, roomType: 'лаборатория' },
    { id: 7, name: 'География', teacherId: 7, teacherName: 'Орлов И.К.', hoursPerWeek: 1, roomType: 'обычный' },
    { id: 8, name: 'Английский язык', teacherId: 8, teacherName: 'Смит Дж.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 9, name: 'Физкультура', teacherId: 9, teacherName: 'Быстров С.В.', hoursPerWeek: 2, roomType: 'спортзал' },
    { id: 10, name: 'Информатика', teacherId: 10, teacherName: 'Программистов К.А.', hoursPerWeek: 2, roomType: 'компьютерный' }
  ],
  2: [ // 10Б - похожие предметы, но другие преподаватели для некоторых
    { id: 11, name: 'Математика', teacherId: 1, teacherName: 'Иванова А.С.', hoursPerWeek: 4, roomType: 'обычный' },
    { id: 12, name: 'Русский язык', teacherId: 11, teacherName: 'Литературова О.И.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 13, name: 'История', teacherId: 3, teacherName: 'Сидорова В.П.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 14, name: 'Физика', teacherId: 4, teacherName: 'Козлов Г.М.', hoursPerWeek: 3, roomType: 'лаборатория' },
    { id: 15, name: 'Химия', teacherId: 12, teacherName: 'Реактивов П.Т.', hoursPerWeek: 2, roomType: 'лаборатория' },
    { id: 16, name: 'Биология', teacherId: 6, teacherName: 'Волкова Е.Н.', hoursPerWeek: 2, roomType: 'лаборатория' },
    { id: 17, name: 'География', teacherId: 7, teacherName: 'Орлов И.К.', hoursPerWeek: 1, roomType: 'обычный' },
    { id: 18, name: 'Английский язык', teacherId: 13, teacherName: 'Браун М.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 19, name: 'Физкультура', teacherId: 9, teacherName: 'Быстров С.В.', hoursPerWeek: 2, roomType: 'спортзал' },
    { id: 20, name: 'Информатика', teacherId: 10, teacherName: 'Программистов К.А.', hoursPerWeek: 2, roomType: 'компьютерный' }
  ],
  3: [ // 11А - более углубленные предметы
    { id: 21, name: 'Алгебра', teacherId: 14, teacherName: 'Функциональная Л.М.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 22, name: 'Геометрия', teacherId: 14, teacherName: 'Функциональная Л.М.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 23, name: 'Русский язык', teacherId: 2, teacherName: 'Петров Б.И.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 24, name: 'Литература', teacherId: 2, teacherName: 'Петров Б.И.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 25, name: 'История Казахстана', teacherId: 15, teacherName: 'Историк З.Н.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 26, name: 'Всемирная история', teacherId: 3, teacherName: 'Сидорова В.П.', hoursPerWeek: 1, roomType: 'обычный' },
    { id: 27, name: 'Физика', teacherId: 4, teacherName: 'Козлов Г.М.', hoursPerWeek: 4, roomType: 'лаборатория' },
    { id: 28, name: 'Английский язык', teacherId: 8, teacherName: 'Смит Дж.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 29, name: 'Физкультура', teacherId: 16, teacherName: 'Спортсменка А.Б.', hoursPerWeek: 2, roomType: 'спортзал' },
    { id: 30, name: 'Информатика', teacherId: 17, teacherName: 'Кодер В.Г.', hoursPerWeek: 3, roomType: 'компьютерный' }
  ],
  4: [ // 11Б
    { id: 31, name: 'Алгебра', teacherId: 1, teacherName: 'Иванова А.С.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 32, name: 'Геометрия', teacherId: 1, teacherName: 'Иванова А.С.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 33, name: 'Русский язык', teacherId: 11, teacherName: 'Литературова О.И.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 34, name: 'Литература', teacherId: 11, teacherName: 'Литературова О.И.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 35, name: 'История Казахстана', teacherId: 15, teacherName: 'Историк З.Н.', hoursPerWeek: 2, roomType: 'обычный' },
    { id: 36, name: 'Всемирная история', teacherId: 3, teacherName: 'Сидорова В.П.', hoursPerWeek: 1, roomType: 'обычный' },
    { id: 37, name: 'Химия', teacherId: 12, teacherName: 'Реактивов П.Т.', hoursPerWeek: 3, roomType: 'лаборатория' },
    { id: 38, name: 'Биология', teacherId: 18, teacherName: 'Ботаник Р.С.', hoursPerWeek: 3, roomType: 'лаборатория' },
    { id: 39, name: 'Английский язык', teacherId: 13, teacherName: 'Браун М.', hoursPerWeek: 3, roomType: 'обычный' },
    { id: 40, name: 'Физкультура', teacherId: 16, teacherName: 'Спортсменка А.Б.', hoursPerWeek: 2, roomType: 'спортзал' }
  ]
};

const MOCK_CLASSROOMS = [
  // Корпус А
  { id: 1, name: '101', building: 'Корпус А', type: 'обычный', capacity: 30, description: 'Обычный класс для теоретических занятий' },
  { id: 2, name: '102', building: 'Корпус А', type: 'обычный', capacity: 32, description: 'Просторный класс с мультимедиа' },
  { id: 3, name: '103', building: 'Корпус А', type: 'обычный', capacity: 28, description: 'Класс для малых групп' },
  { id: 4, name: '201', building: 'Корпус А', type: 'лаборатория', capacity: 25, description: 'Физическая лаборатория' },
  { id: 5, name: '202', building: 'Корпус А', type: 'лаборатория', capacity: 24, description: 'Химическая лаборатория' },
  { id: 6, name: '301', building: 'Корпус А', type: 'актовый зал', capacity: 100, description: 'Большой актовый зал' },
  
  // Корпус Б
  { id: 7, name: '104', building: 'Корпус Б', type: 'компьютерный', capacity: 20, description: 'Компьютерный класс №1' },
  { id: 8, name: '105', building: 'Корпус Б', type: 'компьютерный', capacity: 22, description: 'Компьютерный класс №2' },
  { id: 9, name: '204', building: 'Корпус Б', type: 'лаборатория', capacity: 26, description: 'Биологическая лаборатория' },
  { id: 10, name: '301Б', building: 'Корпус Б', type: 'спортзал', capacity: 40, description: 'Спортивный зал' }
];

// Типы данных
interface TeacherPreference {
  id: string;
  type: 'time' | 'day' | 'lesson' | 'classroom' | 'special';
  title: string;
  description: string;
  enabled: boolean;
  value?: string | number | number[];
}

interface QuarterSettings {
  quarterNumber: 1 | 2 | 3 | 4;
  startDate: string;
  endDate: string;
  workingDays: number[]; // 1=пн, 2=вт, ... 6=сб
  customHolidays: string[];
}

interface ScheduleConstraints {
  workingHours: { start: string; end: string };
  maxLessonsPerDay: number;
  lunchBreakTime: { start: string; end: string };
  lessonDuration: number; // в минутах
  breakDuration: number; // в минутах
  noFirstLessonSubjects: string[]; // предметы, которые не ставить первым уроком
  noLastLessonSubjects: string[]; // предметы, которые не ставить последним уроком
  preferredDays: { [subjectName: string]: number[] }; // предпочитаемые дни для предметов
}

interface GeneratedLesson {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  groupId: number;
  groupName: string;
  teacherId: number;
  teacherName: string;
  classroomId?: number;
  classroomName?: string;
  weekNumber: number;
}

const AISchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Состояния шагов
  const [quarterSettings, setQuarterSettings] = useState<QuarterSettings>({
    quarterNumber: 1,
    startDate: ACADEMIC_QUARTERS[1].start,
    endDate: ACADEMIC_QUARTERS[1].end,
    workingDays: [1, 2, 3, 4, 5, 6], // пн-сб
    customHolidays: []
  });

  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>([]);
  const [scheduleConstraints, setScheduleConstraints] = useState<ScheduleConstraints>({
    workingHours: { start: '08:00', end: '15:00' },
    maxLessonsPerDay: 7,
    lunchBreakTime: { start: '12:00', end: '13:00' },
    lessonDuration: 45,
    breakDuration: 10,
    noFirstLessonSubjects: ['Физкультура'],
    noLastLessonSubjects: [],
    preferredDays: {}
  });

  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedLesson[]>([]);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  
  // Состояние для кастомизации предметов
  const [customSubjectHours, setCustomSubjectHours] = useState<{ [key: string]: number }>({});
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'preferences'>('details');
  
  // Состояние для пожеланий педагогов
  const [teacherPreferences, setTeacherPreferences] = useState<{ [key: string]: TeacherPreference[] }>({});

  // Состояние для полноэкранного режима
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Предустановленные пожелания педагогов
  const getDefaultTeacherPreferences = (teacherId: number): TeacherPreference[] => [
    // Временные ограничения
    {
      id: `time-1-${teacherId}`,
      type: 'time',
      title: 'Не работаю после 14:00',
      description: 'Учитель недоступен для проведения уроков после 14:00',
      enabled: false
    },
    {
      id: `time-2-${teacherId}`,
      type: 'time',
      title: 'Доступен только с 10:00',
      description: 'Учитель может проводить уроки только начиная с 10:00',
      enabled: false
    },
    {
      id: `time-3-${teacherId}`,
      type: 'time',
      title: 'Не могу в пятницу после обеда',
      description: 'В пятницу учитель работает только в первой половине дня',
      enabled: false
    },
    // Предпочтения по дням
    {
      id: `day-1-${teacherId}`,
      type: 'day',
      title: 'Предпочитаю понедельник и среду',
      description: 'Желательно ставить уроки в понедельник и среду',
      enabled: false,
      value: [1, 3]
    },
    {
      id: `day-2-${teacherId}`,
      type: 'day',
      title: 'Избегать вторник (методический день)',
      description: 'Вторник - день методических совещаний',
      enabled: false,
      value: [2]
    },
    {
      id: `day-3-${teacherId}`,
      type: 'day',
      title: 'Только четные дни недели',
      description: 'Предпочтение работы во вторник, четверг, субботу',
      enabled: false,
      value: [2, 4, 6]
    },
    // Ограничения по урокам
    {
      id: `lesson-1-${teacherId}`,
      type: 'lesson',
      title: 'Не ставить первым уроком',
      description: 'Предмет не должен быть первым в расписании',
      enabled: false
    },
    {
      id: `lesson-2-${teacherId}`,
      type: 'lesson',
      title: 'Не более 2 уроков подряд',
      description: 'Максимум 2 урока подряд без перерыва',
      enabled: false,
      value: 2
    },
    {
      id: `lesson-3-${teacherId}`,
      type: 'lesson',
      title: 'Не ставить после физкультуры',
      description: 'Урок не должен идти сразу после физкультуры',
      enabled: false
    },
    // Аудиторные предпочтения
    {
      id: `classroom-1-${teacherId}`,
      type: 'classroom',
      title: 'Только в 202 аудитории (моя лаборатория)',
      description: 'Предпочтение проведения уроков в определенной аудитории',
      enabled: false,
      value: '202'
    },
    {
      id: `classroom-2-${teacherId}`,
      type: 'classroom',
      title: 'Избегать первый этаж',
      description: 'Предпочтение аудиторий выше первого этажа',
      enabled: false
    },
    {
      id: `classroom-3-${teacherId}`,
      type: 'classroom',
      title: 'Нужна аудитория с проектором',
      description: 'Требуется техническое оснащение',
      enabled: false
    },
    // Особые требования
    {
      id: `special-1-${teacherId}`,
      type: 'special',
      title: 'Не ставить в один день с контрольными',
      description: 'Избегать совпадения с днями контрольных работ',
      enabled: false
    },
    {
      id: `special-2-${teacherId}`,
      type: 'special',
      title: 'Интервал между уроками минимум 1 час',
      description: 'Между уроками должен быть перерыв минимум 1 час',
      enabled: false,
      value: 60
    },
    {
      id: `special-3-${teacherId}`,
      type: 'special',
      title: 'Группировать уроки в блоки',
      description: 'Предпочтение компактного расписания',
      enabled: false
    }
  ];

  // Функции для работы с пожеланиями педагогов
  const getTeacherPreferences = (teacherId: number): TeacherPreference[] => {
    const key = `teacher-${teacherId}`;
    if (!teacherPreferences[key]) {
      return getDefaultTeacherPreferences(teacherId);
    }
    return teacherPreferences[key];
  };

  const updateTeacherPreference = (teacherId: number, preferenceId: string, enabled: boolean) => {
    const key = `teacher-${teacherId}`;
    const currentPrefs = getTeacherPreferences(teacherId);
    const updatedPrefs = currentPrefs.map(pref => 
      pref.id === preferenceId ? { ...pref, enabled } : pref
    );
    
    setTeacherPreferences({
      ...teacherPreferences,
      [key]: updatedPrefs
    });
  };

  const getActivePreferencesCount = (teacherId: number): number => {
    return getTeacherPreferences(teacherId).filter(pref => pref.enabled).length;
  };

  // Проверка прав доступа
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600">Только администраторы могут создавать расписание</p>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Настройка четверти', icon: Calendar, description: 'Выбор периода и праздничных дней' },
    { num: 2, title: 'Выбор классов', icon: Users, description: 'Группы для планирования' },
    { num: 3, title: 'Выбор аудиторий', icon: Building, description: 'Доступные аудитории' },
    { num: 4, title: 'Ограничения', icon: Settings, description: 'Правила составления расписания' },
    { num: 5, title: 'Генерация', icon: Bot, description: 'Создание расписания' },
    { num: 6, title: 'Просмотр', icon: Eye, description: 'Проверка и редактирование' },
    { num: 7, title: 'Сохранение', icon: Save, description: 'Применение к базе данных' }
  ];

  const getWorkingDaysCount = () => {
    const start = new Date(quarterSettings.startDate);
    const end = new Date(quarterSettings.endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay(); // воскресенье = 7
      const dateStr = current.toISOString().split('T')[0];
      
      if (quarterSettings.workingDays.includes(dayOfWeek) && 
          !KAZAKHSTAN_HOLIDAYS_2024_2025[dateStr] && 
          !quarterSettings.customHolidays.includes(dateStr)) {
        count++;
      }
      
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const getSelectedSubjects = () => {
    return selectedGroups.reduce((subjects, groupId) => {
      const groupSubjects = MOCK_SUBJECTS[groupId] || [];
      return [...subjects, ...groupSubjects.map(s => ({ 
        ...s, 
        groupId, 
        groupName: MOCK_GROUPS.find(g => g.id === groupId)?.name || '',
        // Используем кастомные часы если они заданы
        hoursPerWeek: customSubjectHours[`${groupId}-${s.id}`] || s.hoursPerWeek
      }))];
    }, [] as any[]);
  };

  // Функции для работы с кастомизацией предметов
  const openSubjectModal = (subject: any) => {
    setSelectedSubject(subject);
    setShowSubjectModal(true);
  };

  const closeSubjectModal = () => {
    setSelectedSubject(null);
    setShowSubjectModal(false);
  };

  const updateSubjectHours = (subjectKey: string, hours: number) => {
    setCustomSubjectHours({
      ...customSubjectHours,
      [subjectKey]: hours
    });
  };

  // Функция создания демонстрационного расписания с конфликтами
  const generateDemoScheduleWithConflicts = (): GeneratedLesson[] => {
    const workingDates = getAllWorkingDates().slice(0, 10); // Берем первые 10 рабочих дней
    const demoSchedule: GeneratedLesson[] = [];
    
    if (workingDates.length === 0) return [];
    
    let lessonId = 1;

    // Создаем уроки с намеренными конфликтами для демонстрации
    const demoLessons = [
      // Понедельник - конфликты учителей
      {
        id: `demo-${lessonId++}`,
        date: workingDates[0] || '2024-09-02',
        dayOfWeek: 'понедельник',
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Математика',
        groupId: 1,
        groupName: '10А',
        teacherId: 1,
        teacherName: 'Иванова А.С.',
        classroomId: 1,
        classroomName: '101',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[0] || '2024-09-02',
        dayOfWeek: 'понедельник',
        startTime: '09:00', // КОНФЛИКТ: тот же учитель в то же время
        endTime: '09:45',
        subject: 'Алгебра',
        groupId: 4,
        groupName: '11Б',
        teacherId: 1, // КОНФЛИКТ: Иванова А.С. одновременно в двух местах
        teacherName: 'Иванова А.С.',
        classroomId: 2,
        classroomName: '102',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[0] || '2024-09-02',
        dayOfWeek: 'понедельник',
        startTime: '10:00',
        endTime: '10:45',
        subject: 'Русский язык',
        groupId: 1,
        groupName: '10А',
        teacherId: 2,
        teacherName: 'Петров Б.И.',
        classroomId: 1,
        classroomName: '101',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[0] || '2024-09-02',
        dayOfWeek: 'понедельник',
        startTime: '10:00', // КОНФЛИКТ: та же аудитория в то же время
        endTime: '10:45',
        subject: 'История',
        groupId: 2,
        groupName: '10Б',
        teacherId: 3,
        teacherName: 'Сидорова В.П.',
        classroomId: 1, // КОНФЛИКТ: аудитория 101 занята
        classroomName: '101',
        weekNumber: 1
      },
      // Вторник - конфликты групп
      {
        id: `demo-${lessonId++}`,
        date: workingDates[1] || '2024-09-03',
        dayOfWeek: 'вторник',
        startTime: '11:00',
        endTime: '11:45',
        subject: 'Физика',
        groupId: 1,
        groupName: '10А',
        teacherId: 4,
        teacherName: 'Козлов Г.М.',
        classroomId: 4,
        classroomName: '201',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[1] || '2024-09-03',
        dayOfWeek: 'вторник',
        startTime: '11:00', // КОНФЛИКТ: та же группа в то же время
        endTime: '11:45',
        subject: 'Химия',
        groupId: 1, // КОНФЛИКТ: группа 10А одновременно на двух уроках
        groupName: '10А',
        teacherId: 5,
        teacherName: 'Морозова Д.А.',
        classroomId: 5,
        classroomName: '202',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[1] || '2024-09-03',
        dayOfWeek: 'вторник',
        startTime: '12:00',
        endTime: '12:45',
        subject: 'Английский язык',
        groupId: 2,
        groupName: '10Б',
        teacherId: 8,
        teacherName: 'Смит Дж.',
        classroomId: 3,
        classroomName: '103',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[1] || '2024-09-03',
        dayOfWeek: 'вторник',
        startTime: '13:00',
        endTime: '13:45',
        subject: 'Физкультура',
        groupId: 3,
        groupName: '11А',
        teacherId: 9,
        teacherName: 'Быстров С.В.',
        classroomId: 10,
        classroomName: '301Б',
        weekNumber: 1
      },
      // Среда - смешанные конфликты
      {
        id: `demo-${lessonId++}`,
        date: workingDates[2] || '2024-09-04',
        dayOfWeek: 'среда',
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Информатика',
        groupId: 3,
        groupName: '11А',
        teacherId: 17,
        teacherName: 'Кодер В.Г.',
        classroomId: 7,
        classroomName: '104',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[2] || '2024-09-04',
        dayOfWeek: 'среда',
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Информатика',
        groupId: 1,
        groupName: '10А',
        teacherId: 10,
        teacherName: 'Программистов К.А.',
        classroomId: 7, // КОНФЛИКТ: та же аудитория
        classroomName: '104',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[2] || '2024-09-04',
        dayOfWeek: 'среда',
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Биология',
        groupId: 4,
        groupName: '11Б',
        teacherId: 18,
        teacherName: 'Ботаник Р.С.',
        classroomId: 9,
        classroomName: '204',
        weekNumber: 1
      },
      // Четверг - нормальные уроки
      {
        id: `demo-${lessonId++}`,
        date: workingDates[3] || '2024-09-05',
        dayOfWeek: 'четверг',
        startTime: '10:00',
        endTime: '10:45',
        subject: 'География',
        groupId: 1,
        groupName: '10А',
        teacherId: 7,
        teacherName: 'Орлов И.К.',
        classroomId: 2,
        classroomName: '102',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[3] || '2024-09-05',
        dayOfWeek: 'четверг',
        startTime: '11:00',
        endTime: '11:45',
        subject: 'Литература',
        groupId: 4,
        groupName: '11Б',
        teacherId: 11,
        teacherName: 'Литературова О.И.',
        classroomId: 3,
        classroomName: '103',
        weekNumber: 1
      },
      // Пятница - еще больше конфликтов для демонстрации
      {
        id: `demo-${lessonId++}`,
        date: workingDates[4] || '2024-09-06',
        dayOfWeek: 'пятница',
        startTime: '12:00',
        endTime: '12:45',
        subject: 'История Казахстана',
        groupId: 3,
        groupName: '11А',
        teacherId: 15,
        teacherName: 'Историк З.Н.',
        classroomId: 1,
        classroomName: '101',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[4] || '2024-09-06',
        dayOfWeek: 'пятница',
        startTime: '12:00', // КОНФЛИКТ: тот же учитель
        endTime: '12:45',
        subject: 'История Казахстана',
        groupId: 4,
        groupName: '11Б',
        teacherId: 15, // КОНФЛИКТ: Историк З.Н. одновременно в двух местах
        teacherName: 'Историк З.Н.',
        classroomId: 2,
        classroomName: '102',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[4] || '2024-09-06',
        dayOfWeek: 'пятница',
        startTime: '13:00',
        endTime: '13:45',
        subject: 'Физкультура',
        groupId: 1,
        groupName: '10А',
        teacherId: 9,
        teacherName: 'Быстров С.В.',
        classroomId: 10,
        classroomName: '301Б',
        weekNumber: 1
      },
      {
        id: `demo-${lessonId++}`,
        date: workingDates[4] || '2024-09-06',
        dayOfWeek: 'пятница',
        startTime: '13:00', // КОНФЛИКТ: тот же учитель и аудитория
        endTime: '13:45',
        subject: 'Физкультура',
        groupId: 2,
        groupName: '10Б',
        teacherId: 9, // КОНФЛИКТ: Быстров С.В.
        teacherName: 'Быстров С.В.',
        classroomId: 10, // КОНФЛИКТ: спортзал 301Б
        classroomName: '301Б',
        weekNumber: 1
      }
    ];

    demoSchedule.push(...demoLessons);

    return demoSchedule;
  };

  const generateSchedule = () => {
    setLoading(true);
    
    setTimeout(() => {
      const subjects = getSelectedSubjects();
      const workingDays = getWorkingDaysCount();
      
      // Проверяем наличие данных
      if (subjects.length === 0) {
        alert('Не выбраны предметы для составления расписания');
        setLoading(false);
        return;
      }
      
      if (selectedClassrooms.length === 0) {
        alert('Не выбраны аудитории для проведения занятий');
        setLoading(false);
        return;
      }

      // Создаем демонстрационное расписание с конфликтами для тестирования
      const schedule: GeneratedLesson[] = generateDemoScheduleWithConflicts();
      
      // Улучшенный алгоритм генерации
      let lessonId = 1;
      
      // Создаем пул рабочих дат
      const workingDates = getAllWorkingDates();
      
      if (workingDates.length === 0) {
        alert('Не найдены рабочие дни для составления расписания');
        setLoading(false);
        return;
      }
      
      subjects.forEach(subject => {
        // Рассчитываем количество уроков с учетом недель в четверти
        const weeksInQuarter = Math.ceil(workingDays / quarterSettings.workingDays.length);
        const totalLessons = Math.ceil(subject.hoursPerWeek * weeksInQuarter);
        
        // Получаем пожелания преподавателя
        const teacherPrefs = getTeacherPreferences(subject.teacherId);
        const activePrefs = teacherPrefs.filter(pref => pref.enabled);
        
        for (let i = 0; i < totalLessons; i++) {
          let attempts = 0;
          let lessonScheduled = false;
          
          while (!lessonScheduled && attempts < 50) {
            const randomDate = getRandomDateForSubject(workingDates, subject, activePrefs);
            const randomTime = getRandomTimeForSubject(subject, activePrefs);
            const classroom = getBestClassroomForSubject(subject, activePrefs);
            
            if (randomDate && randomTime && classroom) {
              // Проверяем конфликты
              if (!hasConflict(schedule, randomDate, randomTime, subject.teacherId, classroom.id, subject.groupId)) {
                schedule.push({
                  id: `lesson-${lessonId++}`,
                  date: randomDate,
                  dayOfWeek: getDayName(new Date(randomDate).getDay()),
                  startTime: randomTime.start,
                  endTime: randomTime.end,
                  subject: subject.name,
                  groupId: subject.groupId,
                  groupName: subject.groupName,
                  teacherId: subject.teacherId,
                  teacherName: subject.teacherName,
                  classroomId: classroom.id,
                  classroomName: classroom.name,
                  weekNumber: getWeekNumber(randomDate)
                });
                lessonScheduled = true;
              }
            }
            attempts++;
          }
          
          // Если не удалось запланировать с ограничениями, добавляем без них
          if (!lessonScheduled) {
            const fallbackDate = workingDates[Math.floor(Math.random() * workingDates.length)];
            const fallbackTime = generateRandomTime();
            const fallbackClassroom = getRandomClassroom(subject.roomType);
            
            if (fallbackClassroom) {
              schedule.push({
                id: `lesson-${lessonId++}`,
                date: fallbackDate,
                dayOfWeek: getDayName(new Date(fallbackDate).getDay()),
                startTime: fallbackTime.start,
                endTime: fallbackTime.end,
                subject: subject.name,
                groupId: subject.groupId,
                groupName: subject.groupName,
                teacherId: subject.teacherId,
                teacherName: subject.teacherName,
                classroomId: fallbackClassroom.id,
                classroomName: fallbackClassroom.name,
                weekNumber: getWeekNumber(fallbackDate)
              });
            }
          }
        }
      });
      
      // Сортируем по датам и времени
      schedule.sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison === 0) {
          return a.startTime.localeCompare(b.startTime);
        }
        return dateComparison;
      });
      
      setGeneratedSchedule(schedule);
      setScheduleStats({
        totalLessons: schedule.length,
        totalDays: workingDays,
        averagePerDay: (schedule.length / workingDays).toFixed(1),
        subjectsCount: subjects.length,
        teachersCount: [...new Set(subjects.map(s => s.teacherId))].length
      });
      
      setLoading(false);
      setCurrentStep(6);
    }, 2000);
  };

  // Вспомогательные функции для улучшенного алгоритма
  const getAllWorkingDates = (): string[] => {
    const start = new Date(quarterSettings.startDate);
    const end = new Date(quarterSettings.endDate);
    const workingDates: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      if (quarterSettings.workingDays.includes(dayOfWeek) && 
          !KAZAKHSTAN_HOLIDAYS_2024_2025[dateStr] && 
          !quarterSettings.customHolidays.includes(dateStr)) {
        workingDates.push(dateStr);
      }
      
      current.setDate(current.getDate() + 1);
    }

    return workingDates;
  };

  const getRandomDateForSubject = (workingDates: string[], subject: any, activePrefs: TeacherPreference[]): string | null => {
    let availableDates = [...workingDates];
    
    // Применяем фильтры по дням недели из пожеланий
    const dayPrefs = activePrefs.filter(pref => pref.type === 'day');
    if (dayPrefs.length > 0) {
      availableDates = availableDates.filter(dateStr => {
        const dayOfWeek = new Date(dateStr).getDay() === 0 ? 7 : new Date(dateStr).getDay();
        return dayPrefs.some(pref => {
          if (pref.value && Array.isArray(pref.value)) {
            // Если это предпочитаемые дни - включаем
            if (pref.title.includes('Предпочитаю')) {
              return pref.value.includes(dayOfWeek);
            }
            // Если это избегаемые дни - исключаем
            return !pref.value.includes(dayOfWeek);
          }
          return true;
        });
      });
    }
    
    return availableDates.length > 0 ? availableDates[Math.floor(Math.random() * availableDates.length)] : null;
  };

  const getRandomTimeForSubject = (subject: any, activePrefs: TeacherPreference[]) => {
    const startHour = parseInt(scheduleConstraints.workingHours.start.split(':')[0]);
    const endHour = parseInt(scheduleConstraints.workingHours.end.split(':')[0]);
    let possibleHours: number[] = [];
    
    for (let h = startHour; h < endHour; h++) {
      possibleHours.push(h);
    }

    // Применяем временные ограничения из пожеланий
    const timePrefs = activePrefs.filter(pref => pref.type === 'time');
    timePrefs.forEach(pref => {
      if (pref.title.includes('после 14:00')) {
        possibleHours = possibleHours.filter(h => h < 14);
      }
      if (pref.title.includes('с 10:00')) {
        possibleHours = possibleHours.filter(h => h >= 10);
      }
    });

    // Применяем ограничения на первые/последние уроки
    const lessonPrefs = activePrefs.filter(pref => pref.type === 'lesson');
    lessonPrefs.forEach(pref => {
      if (pref.title.includes('первым уроком')) {
        possibleHours = possibleHours.filter(h => h !== startHour);
      }
    });

    if (possibleHours.length === 0) {
      possibleHours = [startHour + 1]; // Fallback
    }
    
    const hour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const lessonEndHour = hour;
    const lessonEndMinute = scheduleConstraints.lessonDuration;
    const end = `${lessonEndHour.toString().padStart(2, '0')}:${lessonEndMinute.toString().padStart(2, '0')}`;
    
    return { start, end };
  };

  const getBestClassroomForSubject = (subject: any, activePrefs: TeacherPreference[]) => {
    const selectedRooms = MOCK_CLASSROOMS.filter(room => 
      selectedClassrooms.includes(room.id)
    );
    
    // Применяем аудиторные предпочтения
    const classroomPrefs = activePrefs.filter(pref => pref.type === 'classroom');
    let suitableRooms = [...selectedRooms];
    
    classroomPrefs.forEach(pref => {
      if (pref.title.includes('202 аудитории') && pref.value) {
        const preferredRoom = selectedRooms.find(room => room.name === pref.value);
        if (preferredRoom) {
          suitableRooms = [preferredRoom];
          return;
        }
      }
      if (pref.title.includes('первый этаж')) {
        suitableRooms = suitableRooms.filter(room => !room.name.startsWith('1'));
      }
    });

    // Ищем подходящие по типу
    let roomsByType = suitableRooms.filter(room => room.type === subject.roomType);
    
    if (roomsByType.length === 0) {
      roomsByType = suitableRooms.filter(room => room.type === 'обычный');
    }
    
    if (roomsByType.length === 0) {
      roomsByType = suitableRooms;
    }
    
    return roomsByType.length > 0 
      ? roomsByType[Math.floor(Math.random() * roomsByType.length)]
      : null;
  };

  const hasConflict = (schedule: GeneratedLesson[], date: string, time: { start: string; end: string }, teacherId: number, classroomId: number, groupId: number): boolean => {
    return schedule.some(lesson => {
      if (lesson.date !== date) return false;
      
      // Проверяем пересечение времени
      const timeOverlap = lesson.startTime === time.start || 
                         (lesson.startTime < time.start && lesson.endTime > time.start) ||
                         (lesson.startTime < time.end && lesson.endTime > time.end);
      
      if (!timeOverlap) return false;
      
      // Проверяем конфликты: один преподаватель, одна аудитория или одна группа
      return lesson.teacherId === teacherId || 
             lesson.classroomId === classroomId || 
             lesson.groupId === groupId;
    });
  };

  const generateRandomWorkingDate = () => {
    const workingDates = getAllWorkingDates();
    return workingDates.length > 0 ? workingDates[Math.floor(Math.random() * workingDates.length)] : '';
  };

  const generateRandomTime = () => {
    const startHour = parseInt(scheduleConstraints.workingHours.start.split(':')[0]);
    const endHour = parseInt(scheduleConstraints.workingHours.end.split(':')[0]);
    const possibleHours = [];
    
    for (let h = startHour; h < endHour; h++) {
      possibleHours.push(h);
    }
    
    const hour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const lessonEndHour = hour;
    const lessonEndMinute = scheduleConstraints.lessonDuration;
    const end = `${lessonEndHour.toString().padStart(2, '0')}:${lessonEndMinute.toString().padStart(2, '0')}`;
    
    return { start, end };
  };

  const getRandomClassroom = (roomType: string) => {
    // Фильтруем только выбранные аудитории
    const selectedRooms = MOCK_CLASSROOMS.filter(room => 
      selectedClassrooms.includes(room.id)
    );
    
    // Ищем подходящие по типу среди выбранных
    let suitableRooms = selectedRooms.filter(room => 
      room.type === roomType
    );
    
    // Если нет точного соответствия, используем обычные классы
    if (suitableRooms.length === 0) {
      suitableRooms = selectedRooms.filter(room => 
        room.type === 'обычный'
      );
    }
    
    // Если все еще нет подходящих, берем любую выбранную
    if (suitableRooms.length === 0) {
      suitableRooms = selectedRooms;
    }
    
    return suitableRooms.length > 0 
      ? suitableRooms[Math.floor(Math.random() * suitableRooms.length)]
      : null;
  };

  const getDayName = (dayNum: number) => {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    return days[dayNum];
  };

  const getWeekNumber = (dateStr: string) => {
    const date = new Date(dateStr);
    const start = new Date(quarterSettings.startDate);
    const diffTime = Math.abs(date.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveSchedule = async () => {
    setLoading(true);
    
    // Имитация сохранения
    setTimeout(() => {
      setLoading(false);
      alert(`Расписание успешно создано!\n\nСоздано уроков: ${generatedSchedule.length}\nПериод: ${quarterSettings.startDate} - ${quarterSettings.endDate}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full">
              <Bot className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Планирование расписания на четверть
          </h1>
          <p className="text-gray-600 text-lg">
            Автоматическое создание расписания с учетом всех ограничений и предпочтений
          </p>
        </div>

        {/* Прогресс шагов */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              
              return (
                <div key={step.num} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 hidden md:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-400 mx-2 mt-[-20px] hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Контент шагов */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AnimatePresence mode="wait">
            {/* Шаг 1: Настройка четверти */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Calendar className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Настройка четверти</h2>
                  <p className="text-gray-600">Выберите учебный период и настройте календарь</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Выбор четверти */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Учебная четверть
                    </label>
                    <div className="space-y-2">
                      {Object.entries(ACADEMIC_QUARTERS).map(([num, quarter]) => (
                        <div
                          key={num}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            quarterSettings.quarterNumber === parseInt(num)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setQuarterSettings({
                            ...quarterSettings,
                            quarterNumber: parseInt(num) as 1 | 2 | 3 | 4,
                            startDate: quarter.start,
                            endDate: quarter.end
                          })}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{quarter.label}</div>
                              <div className="text-sm text-gray-500">{quarter.description}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {quarter.start} - {quarter.end}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Рабочие дни */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Рабочие дни недели
                    </label>
                    <div className="space-y-2">
                      {[
                        { num: 1, name: 'Понедельник' },
                        { num: 2, name: 'Вторник' },
                        { num: 3, name: 'Среда' },
                        { num: 4, name: 'Четверг' },
                        { num: 5, name: 'Пятница' },
                        { num: 6, name: 'Суббота' }
                      ].map(day => (
                        <label key={day.num} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={quarterSettings.workingDays.includes(day.num)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuarterSettings({
                                  ...quarterSettings,
                                  workingDays: [...quarterSettings.workingDays, day.num]
                                });
                              } else {
                                setQuarterSettings({
                                  ...quarterSettings,
                                  workingDays: quarterSettings.workingDays.filter(d => d !== day.num)
                                });
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-gray-700">{day.name}</span>
                        </label>
                      ))}
                    </div>

                    {/* Статистика */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <div>Рабочих дней в четверти: <span className="font-medium">{getWorkingDaysCount()}</span></div>
                        <div>Учтены государственные праздники Казахстана</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={nextStep} className="px-6">
                    Далее <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 2: Выбор классов */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Выбор классов</h2>
                  <p className="text-gray-600">Выберите группы для составления расписания</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_GROUPS.map(group => (
                    <div
                      key={group.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedGroups.includes(group.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (selectedGroups.includes(group.id)) {
                          setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                        } else {
                          setSelectedGroups([...selectedGroups, group.id]);
                        }
                      }}
                    >
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{group.name}</div>
                        <div className="text-sm text-gray-500">{group.courseNumber} класс</div>
                        <div className="text-sm text-gray-500">{group.studentsCount} учеников</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Предметы выбранных классов */}
                {selectedGroups.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Предметы выбранных классов ({getSelectedSubjects().length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getSelectedSubjects().map((subject, index) => {
                        const subjectKey = `${subject.groupId}-${subject.id}`;
                        const isCustomized = customSubjectHours[subjectKey] !== undefined;
                        
                        return (
                          <div 
                            key={index} 
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              isCustomized ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => openSubjectModal(subject)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{subject.name}</div>
                                <div className="text-sm text-gray-500">
                                  {subject.groupName} • {subject.teacherName}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className={`text-xs font-medium ${
                                    isCustomized ? 'text-blue-600' : 'text-gray-600'
                                  }`}>
                                    {subject.hoursPerWeek} ч/нед
                                  </div>
                                  {isCustomized && (
                                    <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                                      изменено
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Edit3 className="h-4 w-4 text-gray-400" />
                                <BookOpen className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Назад
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    disabled={selectedGroups.length === 0}
                    className="px-6"
                  >
                    Далее <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 3: Выбор аудиторий */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Building className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Выбор аудиторий</h2>
                  <p className="text-gray-600">Выберите доступные аудитории для проведения занятий</p>
                </div>

                {/* Группировка по корпусам */}
                <div className="space-y-6">
                  {Array.from(new Set(MOCK_CLASSROOMS.map(c => c.building))).map(building => (
                    <div key={building}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <Building className="h-5 w-5 mr-2 text-gray-600" />
                          {building}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {MOCK_CLASSROOMS.filter(c => c.building === building && selectedClassrooms.includes(c.id)).length} из {MOCK_CLASSROOMS.filter(c => c.building === building).length} выбрано
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MOCK_CLASSROOMS
                          .filter(classroom => classroom.building === building)
                          .map(classroom => (
                            <div
                              key={classroom.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedClassrooms.includes(classroom.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                if (selectedClassrooms.includes(classroom.id)) {
                                  setSelectedClassrooms(selectedClassrooms.filter(id => id !== classroom.id));
                                } else {
                                  setSelectedClassrooms([...selectedClassrooms, classroom.id]);
                                }
                              }}
                            >
                              <div className="text-center">
                                <div className="text-xl font-bold text-gray-900">{classroom.name}</div>
                                <div className="text-sm text-gray-500 capitalize">{classroom.type}</div>
                                <div className="text-sm text-gray-500">до {classroom.capacity} мест</div>
                                <div className="text-xs text-gray-400 mt-1">{classroom.description}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>

                {/* Статистика по типам аудиторий */}
                {selectedClassrooms.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Выбранные аудитории ({selectedClassrooms.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from(new Set(MOCK_CLASSROOMS.filter(c => selectedClassrooms.includes(c.id)).map(c => c.type))).map(type => {
                        const count = MOCK_CLASSROOMS.filter(c => selectedClassrooms.includes(c.id) && c.type === type).length;
                        return (
                          <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{count}</div>
                            <div className="text-sm text-gray-600 capitalize">{type}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Назад
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    disabled={selectedClassrooms.length === 0}
                    className="px-6"
                  >
                    Далее <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 4: Ограничения */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Settings className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ограничения и правила</h2>
                  <p className="text-gray-600">Настройте параметры составления расписания</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Рабочее время */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Рабочее время</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Начало дня</label>
                        <input
                          type="time"
                          value={scheduleConstraints.workingHours.start}
                          onChange={(e) => setScheduleConstraints({
                            ...scheduleConstraints,
                            workingHours: { ...scheduleConstraints.workingHours, start: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Конец дня</label>
                        <input
                          type="time"
                          value={scheduleConstraints.workingHours.end}
                          onChange={(e) => setScheduleConstraints({
                            ...scheduleConstraints,
                            workingHours: { ...scheduleConstraints.workingHours, end: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Макс. уроков в день</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={scheduleConstraints.maxLessonsPerDay}
                        onChange={(e) => setScheduleConstraints({
                          ...scheduleConstraints,
                          maxLessonsPerDay: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Длительность урока (мин)</label>
                        <input
                          type="number"
                          min="30"
                          max="60"
                          value={scheduleConstraints.lessonDuration}
                          onChange={(e) => setScheduleConstraints({
                            ...scheduleConstraints,
                            lessonDuration: parseInt(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Перемена (мин)</label>
                        <input
                          type="number"
                          min="5"
                          max="20"
                          value={scheduleConstraints.breakDuration}
                          onChange={(e) => setScheduleConstraints({
                            ...scheduleConstraints,
                            breakDuration: parseInt(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Предпочтения */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Предпочтения</h3>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Не ставить первым уроком:
                      </label>
                      <div className="space-y-1">
                        {['Физкультура', 'Труд', 'ИЗО', 'Музыка'].map(subject => (
                          <label key={subject} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={scheduleConstraints.noFirstLessonSubjects.includes(subject)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    noFirstLessonSubjects: [...scheduleConstraints.noFirstLessonSubjects, subject]
                                  });
                                } else {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    noFirstLessonSubjects: scheduleConstraints.noFirstLessonSubjects.filter(s => s !== subject)
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{subject}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Не ставить последним уроком:
                      </label>
                      <div className="space-y-1">
                        {['Математика', 'Русский язык', 'История'].map(subject => (
                          <label key={subject} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={scheduleConstraints.noLastLessonSubjects.includes(subject)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    noLastLessonSubjects: [...scheduleConstraints.noLastLessonSubjects, subject]
                                  });
                                } else {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    noLastLessonSubjects: scheduleConstraints.noLastLessonSubjects.filter(s => s !== subject)
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{subject}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Назад
                  </Button>
                  <Button onClick={nextStep} className="px-6">
                    Далее <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 5: Генерация */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Bot className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Генерация расписания</h2>
                  <p className="text-gray-600">Проверьте настройки и запустите создание расписания</p>
                </div>

                {/* Сводка настроек */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Сводка настроек:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Период</h4>
                      <div className="text-gray-600">
                        <div>{ACADEMIC_QUARTERS[quarterSettings.quarterNumber].label}</div>
                        <div>{quarterSettings.startDate} - {quarterSettings.endDate}</div>
                        <div>{getWorkingDaysCount()} рабочих дней</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Классы</h4>
                      <div className="text-gray-600">
                        <div>{selectedGroups.length} групп</div>
                        <div>{getSelectedSubjects().length} предметов</div>
                        <div>{[...new Set(getSelectedSubjects().map(s => s.teacherId))].length} преподавателей</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Аудитории</h4>
                      <div className="text-gray-600">
                        <div>{selectedClassrooms.length} аудиторий</div>
                        <div>{Array.from(new Set(MOCK_CLASSROOMS.filter(c => selectedClassrooms.includes(c.id)).map(c => c.building))).length} корпуса</div>
                        <div>{Array.from(new Set(MOCK_CLASSROOMS.filter(c => selectedClassrooms.includes(c.id)).map(c => c.type))).length} типов</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Ограничения</h4>
                      <div className="text-gray-600">
                        <div>{scheduleConstraints.workingHours.start} - {scheduleConstraints.workingHours.end}</div>
                        <div>Макс. {scheduleConstraints.maxLessonsPerDay} уроков/день</div>
                        <div>Урок {scheduleConstraints.lessonDuration} мин</div>
                      </div>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <Loading text="Создаем оптимальное расписание..." />
                    <div className="mt-4 text-sm text-gray-500">
                      Анализируем ограничения и размещаем уроки...
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      onClick={generateSchedule}
                      className="px-8 py-3 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      <Shuffle className="h-5 w-5 mr-2" />
                      Сгенерировать расписание
                    </Button>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep} disabled={loading}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Назад
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 6: Интерактивная сетка расписания */}
            {currentStep === 6 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <Eye className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Интерактивная сетка расписания</h2>
                  <p className="text-gray-600">Перемещайте уроки методом drag & drop для корректировки расписания</p>
                </div>

                {/* Статистика */}
                {scheduleStats && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{scheduleStats.totalLessons}</div>
                        <div className="text-sm text-gray-600">Всего уроков</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{scheduleStats.totalDays}</div>
                        <div className="text-sm text-gray-600">Рабочих дней</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{scheduleStats.averagePerDay}</div>
                        <div className="text-sm text-gray-600">Уроков/день</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{scheduleStats.subjectsCount}</div>
                        <div className="text-sm text-gray-600">Предметов</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{scheduleStats.teachersCount}</div>
                        <div className="text-sm text-gray-600">Преподавателей</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Кнопка полноэкранного режима */}
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Maximize className="h-4 w-4" />
                    <span>На весь экран</span>
                  </Button>
                </div>

                {/* Интерактивная сетка расписания */}
                <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '70vh' }}>
                  <ScheduleGrid
                    lessons={generatedSchedule}
                    onUpdateLessons={(updatedLessons) => {
                      // Преобразуем ScheduleLesson[] обратно в GeneratedLesson[]
                      const convertedLessons = updatedLessons.map(lesson => ({
                        ...lesson,
                        dayOfWeek: getDayName(new Date(lesson.date).getDay()),
                        weekNumber: getWeekNumber(lesson.date)
                      }));
                      setGeneratedSchedule(convertedLessons);
                    }}
                    quarterSettings={{
                      startDate: quarterSettings.startDate,
                      endDate: quarterSettings.endDate,
                      workingDays: quarterSettings.workingDays,
                    }}
                    workingHours={scheduleConstraints.workingHours}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(4)}>
                    <Shuffle className="h-4 w-4 mr-2" /> Перегенерировать
                  </Button>
                  <Button onClick={nextStep} className="px-6 bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Сохранить расписание
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 7: Сохранение */}
            {currentStep === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Save className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Сохранение в базу данных</h2>
                  <p className="text-gray-600">Применяем созданное расписание к системе</p>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <Loading text="Сохраняем расписание..." />
                    <div className="mt-4 text-sm text-gray-500">
                      Создаем записи в базе данных...
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                      <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                      <h3 className="font-medium text-yellow-800 mb-2">Внимание!</h3>
                      <p className="text-yellow-700 text-sm">
                        Это действие создаст {generatedSchedule.length} записей в базе данных.
                        Убедитесь, что расписание проверено и готово к использованию.
                      </p>
                    </div>

                    <Button
                      onClick={saveSchedule}
                      className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Применить к базе данных
                    </Button>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep} disabled={loading}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Назад
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Полноэкранный модал для расписания */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="h-full flex flex-col">
              {/* Заголовок полноэкранного режима */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Eye className="h-6 w-6 text-blue-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Интерактивная сетка расписания
                    </h2>
                    <p className="text-sm text-gray-600">
                      {ACADEMIC_QUARTERS[quarterSettings.quarterNumber].label} • 
                      {generatedSchedule.length} уроков • 
                      {[...new Set(generatedSchedule.map(l => l.teacherId))].length} преподавателей
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsFullscreen(false)}
                  className="flex items-center space-x-2"
                >
                  <Minimize className="h-4 w-4" />
                  <span>Выйти из полноэкранного режима</span>
                </Button>
              </div>

              {/* Статистика в полноэкранном режиме */}
              {scheduleStats && (
                <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                  <div className="flex items-center justify-center space-x-8 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">
                        {scheduleStats.totalLessons} уроков создано
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        {scheduleStats.averagePerDay} уроков/день
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        {scheduleStats.teachersCount} преподавателей
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        {selectedClassrooms.length} аудиторий
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Полноэкранная сетка расписания */}
              <div className="flex-1 p-4">
                <style>
                  {`
                    .schedule-container-with-scrollbar {
                      overflow: scroll !important;
                      scrollbar-width: thin !important;
                      scrollbar-color: #9CA3AF #F3F4F6 !important;
                    }
                    .schedule-container-with-scrollbar::-webkit-scrollbar {
                      width: 12px !important;
                      height: 12px !important;
                    }
                    .schedule-container-with-scrollbar::-webkit-scrollbar-track {
                      background: #F3F4F6 !important;
                      border-radius: 6px !important;
                    }
                    .schedule-container-with-scrollbar::-webkit-scrollbar-thumb {
                      background: #9CA3AF !important;
                      border-radius: 6px !important;
                    }
                    .schedule-container-with-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #6B7280 !important;
                    }
                    .schedule-container-with-scrollbar::-webkit-scrollbar-corner {
                      background: #F3F4F6 !important;
                    }
                  `}
                </style>
                <div 
                  className="schedule-container-with-scrollbar h-full border rounded-lg bg-white shadow-sm"
                  style={{
                    overflow: 'scroll',
                    minHeight: '600px',
                    maxHeight: '80vh'
                  }}
                >
                  <ScheduleGrid
                    lessons={generatedSchedule}
                    onUpdateLessons={(updatedLessons) => {
                      // Преобразуем ScheduleLesson[] обратно в GeneratedLesson[]
                      const convertedLessons = updatedLessons.map(lesson => ({
                        ...lesson,
                        dayOfWeek: getDayName(new Date(lesson.date).getDay()),
                        weekNumber: getWeekNumber(lesson.date)
                      }));
                      setGeneratedSchedule(convertedLessons);
                    }}
                    quarterSettings={{
                      startDate: quarterSettings.startDate,
                      endDate: quarterSettings.endDate,
                      workingDays: quarterSettings.workingDays,
                    }}
                    workingHours={scheduleConstraints.workingHours}
                  />
                </div>
              </div>

              {/* Панель управления в полноэкранном режиме */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    💡 Совет: Перетаскивайте уроки для изменения времени или даты
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFullscreen(false);
                      setCurrentStep(5);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Shuffle className="h-4 w-4" />
                    <span>Перегенерировать</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsFullscreen(false);
                      setCurrentStep(7);
                    }}
                    className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Сохранить расписание</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно редактирования предмета */}
        {showSubjectModal && selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-0 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Настройка предмета</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedSubject.name} • {selectedSubject.groupName} • {selectedSubject.teacherName}
                  </div>
                </div>
                <button
                  onClick={closeSubjectModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Вкладки */}
              <div className="flex border-b">
                <button
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeModalTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveModalTab('details')}
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Детали предмета
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeModalTab === 'preferences'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveModalTab('preferences')}
                >
                  <Heart className="h-4 w-4 inline mr-2" />
                  Пожелания педагога
                  {getActivePreferencesCount(selectedSubject.teacherId) > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {getActivePreferencesCount(selectedSubject.teacherId)}
                    </span>
                  )}
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Содержимое вкладки "Детали предмета" */}
                {activeModalTab === 'details' && (
                  <div className="space-y-4">
                    {/* Информация о предмете */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Предмет</div>
                          <div className="font-medium">{selectedSubject.name}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Преподаватель</div>
                          <div className="font-medium">{selectedSubject.teacherName}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Группа</div>
                          <div className="font-medium">{selectedSubject.groupName}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Тип аудитории</div>
                          <div className="font-medium capitalize">{selectedSubject.roomType}</div>
                        </div>
                      </div>
                    </div>

                    {/* Редактирование часов */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Часов в неделю
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          min="1"
                          max="8"
                          defaultValue={selectedSubject.hoursPerWeek}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value);
                            if (!isNaN(hours) && hours > 0 && hours <= 8) {
                              const subjectKey = `${selectedSubject.groupId}-${selectedSubject.id}`;
                              updateSubjectHours(subjectKey, hours);
                              
                              setSelectedSubject({
                                ...selectedSubject,
                                hoursPerWeek: hours
                              });
                            }
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="text-sm text-gray-500">
                          Стандартно: {MOCK_SUBJECTS[selectedSubject.groupId]?.find(s => s.id === selectedSubject.id)?.hoursPerWeek || selectedSubject.hoursPerWeek} ч/нед
                        </div>
                      </div>
                    </div>

                    {/* Заметки */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Заметки
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Особые требования или заметки по предмету..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled
                      />
                      <div className="mt-1 text-xs text-gray-400">
                        Функция будет добавлена в будущих версиях
                      </div>
                    </div>
                  </div>
                )}

                {/* Содержимое вкладки "Пожелания педагога" */}
                {activeModalTab === 'preferences' && (
                  <div className="space-y-6">
                    <div className="text-center py-4">
                      <User className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900">
                        Пожелания: {selectedSubject.teacherName}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Настройте ограничения и предпочтения для составления расписания
                      </p>
                    </div>

                    {/* Группировка пожеланий по типам */}
                    {[
                      { type: 'time', title: '⏰ Временные ограничения', icon: Clock },
                      { type: 'day', title: '📅 Предпочтения по дням', icon: Calendar },
                      { type: 'lesson', title: '📚 Ограничения по урокам', icon: BookOpen },
                      { type: 'classroom', title: '🏫 Аудиторные предпочтения', icon: Building },
                      { type: 'special', title: '⭐ Особые требования', icon: Star }
                    ].map(category => {
                      const categoryPrefs = getTeacherPreferences(selectedSubject.teacherId)
                        .filter(pref => pref.type === category.type);
                      const activeCount = categoryPrefs.filter(pref => pref.enabled).length;
                      
                      return (
                        <div key={category.type} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900 flex items-center">
                              {category.title}
                            </h5>
                            {activeCount > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                {activeCount} активно
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {categoryPrefs.map(preference => (
                              <div key={preference.id} className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  id={preference.id}
                                  checked={preference.enabled}
                                  onChange={(e) => updateTeacherPreference(
                                    selectedSubject.teacherId, 
                                    preference.id, 
                                    e.target.checked
                                  )}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                />
                                <label htmlFor={preference.id} className="flex-1">
                                  <div className={`text-sm font-medium ${
                                    preference.enabled ? 'text-gray-900' : 'text-gray-600'
                                  }`}>
                                    {preference.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {preference.description}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Статистика пожеланий */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-blue-500 mr-2" />
                        <div className="text-sm">
                          <div className="font-medium text-blue-900">
                            Активно пожеланий: {getActivePreferencesCount(selectedSubject.teacherId)} из {getTeacherPreferences(selectedSubject.teacherId).length}
                          </div>
                          <div className="text-blue-700">
                            Алгоритм будет учитывать эти ограничения при составлении расписания
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                <div className="text-sm text-gray-500">
                  {activeModalTab === 'preferences' && (
                    <>Пожелания сохраняются автоматически</>
                  )}
                  {activeModalTab === 'details' && (
                    <>Изменения применяются к расписанию</>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={closeSubjectModal}>
                    Закрыть
                  </Button>
                  <Button onClick={closeSubjectModal}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Готово
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISchedulePage;
