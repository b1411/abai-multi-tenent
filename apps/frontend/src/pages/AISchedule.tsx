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
  Minimize,
  Plus
} from 'lucide-react';
import { Button, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import ScheduleGrid from '../components/ScheduleGrid';
import ScheduleConstraintsEditor from '../components/ScheduleConstraintsEditor';
import scheduleService from '../services/scheduleService';
import { GroupOption, ClassroomOption, TeacherOption, StudyPlanOption } from '../types/schedule';
import { GenerationParams as FlowGenerationParams, DraftItem, OptimizedScheduleResponse, ApplyResponse, TeacherPreferences } from '../types/aiScheduleFlow';

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
  value?: string | number | number[] | { startTime?: string; endTime?: string; maxConsecutive?: number; preferredDays?: number[]; preferredClassrooms?: number[] };
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
  forbiddenFirstSubjects: string[]; // предметы, которые не ставить первым уроком
  forbiddenLastSubjects: string[]; // предметы, которые не ставить последним уроком
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
  const [lessonDuration, setLessonDuration] = useState<number>(45); // Default fallback
  const [scheduleConstraints, setScheduleConstraints] = useState<ScheduleConstraints>({
    workingHours: { start: '08:00', end: '15:00' },
    maxLessonsPerDay: 7,
    lunchBreakTime: { start: '12:00', end: '13:00' },
    lessonDuration: 45,
    breakDuration: 10,
    forbiddenFirstSubjects: [],
    forbiddenLastSubjects: [],
    preferredDays: {}
  });

  // Обновляем начальные значения ограничений при изменении выбранных групп
  useEffect(() => {
    if (selectedGroups.length > 0) {
      const selectedSubjects = getSelectedSubjects();
      const subjectNames = selectedSubjects.map(s => s.name);

      // Автоматически устанавливаем некоторые предметы как запрещенные для первого/последнего урока
      // на основе типичных предпочтений
      const typicalFirstForbidden = ['Физкультура', 'Труд', 'ИЗО', 'Музыка'].filter(name => subjectNames.includes(name));
      const typicalLastForbidden = ['Математика', 'Русский язык', 'История'].filter(name => subjectNames.includes(name));

      setScheduleConstraints(prev => ({
        ...prev,
        forbiddenFirstSubjects: typicalFirstForbidden,
        forbiddenLastSubjects: typicalLastForbidden
      }));
    }
  }, [selectedGroups, studyPlans]);

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

  // Состояние для A/B недель
  const [biweeklySubjects, setBiweeklySubjects] = useState<Set<string>>(new Set());

  // Состояние для полноэкранного режима
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Состояние для редактора ограничений
  const [showConstraintsEditor, setShowConstraintsEditor] = useState(false);

  // Состояние для аккордеона предпочтений предметов
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Состояние для аккордеона пожеланий педагогов
  const [expandedTeachers, setExpandedTeachers] = useState<Set<number>>(new Set());

  // Функции для работы с аккордеоном
  const toggleSubjectExpansion = (subjectName: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectName)) {
        newSet.delete(subjectName);
      } else {
        newSet.add(subjectName);
      }
      return newSet;
    });
  };

  const toggleTeacherExpansion = (teacherId: number) => {
    setExpandedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  // Группировка предметов по имени для аккордеона
  const getGroupedSubjects = () => {
    const grouped: { [subjectName: string]: any[] } = {};
    getSelectedSubjects().forEach(subject => {
      if (!grouped[subject.name]) {
        grouped[subject.name] = [];
      }
      grouped[subject.name].push(subject);
    });
    return grouped;
  };

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
        const [g, c, t, spRaw, duration] = await Promise.all([
          scheduleService.getGroups(),
          scheduleService.getClassrooms(),
          scheduleService.getTeachers(),
          scheduleService.getStudyPlans({ limit: 999 }),
          scheduleService.getAcademicHourDuration()
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
        setLessonDuration(duration);
        setScheduleConstraints(prev => ({ ...prev, lessonDuration: duration }));
      } catch (_) {
        // ignore - will use default 45 minutes
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

  // Функции для работы с пожеланиями педагогов
  const getTeacherPreferences = (teacherId: number): TeacherPreference[] => {
    const key = `teacher-${teacherId}`;
    if (!teacherPreferences[key]) {
      // Возвращаем пустой массив - пользователь сам добавит пожелания
      return [];
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

  // Функции для управления пожеланиями педагогов
  const addTeacherPreference = (teacherId: number, type: 'time' | 'day' | 'lesson' | 'classroom' | 'special') => {
    const key = `teacher-${teacherId}`;
    const currentPrefs = getTeacherPreferences(teacherId);
    const newId = `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Получаем данные преподавателя для более персонализированных настроек
    const teacher = teachers.find(t => t.id === teacherId);
    const teacherName = teacher ? `${teacher.name} ${teacher.surname}` : `Преподаватель ${teacherId}`;

    let title = '';
    let description = '';
    let value: any = undefined;

    switch (type) {
      case 'time':
        title = `Не работать после 17:00`;
        description = `Избегать уроков после 17:00 для лучшего баланса работы и отдыха`;
        value = { startTime: '08:00', endTime: '17:00' };
        break;
      case 'day':
        title = `Предпочитать утренние дни`;
        description = `Лучше работать в понедельник, вторник и среду`;
        value = [1, 2, 3]; // Понедельник, вторник, среда
        break;
      case 'lesson':
        title = `Не более 4 уроков подряд`;
        description = `Ограничить количество подряд идущих уроков для предотвращения переутомления`;
        value = { maxConsecutive: 4 };
        break;
      case 'classroom':
        title = `Предпочитать современные аудитории`;
        description = `Приоритетно использовать аудитории с современным оборудованием`;
        value = selectedClassrooms.slice(0, 2); // Первые две выбранные аудитории
        break;
      case 'special':
        title = `Нужен перерыв 15 минут между уроками`;
        description = `Требуется дополнительное время для подготовки к следующему уроку`;
        value = undefined;
        break;
    }

    const newPref: TeacherPreference = {
      id: newId,
      type,
      title,
      description,
      enabled: false,
      value
    };

    setTeacherPreferences(prev => ({
      ...prev,
      [key]: [...currentPrefs, newPref]
    }));
  };

  const updateTeacherPreferenceTitle = (teacherId: number, preferenceId: string, title: string) => {
    const key = `teacher-${teacherId}`;
    const currentPrefs = getTeacherPreferences(teacherId);
    const updatedPrefs = currentPrefs.map(pref =>
      pref.id === preferenceId ? { ...pref, title } : pref
    );

    setTeacherPreferences({
      ...teacherPreferences,
      [key]: updatedPrefs
    });
  };

  const updateTeacherPreferenceDescription = (teacherId: number, preferenceId: string, description: string) => {
    const key = `teacher-${teacherId}`;
    const currentPrefs = getTeacherPreferences(teacherId);
    const updatedPrefs = currentPrefs.map(pref =>
      pref.id === preferenceId ? { ...pref, description } : pref
    );

    setTeacherPreferences({
      ...teacherPreferences,
      [key]: updatedPrefs
    });
  };

  const removeTeacherPreference = (teacherId: number, preferenceId: string) => {
    const key = `teacher-${teacherId}`;
    const currentPrefs = getTeacherPreferences(teacherId);
    const updatedPrefs = currentPrefs.filter(pref => pref.id !== preferenceId);

    setTeacherPreferences({
      ...teacherPreferences,
      [key]: updatedPrefs
    });
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
    { num: 5, title: 'A/B недели', icon: Shuffle, description: 'Настройка двухнедельных предметов' },
    { num: 6, title: 'Генерация', icon: Bot, description: 'Создание расписания' },
    { num: 7, title: 'Просмотр', icon: Eye, description: 'Проверка и редактирование' },
    { num: 8, title: 'Сохранение', icon: Save, description: 'Применение к базе данных' }
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

      // Собираем studyPlanId для A/B недель
      const forceBiweeklyStudyPlanIds: number[] = [];
      for (const subjectKey of biweeklySubjects) {
        const parts = subjectKey.split('-');
        const spId = Number(parts[1]);
        if (Number.isFinite(spId)) {
          forceBiweeklyStudyPlanIds.push(spId);
        }
      }

      // Собираем teacherPreferences из активных пожеланий
      const teacherPreferences: Record<number, TeacherPreferences> = {};
      for (const teacher of teachers) {
        const activePrefs = getTeacherPreferences(teacher.id).filter(pref => pref.enabled);
        if (activePrefs.length > 0) {
          const prefs: TeacherPreferences = {
            unavailableTimes: [],
            unacceptableDays: []
          };

          // Временные ограничения
          const timePrefs = activePrefs.filter(pref => pref.type === 'time');
          if (timePrefs.length > 0) {
            timePrefs.forEach(pref => {
              if (pref.value && typeof pref.value === 'object' && 'endTime' in pref.value && pref.value.endTime) {
                // Добавляем временные интервалы после указанного времени для всех дней
                prefs.unavailableTimes!.push({
                  date: quarterSettings.startDate, // Используем дату начала четверти как пример
                  startTime: pref.value.endTime,
                  endTime: scheduleConstraints.workingHours.end
                });
              }
            });
          }

          // Неприемлемые дни
          const dayPrefs = activePrefs.filter(pref => pref.type === 'day');
          if (dayPrefs.length > 0) {
            dayPrefs.forEach(pref => {
              if (pref.value && Array.isArray(pref.value)) {
                // Добавляем все дни из массива как неприемлемые
                prefs.unacceptableDays!.push(...pref.value);
              }
            });
          }

          // Максимум уроков подряд
          const lessonPrefs = activePrefs.filter(pref => pref.type === 'lesson');
          if (lessonPrefs.length > 0) {
            lessonPrefs.forEach(pref => {
              if (pref.value && typeof pref.value === 'object' && 'maxConsecutive' in pref.value && pref.value.maxConsecutive) {
                prefs.maxConsecutiveLessons = pref.value.maxConsecutive;
              }
            });
          }

          // Предпочитаемые аудитории
          const classroomPrefs = activePrefs.filter(pref => pref.type === 'classroom');
          if (classroomPrefs.length > 0) {
            classroomPrefs.forEach(pref => {
              if (pref.value && Array.isArray(pref.value)) {
                prefs.preferredClassrooms = pref.value;
              }
            });
          }

          teacherPreferences[teacher.id] = prefs;
        }
      }

      const params: FlowGenerationParams = {
        startDate: quarterSettings.startDate,
        endDate: quarterSettings.endDate,
        groupIds: selectedGroups,
        subjectIds: selectedSubjectKeys.length > 0 ? selectedSubjectKeys.map(key => Number(key.split('-')[1])) : undefined,
        constraints: {
          workingHours: scheduleConstraints.workingHours,
          maxConsecutiveHours: Math.min(4, scheduleConstraints.maxLessonsPerDay),
          preferredBreaks: [12],
          excludeWeekends: !quarterSettings.workingDays.includes(6),
          minBreakDuration: scheduleConstraints.breakDuration
        },
        subjectHours,
        teacherPreferences,
        generationType: 'full',
        forceBiweeklyStudyPlanIds: forceBiweeklyStudyPlanIds.length > 0 ? forceBiweeklyStudyPlanIds : undefined
      };

      const draftRes = await scheduleService.flowDraft(params);
      // Просим локальный оптимизатор вернуть шаблоны + debug логи
      params.debug = true;
      const optimized: OptimizedScheduleResponse = await scheduleService.flowOptimizeLocal({ draft: draftRes.draft, params });
      setFlowDraft(draftRes.draft);
      setFlowOptimized(optimized);
      const validation = await scheduleService.flowValidate(optimized);
      setFlowValidation(validation);
      // Строим расписание из шаблонов для отображения (разворачиваем на неделю)
      let weekLessons: GeneratedLesson[] = [];

      // Разворачиваем recurringTemplates на неделю
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
      }

      // Добавляем singleOccurrences попадающие в эту неделю
      if (optimized.singleOccurrences?.length) {
        const singles = optimized.singleOccurrences;
        const startDateObj = new Date(params.startDate + 'T00:00:00');
        const startDow = startDateObj.getDay();
        const monday = new Date(startDateObj);
        const offset = (startDow + 6) % 7;
        monday.setDate(monday.getDate() - offset);
        const weekDateSet = new Set<string>();
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          weekDateSet.add(d.toISOString().split('T')[0]);
        }
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

      // Fallback: если нет шаблонов, используем generatedSchedule
      if (!optimized.recurringTemplates?.length && !optimized.singleOccurrences?.length) {
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
      setCurrentStep(7);
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
      {Array.from(new Set(classrooms.map(c => c.building))).map(building => {
        const buildingClassrooms = classrooms.filter(c => c.building === building);
        const selectedInBuilding = buildingClassrooms.filter(c => selectedClassrooms.includes(c.id)).length;
        const allSelected = selectedInBuilding === buildingClassrooms.length && buildingClassrooms.length > 0;

        return (
          <div key={building}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2 text-gray-600" />
                {building}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  {selectedInBuilding} из {buildingClassrooms.length} выбрано
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const buildingIds = buildingClassrooms.map(c => c.id);
                      setSelectedClassrooms(prev => [...new Set([...prev, ...buildingIds])]);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                  >
                    Выбрать все
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const buildingIds = buildingClassrooms.map(c => c.id);
                      setSelectedClassrooms(prev => prev.filter(id => !buildingIds.includes(id)));
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildingClassrooms.map(classroom => (
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
              ))}
            </div>
          </div>
        );
      })}
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

                  {/* Обеденный перерыв */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Обеденный перерыв</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Начало перерыва</label>
                        <input
                          type="time"
                          value={scheduleConstraints.lunchBreakTime.start}
                          onChange={(e) => setScheduleConstraints({
                            ...scheduleConstraints,
                            lunchBreakTime: { ...scheduleConstraints.lunchBreakTime, start: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Конец перерыва</label>
                        <input
                          type="time"
                          value={scheduleConstraints.lunchBreakTime.end}
                          onChange={(e) => setScheduleConstraints({
                            ...scheduleConstraints,
                            lunchBreakTime: { ...scheduleConstraints.lunchBreakTime, end: e.target.value }
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
                              checked={scheduleConstraints.forbiddenFirstSubjects.includes(subject)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    forbiddenFirstSubjects: [...scheduleConstraints.forbiddenFirstSubjects, subject]
                                  });
                                } else {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    forbiddenFirstSubjects: scheduleConstraints.forbiddenFirstSubjects.filter(s => s !== subject)
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
                              checked={scheduleConstraints.forbiddenLastSubjects.includes(subject)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    forbiddenLastSubjects: [...scheduleConstraints.forbiddenLastSubjects, subject]
                                  });
                                } else {
                                  setScheduleConstraints({
                                    ...scheduleConstraints,
                                    forbiddenLastSubjects: scheduleConstraints.forbiddenLastSubjects.filter(s => s !== subject)
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

                    {/* Предпочитаемые дни для предметов */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3">
                        Предпочитаемые дни для предметов ({Object.keys(getGroupedSubjects()).length} предметов):
                      </label>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {Object.entries(getGroupedSubjects()).map(([subjectName, subjectGroups]) => {
                          const isExpanded = expandedSubjects.has(subjectName);
                          const hasAnyPreferences = subjectGroups.some(subject =>
                            scheduleConstraints.preferredDays[`${subjectName}-${subject.groupId}`]?.length > 0
                          );

                          return (
                            <div key={subjectName} className="border rounded-lg bg-white shadow-sm">
                              {/* Заголовок аккордеона */}
                              <button
                                type="button"
                                onClick={() => toggleSubjectExpansion(subjectName)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">{subjectName}</div>
                                    <div className="text-sm text-gray-500">
                                      {subjectGroups.length} групп • {subjectGroups[0]?.teacherName}
                                      {hasAnyPreferences && (
                                        <span className="ml-2 text-blue-600 font-medium">
                                          • Настроено предпочтений
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {subjectGroups.length} групп
                                </div>
                              </button>

                              {/* Содержимое аккордеона */}
                              {isExpanded && (
                                <div className="border-t bg-gray-50 p-4">
                                  <div className="space-y-4">
                                    {subjectGroups.map((subject) => {
                                      const subjectKey = `${subjectName}-${subject.groupId}`;
                                      const preferredDays = scheduleConstraints.preferredDays[subjectKey] || [];

                                      return (
                                        <div key={subject.groupId} className="bg-white rounded-lg p-3 border">
                                          <div className="font-medium text-sm text-gray-900 mb-3 flex items-center">
                                            <Users className="h-4 w-4 mr-2 text-gray-600" />
                                            {subject.groupName}
                                          </div>
                                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {[
                                              { num: 1, name: 'Пн' },
                                              { num: 2, name: 'Вт' },
                                              { num: 3, name: 'Ср' },
                                              { num: 4, name: 'Чт' },
                                              { num: 5, name: 'Пт' },
                                              { num: 6, name: 'Сб' }
                                            ].map(day => (
                                              <label key={day.num} className="flex items-center space-x-1">
                                                <input
                                                  type="checkbox"
                                                  checked={preferredDays.includes(day.num)}
                                                  onChange={(e) => {
                                                    const newPreferredDays = e.target.checked
                                                      ? [...preferredDays, day.num]
                                                      : preferredDays.filter(d => d !== day.num);

                                                    setScheduleConstraints({
                                                      ...scheduleConstraints,
                                                      preferredDays: {
                                                        ...scheduleConstraints.preferredDays,
                                                        [subjectKey]: newPreferredDays
                                                      }
                                                    });
                                                  }}
                                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="text-xs text-gray-700">{day.name}</span>
                                              </label>
                                            ))}
                                          </div>
                                          {preferredDays.length > 0 && (
                                            <div className="mt-2 text-xs text-blue-600">
                                              Предпочитаемые дни: {preferredDays.map(d =>
                                                ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d - 1]
                                              ).join(', ')}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Пожелания педагогов */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Пожелания педагогов ({new Set(getSelectedSubjects().map(s => s.teacherId)).size} преподавателей)</h3>

                    <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-pink-800">
                          Настройте индивидуальные предпочтения для каждого преподавателя.
                          Эти настройки помогут алгоритму создать более комфортное расписание.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getSelectedSubjects().reduce((uniqueTeachers: { id: number; name: string; subjectCount: number }[], subject) => {
                        const teacherExists = uniqueTeachers.find(t => t.id === subject.teacherId);
                        if (!teacherExists) {
                          uniqueTeachers.push({
                            id: subject.teacherId,
                            name: subject.teacherName,
                            subjectCount: 1
                          });
                        } else {
                          teacherExists.subjectCount++;
                        }
                        return uniqueTeachers;
                      }, []).map(teacher => {
                        const isExpanded = expandedTeachers.has(teacher.id);
                        const teacherPrefs = getTeacherPreferences(teacher.id);
                        const activePrefsCount = teacherPrefs.filter(p => p.enabled).length;

                        return (
                          <div key={teacher.id} className="border rounded-lg bg-white shadow-sm">
                            {/* Заголовок аккордеона */}
                            <button
                              type="button"
                              onClick={() => toggleTeacherExpansion(teacher.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="text-left">
                                  <div className="font-medium text-gray-900">{teacher.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {teacher.subjectCount} предметов
                                    {activePrefsCount > 0 && (
                                      <span className="ml-2 text-pink-600 font-medium">
                                        • {activePrefsCount} активных пожеланий
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {teacher.subjectCount} предметов
                              </div>
                            </button>

                            {/* Содержимое аккордеона */}
                            {isExpanded && (
                              <div className="border-t bg-gray-50 p-4">
                                <div className="space-y-4">
                                  {[
                                    { type: 'time', title: '⏰ Временные ограничения', icon: Clock, placeholder: 'Например: Не работать после 15:00' },
                                    { type: 'day', title: '📅 Предпочтения по дням', icon: Calendar, placeholder: 'Например: Предпочитать понедельник и среду' },
                                    { type: 'lesson', title: '📚 Ограничения по урокам', icon: BookOpen, placeholder: 'Например: Не более 3 уроков подряд' },
                                    { type: 'classroom', title: '🏫 Аудиторные предпочтения', icon: Building, placeholder: 'Например: Только аудитории на 1 этаже' },
                                    { type: 'special', title: '⭐ Особые требования', icon: Star, placeholder: 'Например: Перерывы между уроками 15 мин' }
                    ].map(category => {
                      const categoryPrefs = teacherPrefs.filter(pref => pref.type === category.type);
                      const activeCount = categoryPrefs.filter(pref => pref.enabled).length;

                      return (
                        <div key={category.type} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900 flex items-center">
                              {category.title}
                            </h5>
                            <div className="flex items-center space-x-2">
                              {activeCount > 0 && (
                                <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full">
                                  {activeCount} активно
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => addTeacherPreference(teacher.id, category.type as 'time' | 'day' | 'lesson' | 'classroom' | 'special')}
                                className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Добавить
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {categoryPrefs.length === 0 ? (
                              <div className="text-sm text-gray-500 italic text-center py-4">
                                Нет пожеланий в этой категории
                              </div>
                            ) : (
                              categoryPrefs.map(pref => (
                                <div key={pref.id} className="flex items-start space-x-2 p-2 border rounded bg-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={pref.enabled}
                                    onChange={(e) => updateTeacherPreference(
                                      teacher.id,
                                      pref.id,
                                      e.target.checked
                                    )}
                                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mt-1"
                                  />
                                  <div className="flex-1 space-y-2">
                                    {/* Специфические контролы в зависимости от типа */}
                                    {pref.type === 'time' && pref.value && typeof pref.value === 'object' && 'endTime' in pref.value && (
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <label className="text-sm text-gray-700">Не работать после:</label>
                                          <input
                                            type="time"
                                            value={pref.value.endTime || '15:00'}
                                            onChange={(e) => {
                                              const newValue = { ...pref.value, endTime: e.target.value };
                                              // Обновляем preference с новым value
                                              const updatedPrefs = teacherPrefs.map(p =>
                                                p.id === pref.id ? { ...p, value: newValue } : p
                                              );
                                              setTeacherPreferences(prev => ({
                                                ...prev,
                                                [`teacher-${teacher.id}`]: updatedPrefs
                                              }));
                                            }}
                                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500"
                                          />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Преподаватель не будет работать после указанного времени
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'day' && pref.value && Array.isArray(pref.value) && (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-700 mb-2">Предпочитаемые дни недели:</div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {[
                                            { num: 1, name: 'Пн' },
                                            { num: 2, name: 'Вт' },
                                            { num: 3, name: 'Ср' },
                                            { num: 4, name: 'Чт' },
                                            { num: 5, name: 'Пт' },
                                            { num: 6, name: 'Сб' }
                                          ].map(day => (
                                            <label key={day.num} className="flex items-center space-x-1">
                                              <input
                                                type="checkbox"
                                                checked={Array.isArray(pref.value) && pref.value.includes(day.num)}
                                                onChange={(e) => {
                                                  const newValue = e.target.checked
                                                    ? [...pref.value, day.num]
                                                    : pref.value.filter((d: number) => d !== day.num);
                                                  const updatedPrefs = teacherPrefs.map(p =>
                                                    p.id === pref.id ? { ...p, value: newValue } : p
                                                  );
                                                  setTeacherPreferences(prev => ({
                                                    ...prev,
                                                    [`teacher-${teacher.id}`]: updatedPrefs
                                                  }));
                                                }}
                                                className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                              />
                                              <span className="text-xs text-gray-700">{day.name}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'lesson' && pref.value && typeof pref.value === 'object' && 'maxConsecutive' in pref.value && (
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <label className="text-sm text-gray-700">Макс. уроков подряд:</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={pref.value.maxConsecutive || 3}
                                            onChange={(e) => {
                                              const newValue = { ...pref.value, maxConsecutive: parseInt(e.target.value) };
                                              const updatedPrefs = teacherPrefs.map(p =>
                                                p.id === pref.id ? { ...p, value: newValue } : p
                                              );
                                              setTeacherPreferences(prev => ({
                                                ...prev,
                                                [`teacher-${teacher.id}`]: updatedPrefs
                                              }));
                                            }}
                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500"
                                          />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Ограничение на количество подряд идущих уроков
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'classroom' && pref.value && Array.isArray(pref.value) && (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-700 mb-2">Предпочитаемые аудитории:</div>
                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                          {selectedClassrooms.map(classroomId => {
                                            const classroom = classrooms.find(c => c.id === classroomId);
                                            return classroom ? (
                                              <label key={classroom.id} className="flex items-center space-x-1">
                                                <input
                                                  type="checkbox"
                                                  checked={pref.value.includes(classroom.id)}
                                                  onChange={(e) => {
                                                  const currentValue = pref.value as number[];
                                                  const newValue = e.target.checked
                                                    ? [...currentValue, classroom.id]
                                                    : currentValue.filter((id: number) => id !== classroom.id);
                                                    const updatedPrefs = teacherPrefs.map(p =>
                                                      p.id === pref.id ? { ...p, value: newValue } : p
                                                    );
                                                    setTeacherPreferences(prev => ({
                                                      ...prev,
                                                      [`teacher-${teacher.id}`]: updatedPrefs
                                                    }));
                                                  }}
                                                  className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                                />
                                                <span className="text-xs text-gray-700">{classroom.name}</span>
                                              </label>
                                            ) : null;
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'special' && (
                                      <div className="space-y-2">
                                        <textarea
                                          value={pref.description || ''}
                                          onChange={(e) => updateTeacherPreferenceDescription(teacher.id, pref.id, e.target.value)}
                                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500 resize-none"
                                          rows={3}
                                          placeholder="Опишите особые требования..."
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeTeacherPreference(teacher.id, pref.id)}
                                    className="text-red-500 hover:text-red-700 mt-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}

                                  {/* Статистика пожеланий */}
                                  {teacherPrefs.filter(p => p.enabled).length > 0 && (
                                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                      <div className="flex items-center">
                                        <Star className="h-5 w-5 text-pink-500 mr-2" />
                                        <div className="text-sm">
                                          <div className="font-medium text-pink-900">
                                            Активно пожеланий: {teacherPrefs.filter(p => p.enabled).length} из {teacherPrefs.length}
                                          </div>
                                          <div className="text-pink-700">
                                            Алгоритм будет учитывать эти ограничения при составлении расписания
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

            {/* Шаг 5: A/B недели */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Shuffle className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">A/B недели</h2>
                  <p className="text-gray-600">Выберите предметы для двухнедельного цикла</p>
                </div>

                {/* Информация о A/B неделях */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Shuffle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-blue-900 mb-1">
                        Что такое A/B недели?
                      </div>
                      <div className="text-blue-800">
                        Предметы с двухнедельным циклом проводятся только в четные или нечетные недели.
                        Это позволяет оптимизировать нагрузку на преподавателей и аудитории.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Список предметов для выбора */}
                {selectedGroups.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Предметы для A/B недель ({biweeklySubjects.size} выбрано)
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setBiweeklySubjects(new Set())}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Очистить все
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const allKeys = getSelectedSubjects().map(s => `${s.groupId}-${s.id}`);
                            setBiweeklySubjects(new Set(allKeys));
                          }}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md"
                        >
                          Выбрать все
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getSelectedSubjects().map((subject, index) => {
                        const subjectKey = `${subject.groupId}-${subject.id}`;
                        const isBiweekly = biweeklySubjects.has(subjectKey);

                        return (
                          <div
                            key={index}
                            className={`p-4 border rounded-lg transition-all ${
                              isBiweekly
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`biweekly-${subjectKey}`}
                                checked={isBiweekly}
                                onChange={(e) => {
                                  const newSet = new Set(biweeklySubjects);
                                  if (e.target.checked) {
                                    newSet.add(subjectKey);
                                  } else {
                                    newSet.delete(subjectKey);
                                  }
                                  setBiweeklySubjects(newSet);
                                }}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`biweekly-${subjectKey}`} className="flex-1 cursor-pointer">
                                <div className={`font-medium ${isBiweekly ? 'text-purple-900' : 'text-gray-900'}`}>
                                  {subject.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {subject.groupName} • {subject.teacherName}
                                </div>
                                {isBiweekly && (
                                  <div className="text-xs text-purple-600 mt-1">
                                    ✓ Двухнедельный цикл
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Статистика */}
                    {biweeklySubjects.size > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-sm">
                          <div className="font-medium text-purple-900 mb-2">
                            Выбрано предметов для A/B недель: {biweeklySubjects.size}
                          </div>
                          <div className="text-purple-800">
                            Эти предметы будут чередоваться по неделям (четные/нечетные),
                            что сократит общее количество уроков в неделю.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

            {/* Шаг 6: Генерация */}
            {currentStep === 6 && (
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

            {/* Шаг 7: Интерактивная сетка расписания */}
            {currentStep === 7 && (
              <motion.div
                key="step7"
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
                  <Button variant="outline" onClick={() => setCurrentStep(5)}>
                    <Shuffle className="h-4 w-4 mr-2" /> Перегенерировать
                  </Button>
                  <Button onClick={nextStep} className="px-6 bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Сохранить расписание
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Шаг 8: Сохранение */}
            {currentStep === 8 && (
              <motion.div
                key="step8"
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
                        Это действие создаст регулярные шаблоны расписания в базе данных.
                        Вместо отдельных записей на каждый день будут созданы шаблоны с повторением (weekly/biweekly).
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

        {/* Модальное окно редактора ограничений */}
        {showConstraintsEditor && (
          <ScheduleConstraintsEditor
            isOpen={showConstraintsEditor}
            onClose={() => setShowConstraintsEditor(false)}
            constraints={scheduleConstraints}
            onSave={(newConstraints) => {
              setScheduleConstraints(newConstraints);
              setShowConstraintsEditor(false);
            }}
            availableSubjects={getSelectedSubjects().map(s => ({
              id: s.id,
              name: s.name,
              groupId: s.groupId,
              groupName: s.groupName,
              teacherId: s.teacherId,
              teacherName: s.teacherName
            }))}
            teacherPreferences={teacherPreferences}
            onTeacherPreferencesChange={setTeacherPreferences}
          />
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
                            {categoryPrefs.length === 0 ? (
                              <div className="text-sm text-gray-500 italic text-center py-4">
                                Нет пожеланий в этой категории
                              </div>
                            ) : (
                              categoryPrefs.map(pref => (
                                <div key={pref.id} className="flex items-start space-x-2 p-2 border rounded bg-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={pref.enabled}
                                    onChange={(e) => updateTeacherPreference(
                                      selectedSubject.teacherId,
                                      pref.id,
                                      e.target.checked
                                    )}
                                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mt-1"
                                  />
                                  <div className="flex-1 space-y-2">
                                    {/* Специфические контролы в зависимости от типа */}
                                    {pref.type === 'time' && pref.value && typeof pref.value === 'object' && 'endTime' in pref.value && pref.value.endTime && (
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <label className="text-sm text-gray-700">Не работать после:</label>
                                          <input
                                            type="time"
                                            value={pref.value.endTime}
                                            onChange={(e) => {
                                              const currentPrefs = getTeacherPreferences(selectedSubject.teacherId);
                                              const currentValue = pref.value && typeof pref.value === 'object' ? pref.value : {};
                                              const newValue = { ...currentValue, endTime: e.target.value };
                                              const updatedPrefs = currentPrefs.map(p =>
                                                p.id === pref.id ? { ...p, value: newValue } : p
                                              );
                                              setTeacherPreferences(prev => ({
                                                ...prev,
                                                [`teacher-${selectedSubject.teacherId}`]: updatedPrefs
                                              }));
                                            }}
                                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500"
                                          />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Преподаватель не будет работать после указанного времени
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'day' && pref.value && Array.isArray(pref.value) && (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-700 mb-2">Предпочитаемые дни недели:</div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {[
                                            { num: 1, name: 'Пн' },
                                            { num: 2, name: 'Вт' },
                                            { num: 3, name: 'Ср' },
                                            { num: 4, name: 'Чт' },
                                            { num: 5, name: 'Пт' },
                                            { num: 6, name: 'Сб' }
                                          ].map(day => (
                                            <label key={day.num} className="flex items-center space-x-1">
                                              <input
                                                type="checkbox"
                                                checked={pref.value.includes(day.num)}
                                                onChange={(e) => {
                                                  const currentPrefs = getTeacherPreferences(selectedSubject.teacherId);
                                                  const currentValue = pref.value as number[];
                                                  const newValue = e.target.checked
                                                    ? [...currentValue, day.num]
                                                    : currentValue.filter((d: number) => d !== day.num);
                                                  const updatedPrefs = currentPrefs.map(p =>
                                                    p.id === pref.id ? { ...p, value: newValue } : p
                                                  );
                                                  setTeacherPreferences(prev => ({
                                                    ...prev,
                                                    [`teacher-${selectedSubject.teacherId}`]: updatedPrefs
                                                  }));
                                                }}
                                                className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                              />
                                              <span className="text-xs text-gray-700">{day.name}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'lesson' && pref.value && typeof pref.value === 'object' && 'maxConsecutive' in pref.value && pref.value.maxConsecutive && (
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <label className="text-sm text-gray-700">Макс. уроков подряд:</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={pref.value.maxConsecutive}
                                            onChange={(e) => {
                                              const currentPrefs = getTeacherPreferences(selectedSubject.teacherId);
                                              const currentValue = pref.value && typeof pref.value === 'object' ? pref.value : {};
                                              const newValue = { ...currentValue, maxConsecutive: parseInt(e.target.value) };
                                              const updatedPrefs = currentPrefs.map(p =>
                                                p.id === pref.id ? { ...p, value: newValue } : p
                                              );
                                              setTeacherPreferences(prev => ({
                                                ...prev,
                                                [`teacher-${selectedSubject.teacherId}`]: updatedPrefs
                                              }));
                                            }}
                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500"
                                          />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Ограничение на количество подряд идущих уроков
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'classroom' && pref.value && Array.isArray(pref.value) && (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-700 mb-2">Предпочитаемые аудитории:</div>
                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                          {selectedClassrooms.map(classroomId => {
                                            const classroom = classrooms.find(c => c.id === classroomId);
                                            return classroom ? (
                                              <label key={classroom.id} className="flex items-center space-x-1">
                                                <input
                                                  type="checkbox"
                                                  checked={pref.value.includes(classroom.id)}
                                                  onChange={(e) => {
                                                    const currentPrefs = getTeacherPreferences(selectedSubject.teacherId);
                                                    const currentValue = pref.value as number[];
                                                    const newValue = e.target.checked
                                                      ? [...currentValue, classroom.id]
                                                      : currentValue.filter((id: number) => id !== classroom.id);
                                                    const updatedPrefs = currentPrefs.map(p =>
                                                      p.id === pref.id ? { ...p, value: newValue } : p
                                                    );
                                                    setTeacherPreferences(prev => ({
                                                      ...prev,
                                                      [`teacher-${selectedSubject.teacherId}`]: updatedPrefs
                                                    }));
                                                  }}
                                                  className="h-3 w-3 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                                />
                                                <span className="text-xs text-gray-700">{classroom.name}</span>
                                              </label>
                                            ) : null;
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {pref.type === 'special' && (
                                      <div className="space-y-2">
                                        <textarea
                                          value={pref.description || ''}
                                          onChange={(e) => updateTeacherPreferenceDescription(selectedSubject.teacherId, pref.id, e.target.value)}
                                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500 resize-none"
                                          rows={3}
                                          placeholder="Опишите особые требования..."
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeTeacherPreference(selectedSubject.teacherId, pref.id)}
                                    className="text-red-500 hover:text-red-700 mt-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))
                            )}
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
