/* eslint-disable @typescript-eslint/no-explicit-any */
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
import scheduleService from '../services/scheduleService';
import { GroupOption, ClassroomOption, TeacherOption, StudyPlanOption } from '../types/schedule';
import { GenerationParams as FlowGenerationParams, DraftItem, OptimizedScheduleResponse, ApplyResponse } from '../types/aiScheduleFlow';

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

// Динамическое построение четвертей учебного года
// baseYear = год начала учебного года (сентябрь baseYear – май baseYear+1)
const buildAcademicQuarters = (baseYear: number) => ({
  1: {
    label: '1 четверть',
    // Обычно старт со 2 сентября (1-е – День знаний/церемонии)
    start: `${baseYear}-09-02`,
    // Конец аналогично прежней структуре: последняя неделя октября (берём ту же дату сдвига)
    end: `${baseYear}-10-27`,
    description: 'Сентябрь - Октябрь (8-9 недель)'
  },
  2: {
    label: '2 четверть',
    start: `${baseYear}-11-05`,
    end: `${baseYear}-12-22`,
    description: 'Ноябрь - Декабрь (7-8 недель)'
  },
  3: {
    label: '3 четверть',
    start: `${baseYear + 1}-01-09`,
    end: `${baseYear + 1}-03-16`,
    description: 'Январь - Март (9-10 недель)'
  },
  4: {
    label: '4 четверть',
    start: `${baseYear + 1}-04-01`,
    end: `${baseYear + 1}-05-25`,
    description: 'Апрель - Май (7-8 недель)'
  }
});

// Определяем текущий учебный год: если сейчас август (7) или позже — baseYear = текущий, иначе предыдущий
const NOW = new Date();
const CURRENT_BASE_YEAR = NOW.getMonth() >= 7 ? NOW.getFullYear() : NOW.getFullYear() - 1;
const ACADEMIC_QUARTERS = buildAcademicQuarters(CURRENT_BASE_YEAR);

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
  studyPlanId: number;
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
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlanOption[]>([]);

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
  const [flowDraft, setFlowDraft] = useState<DraftItem[] | null>(null);
  const [flowOptimized, setFlowOptimized] = useState<OptimizedScheduleResponse | null>(null);
  const [flowValidation, setFlowValidation] = useState<any>(null);
  // Существующее расписание для выбранных групп (для подсветки конфликтов)
  const [existingLessons, setExistingLessons] = useState<any[]>([]);
  // Переключатель отображения недели A/B для biweekly шаблонов
  const [biweeklyView, setBiweeklyView] = useState<'A' | 'B'>('A');

  // Состояние для кастомизации предметов
  const [customSubjectHours, setCustomSubjectHours] = useState<{ [key: string]: number }>({});
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'preferences'>('details');

  // Состояние для пожеланий педагогов
  const [teacherPreferences, setTeacherPreferences] = useState<{ [key: string]: TeacherPreference[] }>({});

  // Bulk выбор и настройка предметов (шаг 2)
  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState<string[]>([]);
  const [bulkHours, setBulkHours] = useState<number>(1);

  // Состояние для полноэкранного режима
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Обновляем границы четверти если изменился базовый учебный год (перезагрузка осенью)
  useEffect(() => {
    setQuarterSettings(prev => {
      const q = ACADEMIC_QUARTERS[prev.quarterNumber];
      // Если год в startDate не совпадает с актуальным baseYear — обновляем
      if (!prev.startDate.startsWith(String(CURRENT_BASE_YEAR))) {
        return { ...prev, startDate: q.start, endDate: q.end };
      }
      return prev;
    });
  }, [CURRENT_BASE_YEAR]);

  // Загрузка реальных данных
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, c, t, spRaw] = await Promise.all([
          scheduleService.getGroups(),
          scheduleService.getClassrooms(),
          scheduleService.getTeachers(),
          scheduleService.getStudyPlans({ limit: 999 })
        ]);
        if (cancelled) return;
        const spArray = Array.isArray(spRaw)
          ? spRaw
          : Array.isArray((spRaw as any)?.items)
            ? (spRaw as any).items
            : [];
        setGroups(g);
        setClassrooms(c);
        setTeachers(t);
        setStudyPlans(spArray as any);
      } catch (_) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Перезагрузка списка учебных планов при изменении выбранных групп, чтобы гарантировать что multi-group планы подтягиваются для каждой группы
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedGroups.length) return; // ничего не делаем если нет выбора
      try {
        const promises = selectedGroups.map(gid => scheduleService.getStudyPlans({ groupId: gid, limit: 500 }));
        const results = await Promise.all(promises);
        if (cancelled) return;
        // Плоский список; дубли (один и тот же plan для разных групп) сохраняем как отдельные записи с уникальным составным id
        const merged: any[] = [];
        const seen = new Set<string>();
        for (const list of results) {
          for (const sp of list) {
            const key = `${sp.id}-${sp.groupId}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(sp);
          }
        }
        // Сохраняем вместе с уже загруженными (если хотим объединить) или заменяем; заменяем чтобы убрать старые нерелевантные
        setStudyPlans(merged as any);
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [selectedGroups]);

  // Подгружаем существующее расписание по выбранным группам при переходе к шагам генерации/валидации
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (selectedGroups.length === 0) {
        setExistingLessons([]);
        return;
      }
      try {
        // Получаем все записи (без пагинации) и фильтруем по диапазону четверти
        const raw = await scheduleService.getScheduleForUser('ADMIN');
        if (cancelled) return;
        const arr = Array.isArray(raw) ? raw : (raw as any).items || [];
        const filtered = arr.filter((it: any) => selectedGroups.includes(Number(it.classId)) || selectedGroups.includes(Number(it.groupId)));
        // Преобразуем к формату ScheduleLesson, стараемся сохранить id и поля
        const toLesson = (it: any) => ({
          id: `exist-${it.id}`,
          date: it.date || it.startDate || quarterSettings.startDate,
          startTime: it.startTime,
          endTime: it.endTime,
          subject: it.subject || 'Предмет',
          groupId: Number(it.groupId || it.classId) || 0,
          groupName: String(it.classId || it.groupName || it.groupId || ''),
          teacherId: Number(it.teacherId) || 0,
          teacherName: it.teacherName || '',
          classroomId: it.classroomId ? Number(it.classroomId) : undefined,
          classroomName: it.roomId || it.classroomName,
          color: undefined
        });
        setExistingLessons(filtered.map(toLesson));
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [selectedGroups, quarterSettings.startDate, quarterSettings.endDate]);

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
    const selectedGroupObjs = groups.filter(g => selectedGroups.includes(g.id));
    const selectedGroupIds = new Set(selectedGroupObjs.map(g => g.id));
    const selectedGroupNames = new Set(
      selectedGroupObjs.map(g => (g.name || '').trim().toLowerCase())
    );

    const selected = (studyPlans as any[]).filter((sp: any) => {
      // 1) Прямой groupId
      const directGroupId: number | undefined =
        typeof sp.groupId === 'number' ? sp.groupId : undefined;
      if (directGroupId && selectedGroupIds.has(directGroupId)) return true;

      // 2) Одиночный вложенный объект группы
      if (sp.group && !Array.isArray(sp.group)) {
        const nestedGroupId: number | undefined =
          typeof sp.group?.id === 'number' ? sp.group.id : undefined;
        if (nestedGroupId && selectedGroupIds.has(nestedGroupId)) return true;

        const nameFromSingle = (sp.group?.name || '').trim().toLowerCase();
        if (nameFromSingle && selectedGroupNames.has(nameFromSingle)) return true;
      }

      // 3) Массив групп от бэкенда
      if (Array.isArray(sp.group) && sp.group.length) {
        const hasById = sp.group.some((g: any) => typeof g?.id === 'number' && selectedGroupIds.has(g.id));
        if (hasById) return true;

        const hasByName = sp.group.some((g: any) => {
          const nm = (g?.name || '').trim().toLowerCase();
          return nm && selectedGroupNames.has(nm);
        });
        if (hasByName) return true;
      }

      // 4) Совпадение по groupName (fallback)
      const nameFromPlan: string = (sp.groupName || '').trim().toLowerCase();
      if (nameFromPlan && selectedGroupNames.has(nameFromPlan)) return true;

      return false;
    });

    return selected.map((sp: any) => {
      const t = teachers.find(tt => tt.id === sp.teacherId);

      // Разрешаем корректный groupId/имя для карточки
      let resolvedGroup: GroupOption | undefined;

      if (typeof sp.groupId === 'number') {
        resolvedGroup = groups.find(g => g.id === sp.groupId);
      } else if (sp.group && !Array.isArray(sp.group) && typeof sp.group.id === 'number') {
        resolvedGroup = groups.find(g => g.id === sp.group.id);
      } else if (Array.isArray(sp.group) && sp.group.length) {
        // берём первый совпавший по id, иначе по имени, иначе по groupName
        resolvedGroup =
          sp.group.map((g: any) => groups.find(gr => gr.id === g?.id)).find(Boolean) ||
          sp.group.map((g: any) =>
            groups.find(gr => (gr.name || '').trim().toLowerCase() === (g?.name || '').trim().toLowerCase())
          ).find(Boolean) ||
          (sp.groupName
            ? groups.find(gr => (gr.name || '').trim().toLowerCase() === sp.groupName.trim().toLowerCase())
            : undefined);
      } else if (sp.groupName) {
        resolvedGroup = groups.find(g => (g.name || '').trim().toLowerCase() === sp.groupName.trim().toLowerCase());
      }

      const resolvedGroupId =
        resolvedGroup?.id ??
        (typeof sp.groupId === 'number' ? sp.groupId : undefined) ??
        (sp.group && !Array.isArray(sp.group) && typeof sp.group.id === 'number' ? sp.group.id : undefined) ??
        (Array.isArray(sp.group)
          ? (sp.group.find((g: any) => typeof g?.id === 'number')?.id as number | undefined)
          : undefined);

      const groupName =
        resolvedGroup?.name ??
        sp.groupName ??
        (sp.group && !Array.isArray(sp.group) ? sp.group?.name : undefined) ??
        (Array.isArray(sp.group) ? sp.group.find((g: any) => g?.name)?.name : undefined) ??
        `Group#${resolvedGroupId ?? '—'}`;

      return {
        id: sp.id,
        name: sp.name,
        teacherId: sp.teacherId,
        teacherName: t ? `${t.name} ${t.surname}` : `Teacher #${sp.teacherId}`,
        groupId: resolvedGroupId,
        groupName,
        // Часы — только для интерфейса
        hoursPerWeek: customSubjectHours[`${resolvedGroupId}-${sp.id}`] || 1
      };
    });
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
    setCustomSubjectHours(prev => ({
      ...prev,
      [subjectKey]: hours
    }));
  };

  // Helpers for bulk selection/actions
  const toggleSubjectSelected = (key: string) => {
    setSelectedSubjectKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const selectAllSubjects = () => {
    const keys = getSelectedSubjects().map((sp: any) => `${sp.groupId}-${sp.id}`);
    setSelectedSubjectKeys(keys);
  };
  const clearSubjectSelection = () => setSelectedSubjectKeys([]);
  const applyBulkHours = () => {
    if (!Number.isFinite(bulkHours) || bulkHours < 1 || bulkHours > 8) return;
    setCustomSubjectHours(prev => {
      const next = { ...prev };
      for (const sp of getSelectedSubjects()) {
        const key = `${sp.groupId}-${sp.id}`;
        if (selectedSubjectKeys.includes(key)) {
          next[key] = bulkHours;
        }
      }
      return next;
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

    demoSchedule.push(...demoLessons.map(dl => ({ ...dl, studyPlanId: 0 })));

    return demoSchedule;
  };

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const subjectHours: Record<number, number> = Object.fromEntries(
        Object.entries(customSubjectHours)
          .map(([k, v]) => {
            const parts = String(k).split('-');
            const spId = Number(parts[1]);
            return [spId, Number(v)];
          })
          .filter(([spId, hours]) => Number.isFinite(spId as number) && Number.isFinite(hours as number) && (hours as number) > 0 && (hours as number) <= 8)
      );
      const params: FlowGenerationParams = {
        startDate: quarterSettings.startDate,
        endDate: quarterSettings.endDate,
        groupIds: selectedGroups,
        constraints: {
          workingHours: scheduleConstraints.workingHours,
          maxConsecutiveHours: Math.min(4, scheduleConstraints.maxLessonsPerDay),
          preferredBreaks: [12],
          excludeWeekends: !quarterSettings.workingDays.includes(6),
          minBreakDuration: scheduleConstraints.breakDuration
        },
        subjectHours,
        generationType: 'full'
      };

      const draftRes = await scheduleService.flowDraft(params);
      // Просим локальный оптимизатор вернуть шаблоны + debug логи
      params.debug = true;
      const optimized: OptimizedScheduleResponse = await scheduleService.flowOptimizeLocal({ draft: draftRes.draft, params });
      setFlowDraft(draftRes.draft);
      setFlowOptimized(optimized);
      const validation = await scheduleService.flowValidate(optimized);
      setFlowValidation(validation);
      // Если есть recurringTemplates — строим одну неделю из шаблонов
      let weekLessons: GeneratedLesson[] = [];
      if (optimized.recurringTemplates?.length) {
        const templates = optimized.recurringTemplates;
        const startDateObj = new Date(params.startDate + 'T00:00:00');
        const startDow = startDateObj.getDay(); // 0=Sun..6
        const monday = new Date(startDateObj);
        const offset = (startDow + 6) % 7; // количество дней назад до понедельника
        monday.setDate(monday.getDate() - offset);
        const dateMap = new Map<number, string>();
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dow = d.getDay() === 0 ? 7 : d.getDay();
          dateMap.set(dow, d.toISOString().split('T')[0]);
        }
        templates.forEach((tpl, idx) => {
          const date = dateMap.get(tpl.dayOfWeek) || params.startDate;
          const teacher = teachers.find(t => t.id === tpl.teacherId);
          const group = groups.find(g => g.id === tpl.groupId);
          weekLessons.push({
            id: `tpl-${tpl.groupId}-${tpl.subject}-${tpl.dayOfWeek}-${idx}`,
            date,
            dayOfWeek: getDayNameFromDateStr(date),
            startTime: tpl.startTime,
            endTime: tpl.endTime,
            subject: tpl.subject,
            studyPlanId: tpl.studyPlanId || 0,
            groupId: tpl.groupId,
            groupName: group?.name || `Group#${tpl.groupId}`,
            teacherId: tpl.teacherId,
            teacherName: teacher ? `${teacher.name} ${teacher.surname}` : `Teacher#${tpl.teacherId}`,
            classroomId: tpl.roomId ? Number(tpl.roomId) : undefined,
            classroomName: tpl.roomId ? String(tpl.roomId) : undefined,
            weekNumber: 1
          });
        });
        // Добавляем singleOccurrences попадающие в эту неделю
        if (optimized.singleOccurrences?.length) {
          const singles = optimized.singleOccurrences;
          const weekDateSet = new Set(Array.from(dateMap.values()));
          singles.filter(s => weekDateSet.has(s.date)).forEach((s, idx) => {
            const teacher = teachers.find(t => t.id === s.teacherId);
            const group = groups.find(g => g.id === s.groupId);
            weekLessons.push({
              id: `single-${s.groupId}-${s.subject}-${s.date}-${idx}`,
              date: s.date,
              dayOfWeek: getDayNameFromDateStr(s.date),
              startTime: s.startTime,
              endTime: s.endTime,
              subject: s.subject,
              studyPlanId: s.studyPlanId || 0,
              groupId: s.groupId,
              groupName: group?.name || `Group#${s.groupId}`,
              teacherId: s.teacherId,
              teacherName: teacher ? `${teacher.name} ${teacher.surname}` : `Teacher#${s.teacherId}`,
              classroomId: s.roomId ? Number(s.roomId) : undefined,
              classroomName: s.roomId ? String(s.roomId) : undefined,
              weekNumber: 1
            });
          });
        }
      } else {
        weekLessons = (optimized.generatedSchedule || []).map((l, idx) => {
          const teacher = teachers.find(tt => tt.id === l.teacherId);
          const group = groups.find(g => g.id === l.groupId);
          const room = l.classroomId ? classrooms.find(c => c.id === l.classroomId) : undefined;
          return {
            id: `gen-${idx}-${l.date}-${l.startTime}-${l.groupId}`,
            date: l.date,
            dayOfWeek: getDayNameFromDateStr(l.date),
            startTime: l.startTime,
            endTime: l.endTime,
            subject: l.subject,
            studyPlanId: 0,
            groupId: l.groupId,
            groupName: group?.name || `Group#${l.groupId}`,
            teacherId: l.teacherId || 0,
            teacherName: teacher ? `${teacher.name} ${teacher.surname}` : (l.teacherId ? `Teacher#${l.teacherId}` : ''),
            classroomId: l.classroomId || undefined,
            classroomName: room?.name,
            weekNumber: getWeekNumber(l.date)
          };
        });
      }

      weekLessons.sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        if (dc !== 0) return dc;
        return a.startTime.localeCompare(b.startTime);
      });

      setGeneratedSchedule(weekLessons);
      const workingDates = getAllWorkingDates();
      setScheduleStats({
        totalLessons: weekLessons.length,
        totalDays: workingDates.length,
        averagePerDay: (weekLessons.length / Math.max(1, workingDates.length)).toFixed(1),
        subjectsCount: weekLessons.length ? new Set(weekLessons.map(s => s.subject)).size : 0,
        teachersCount: weekLessons.length ? new Set(weekLessons.map(s => s.teacherId)).size : 0
      });
      setCurrentStep(6);
    } catch (e) {
      console.error(e);
      alert('Ошибка генерации расписания');
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательные функции для улучшенного алгоритма
  const getAllWorkingDates = (): string[] => {
    const start = parseYMDUtc(quarterSettings.startDate);
    const end = parseYMDUtc(quarterSettings.endDate);
    const working: string[] = [];
    let cursor = new Date(start.getTime());
    while (cursor.getTime() <= end.getTime()) {
      const dow = cursor.getUTCDay() === 0 ? 7 : cursor.getUTCDay();
      const dateStr = cursor.toISOString().split('T')[0];
      if (quarterSettings.workingDays.includes(dow) &&
        !KAZAKHSTAN_HOLIDAYS_2024_2025[dateStr] &&
        !quarterSettings.customHolidays.includes(dateStr)) {
        working.push(dateStr);
      }
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    return working;
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
    const selectedRooms = classrooms.filter(room =>
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
    const selectedRooms = classrooms.filter(room =>
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

  // UTC безопасный парсер YYYY-MM-DD -> Date
  const parseYMDUtc = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  };

  const getDayNameFromDateStr = (dateStr: string) => {
    const dt = parseYMDUtc(dateStr);
    return getDayName(dt.getUTCDay());
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

  // Готовим weekly-паттерны (уникальные day/time/ids) вместо разворота по датам
  const getWeeklyPatterns = () => {
    const map = new Map<string, {
      studyPlanId: number;
      groupId: number;
      teacherId: number;
      classroomId?: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>();

    for (const lesson of generatedSchedule) {
      const dow0 = new Date(lesson.date).getDay(); // 0..6
      const dayOfWeek = dow0 === 0 ? 7 : dow0; // 1..7
      const key = `${dayOfWeek}|${lesson.startTime}|${lesson.endTime}|${lesson.studyPlanId}|${lesson.groupId}|${lesson.teacherId}|${lesson.classroomId ?? ''}`;
      if (!map.has(key)) {
        map.set(key, {
          studyPlanId: lesson.studyPlanId,
          groupId: lesson.groupId,
          teacherId: lesson.teacherId,
          classroomId: lesson.classroomId || undefined,
          dayOfWeek,
          startTime: lesson.startTime,
          endTime: lesson.endTime
        });
      }
    }
    return Array.from(map.values());
  };

  const saveSchedule = async () => {
    if (!flowOptimized) {
      alert('Нет данных оптимизации для сохранения');
      return;
    }
    setLoading(true);
    try {
      const res: ApplyResponse = await scheduleService.flowApply(flowOptimized);
      const created = typeof res?.createdCount === 'number'
        ? res.createdCount
        : Array.isArray(res?.created) ? res.created.length : 0;
      alert(`Сохранено записей: ${created}`);
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения расписания');
    } finally {
      setLoading(false);
    }
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${isCompleted ? 'bg-green-500 text-white' :
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
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${quarterSettings.quarterNumber === parseInt(num)
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
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedGroups.includes(group.id)
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
                        <div className="text-sm text-gray-500">{group.courseNumber ?? ''} класс</div>
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

                    {/* Панель массовой настройки выбранных предметов */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div className="text-sm text-gray-600">
                        Выбрано: <span className="font-medium">{selectedSubjectKeys.length}</span> из {getSelectedSubjects().length}
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllSubjects}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Выбрать все
                        </button>
                        <button
                          type="button"
                          onClick={clearSubjectSelection}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Очистить
                        </button>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Часов/нед:</label>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            value={bulkHours}
                            onChange={(e) => setBulkHours(parseInt(e.target.value || '1', 10))}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-md"
                          />
                          <button
                            type="button"
                            disabled={selectedSubjectKeys.length === 0}
                            onClick={applyBulkHours}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Применить к выбранным
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getSelectedSubjects().map((subject, index) => {
                        const subjectKey = `${subject.groupId}-${subject.id}`;
                        const isCustomized = customSubjectHours[subjectKey] !== undefined;

                        return (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${isCustomized ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
                                  <div className={`text-xs font-medium ${isCustomized ? 'text-blue-600' : 'text-gray-600'
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
                                <input
                                  type="checkbox"
                                  checked={selectedSubjectKeys.includes(subjectKey)}
                                  onChange={(e) => { e.stopPropagation(); toggleSubjectSelected(subjectKey); }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
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
                  {Array.from(new Set(classrooms.map(c => c.building))).map(building => (
                    <div key={building}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <Building className="h-5 w-5 mr-2 text-gray-600" />
                          {building}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {classrooms.filter(c => c.building === building && selectedClassrooms.includes(c.id)).length} из {classrooms.filter(c => c.building === building).length} выбрано
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classrooms
                          .filter(classroom => classroom.building === building)
                          .map(classroom => (
                            <div
                              key={classroom.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedClassrooms.includes(classroom.id)
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
                                {/* описание отсутствует в данных */}
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
                      {Array.from(new Set(classrooms.filter(c => selectedClassrooms.includes(c.id)).map(c => c.type))).map(type => {
                        const count = classrooms.filter(c => selectedClassrooms.includes(c.id) && c.type === type).length;
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
                        <div>{Array.from(new Set(classrooms.filter(c => selectedClassrooms.includes(c.id)).map(c => c.building))).length} корпуса</div>
                        <div>{Array.from(new Set(classrooms.filter(c => selectedClassrooms.includes(c.id)).map(c => c.type))).length} типов</div>
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
                    externalLessons={existingLessons}
                    onUpdateLessons={(updatedLessons) => {
                      // Преобразуем ScheduleLesson[] обратно в GeneratedLesson[] и восстанавливаем studyPlanId
                      const idToStudyPlan = new Map(generatedSchedule.map(l => [l.id, l.studyPlanId]));
                      const convertedLessons = updatedLessons.map(lesson => ({
                        ...lesson,
                        studyPlanId: (lesson as unknown as GeneratedLesson).studyPlanId ?? idToStudyPlan.get(lesson.id) ?? 0,
                        dayOfWeek: getDayNameFromDateStr(lesson.date),
                        weekNumber: getWeekNumber(lesson.date)
                      }));
                      setGeneratedSchedule(convertedLessons as GeneratedLesson[]);
                    }}
                    quarterSettings={{
                      startDate: quarterSettings.startDate,
                      endDate: quarterSettings.endDate,
                      workingDays: quarterSettings.workingDays,
                    }}
                    workingHours={scheduleConstraints.workingHours}
                    slotStepMinutes={scheduleConstraints.lessonDuration + scheduleConstraints.breakDuration}
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
                        Это действие создаст {getWeeklyPatterns().length} записей в базе данных (weekly-паттерны за выбранный период).
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
                  {flowOptimized?.recurringTemplates?.some(t => t.repeat === 'biweekly') && (
                    <div className="ml-4 flex items-center space-x-1 bg-gray-100 rounded px-2 py-1 text-sm">
                      <span className="text-gray-600">Неделя:</span>
                      <button
                        type="button"
                        onClick={() => setBiweeklyView('A')}
                        className={`px-2 py-0.5 rounded ${biweeklyView === 'A' ? 'bg-indigo-600 text-white' : 'hover:bg-white'}`}
                      >A</button>
                      <button
                        type="button"
                        onClick={() => setBiweeklyView('B')}
                        className={`px-2 py-0.5 rounded ${biweeklyView === 'B' ? 'bg-indigo-600 text-white' : 'hover:bg-white'}`}
                      >B</button>
                    </div>
                  )}
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
                    externalLessons={existingLessons}
                    onUpdateLessons={(updatedLessons) => {
                      // Преобразуем ScheduleLesson[] обратно в GeneratedLesson[] и восстанавливаем studyPlanId
                      const idToStudyPlan = new Map(generatedSchedule.map(l => [l.id, l.studyPlanId]));
                      const convertedLessons = updatedLessons.map(lesson => ({
                        ...lesson,
                        studyPlanId: (lesson as unknown as GeneratedLesson).studyPlanId ?? idToStudyPlan.get(lesson.id) ?? 0,
                        dayOfWeek: getDayNameFromDateStr(lesson.date),
                        weekNumber: getWeekNumber(lesson.date)
                      }));
                      setGeneratedSchedule(convertedLessons as GeneratedLesson[]);
                    }}
                    quarterSettings={{
                      startDate: quarterSettings.startDate,
                      endDate: quarterSettings.endDate,
                      workingDays: quarterSettings.workingDays,
                    }}
                    workingHours={scheduleConstraints.workingHours}
                    slotStepMinutes={scheduleConstraints.lessonDuration + scheduleConstraints.breakDuration}
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
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${activeModalTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  onClick={() => setActiveModalTab('details')}
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Детали предмета
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${activeModalTab === 'preferences'
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
                          Настройка часов влияет только на представление
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
                                  <div className={`text-sm font-medium ${preference.enabled ? 'text-gray-900' : 'text-gray-600'
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
