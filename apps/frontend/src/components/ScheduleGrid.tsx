// ScheduleGrid.tsx

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragOverEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  BookOpen,
  AlertTriangle,
  Filter,
  Eye,
  X,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Lightbulb
} from 'lucide-react';

// Типы для расписания
interface ScheduleLesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  groupId: number;
  groupName: string;
  teacherId: number;
  teacherName: string;
  classroomId?: number;
  classroomName?: string;
  color?: string;
}

// Типы для системы конфликтов
interface ConflictInfo {
  type: 'teacher' | 'classroom' | 'group' | 'time' | 'preference';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  conflictingLessons?: ScheduleLesson[];
  suggestions?: string[];
}

interface ValidationResult {
  isValid: boolean;
  conflicts: ConflictInfo[];
}

interface ConflictModalProps {
  isOpen: boolean;
  conflicts: ConflictInfo[];
  lessonBeingMoved: ScheduleLesson | null;
  targetDate: string;
  targetTime: string;
  onConfirm: () => void;
  onCancel: () => void;
  onFindAlternative: () => void;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  isLunchSlot?: boolean;
}

interface ScheduleGridProps {
  lessons: ScheduleLesson[];
  onUpdateLessons: (lessons: ScheduleLesson[]) => void;
  quarterSettings: {
    startDate: string;
    endDate: string;
    workingDays: number[];
  };
  workingHours: {
    start: string;
    end: string;
  };
  slotStepMinutes?: number;
  /** Существующее расписание (не перетаскивается), для подсветки конфликтов */
  externalLessons?: ScheduleLesson[];
  lessonDurationMinutes?: number;   // например 45
  breakMinutes?: number;            // например 10
  lunchBreakTime?: { start: string; end: string }; // например {start:'12:00', end:'13:00'}
}

// Компонент урока в сетке
const LessonCard: React.FC<{
  lesson: ScheduleLesson;
  isDragging?: boolean;
  onClick?: () => void;
}> = ({ lesson, isDragging = false, onClick }) => {
  const subjectColors = {
    'Математика': 'bg-blue-500',
    'Алгебра': 'bg-blue-600',
    'Геометрия': 'bg-blue-400',
    'Русский язык': 'bg-green-500',
    'Литература': 'bg-green-600',
    'Английский язык': 'bg-purple-500',
    'История': 'bg-yellow-600',
    'История Казахстана': 'bg-yellow-700',
    'Всемирная история': 'bg-yellow-500',
    'Физика': 'bg-red-500',
    'Химия': 'bg-orange-500',
    'Биология': 'bg-emerald-500',
    'География': 'bg-teal-500',
    'Информатика': 'bg-indigo-500',
    'Физкультура': 'bg-pink-500',
  };

  const bgColor = subjectColors[lesson.subject as keyof typeof subjectColors] || 'bg-gray-500';

  return (
    <div
      className={`${bgColor} text-white p-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="text-xs font-medium mb-1">{lesson.subject}</div>
      <div className="text-xs opacity-90">{lesson.groupName}</div>
      <div className="text-xs opacity-75 flex items-center mt-1">
        <Clock className="h-3 w-3 mr-1" />
        {lesson.startTime}
      </div>
      {lesson.classroomName && (
        <div className="text-xs opacity-75 flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          {lesson.classroomName}
        </div>
      )}
    </div>
  );
};

// Компонент перетаскиваемого урока
const DraggableLessonCard: React.FC<{
  lesson: ScheduleLesson;
  onClick?: () => void;
}> = ({ lesson, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id: lesson.id,
    data: {
      type: 'lesson',
      lesson,
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <LessonCard lesson={lesson} isDragging={isDragging} onClick={onClick} />
    </div>
  );
};

// Функции валидации конфликтов
const validateLessonMove = (
  lesson: ScheduleLesson,
  targetDate: string,
  targetTime: string,
  allLessons: ScheduleLesson[]
): ValidationResult => {
  const conflicts: ConflictInfo[] = [];

  // Исключаем текущий урок из проверки
  const otherLessons = allLessons.filter(l => l.id !== lesson.id);

  // Проверка конфликта учителя
  const teacherConflict = otherLessons.find(
    l => l.teacherId === lesson.teacherId && l.date === targetDate && l.startTime === targetTime
  );
  if (teacherConflict) {
    conflicts.push({
      type: 'teacher',
      severity: 'error',
      title: 'Конфликт преподавателя',
      description: `${lesson.teacherName} уже проводит урок в это время`,
      conflictingLessons: [teacherConflict],
      suggestions: [
        'Выберите другое время',
        'Найдите свободный слот для преподавателя',
        'Замените преподавателя на урок'
      ]
    });
  }

  // Проверка конфликта аудитории
  if (lesson.classroomId) {
    const classroomConflict = otherLessons.find(
      l => l.classroomId === lesson.classroomId && l.date === targetDate && l.startTime === targetTime
    );
    if (classroomConflict) {
      conflicts.push({
        type: 'classroom',
        severity: 'error',
        title: 'Конфликт аудитории',
        description: `Аудитория ${lesson.classroomName} уже занята в это время`,
        conflictingLessons: [classroomConflict],
        suggestions: [
          'Выберите свободную аудитории',
          'Перенесите другой урок',
          'Найдите альтернативную аудитории'
        ]
      });
    }
  }

  // Проверка конфликта группы
  const groupConflict = otherLessons.find(
    l => l.groupId === lesson.groupId && l.date === targetDate && l.startTime === targetTime
  );
  if (groupConflict) {
    conflicts.push({
      type: 'group',
      severity: 'error',
      title: 'Конфликт группы',
      description: `Группа ${lesson.groupName} уже имеет урок в это время`,
      conflictingLessons: [groupConflict],
      suggestions: [
        'Выберите другое время для группы',
        'Перенесите конфликтующий урок',
        'Разделите группу на подгруппы'
      ]
    });
  }

  // Проверка временных ограничений
  const targetHour = parseInt(targetTime.split(':')[0]);
  if (targetHour < 8 || targetHour >= 18) {
    conflicts.push({
      type: 'time',
      severity: 'warning',
      title: 'Время вне рабочих часов',
      description: 'Урок планируется вне стандартного рабочего времени (8:00-18:00)',
      suggestions: [
        'Перенесите урок на рабочее время',
        'Получите разрешение администрации',
        'Убедитесь в доступности всех участников'
      ]
    });
  }

  // Проверка выходных дней
  const targetDateObj = new Date(targetDate);
  const dayOfWeek = targetDateObj.getDay();
  if (dayOfWeek === 0) { // Воскресенье
    conflicts.push({
      type: 'time',
      severity: 'error',
      title: 'Выходной день',
      description: 'Урок планируется на воскресенье',
      suggestions: [
        'Выберите рабочий день',
        'Проверьте календарь рабочих дней'
      ]
    });
  }

  return {
    isValid: conflicts.filter(c => c.severity === 'error').length === 0,
    conflicts
  };
};

// Функция поиска свободного времени
const findAlternativeSlots = (
  lesson: ScheduleLesson,
  allLessons: ScheduleLesson[],
  workingDays: string[],
  timeSlots: TimeSlot[]
): Array<{date: string, time: string, score: number}> => {
  const alternatives: Array<{date: string, time: string, score: number}> = [];

  for (const date of workingDays.slice(0, 7)) { // Проверяем первую неделю
    for (const timeSlot of timeSlots) {
      const validation = validateLessonMove(lesson, date, timeSlot.time, allLessons);
      
      if (validation.isValid) {
        // Рассчитываем "оценку" слота (чем выше, тем лучше)
        let score = 100;
        
        // Штраф за раннее/позднее время
        if (timeSlot.hour < 9 || timeSlot.hour > 13) score -= 20;
        
        // Бонус за середину дня
        if (timeSlot.hour >= 10 && timeSlot.hour <= 12) score += 10;
        
        // Штраф за предупреждения
        score -= validation.conflicts.filter(c => c.severity === 'warning').length * 5;
        
        alternatives.push({ date, time: timeSlot.time, score });
      }
    }
  }

  return alternatives.sort((a, b) => b.score - a.score).slice(0, 5);
};

// Компонент модального окна конфликтов
const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  conflicts,
  lessonBeingMoved,
  targetDate,
  targetTime,
  onConfirm,
  onCancel,
  onFindAlternative
}) => {
  if (!isOpen || !lessonBeingMoved) return null;

  const hasErrors = conflicts.some(c => c.severity === 'error');
  const hasWarnings = conflicts.some(c => c.severity === 'warning');

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {hasErrors ? (
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              )}
              <h3 className="text-lg font-semibold">
                {hasErrors ? 'Обнаружены конфликты' : 'Предупреждения'}
              </h3>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Информация о перемещаемом уроке */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-2">Перемещение урока:</h4>
            <div className="text-sm text-gray-600">
              <div><strong>{lessonBeingMoved.subject}</strong> - {lessonBeingMoved.groupName}</div>
              <div>Преподаватель: {lessonBeingMoved.teacherName}</div>
              <div>Новое время: {targetDate} в {targetTime}</div>
              {lessonBeingMoved.classroomName && (
                <div>Аудитория: {lessonBeingMoved.classroomName}</div>
              )}
            </div>
          </div>

          {/* Список конфликтов */}
          <div className="space-y-4 mb-6">
            {conflicts.map((conflict, index) => (
              <div key={index} className={`border-l-4 p-4 ${
                conflict.severity === 'error' 
                  ? 'border-red-500 bg-red-50' 
                  : conflict.severity === 'warning'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {conflict.severity === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    {conflict.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {conflict.severity === 'info' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="ml-3">
                    <h5 className="font-medium">{conflict.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{conflict.description}</p>
                    
                    {conflict.conflictingLessons && conflict.conflictingLessons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Конфликтующие уроки:</p>
                        {conflict.conflictingLessons.map(conflictLesson => (
                          <div key={conflictLesson.id} className="text-xs bg-white rounded px-2 py-1 border">
                            {conflictLesson.subject} - {conflictLesson.groupName} ({conflictLesson.teacherName})
                          </div>
                        ))}
                      </div>
                    )}

                    {conflict.suggestions && conflict.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Рекомендации:</p>
                        <ul className="text-xs space-y-1">
                          {conflict.suggestions.map((suggestion, i) => (
                            <li key={i} className="flex items-start">
                              <Lightbulb className="h-3 w-3 text-yellow-600 mr-1 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onFindAlternative}
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Search className="h-4 w-4 mr-2" />
              Найти свободное время
            </button>
            
            {!hasErrors && (
              <button
                onClick={onConfirm}
                className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Игнорировать предупреждения
              </button>
            )}
            
            <button
              onClick={onCancel}
              className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент ячейки времени в сетке с индикацией конфликтов
const TimeSlotCell: React.FC<{
  date: string;
  timeSlot: TimeSlot;
  lessons: ScheduleLesson[]; // только новые уроки (редактируемые)
  externalLessons?: ScheduleLesson[]; // существующие
  onDropLesson: (lessonId: string, date: string, time: string) => void;
  allLessons: ScheduleLesson[]; // все новые уроки (для быстрой валидации)
  isLunchSlot?: boolean;
  lunchBreakTime: { start: string; end: string };
}> = ({ date, timeSlot, lessons, externalLessons = [], onDropLesson, allLessons, isLunchSlot = false, lunchBreakTime }) => {
  const cellLessons = lessons.filter(
    lesson => lesson.date === date && lesson.startTime === timeSlot.time
  );
  const cellExternal = externalLessons.filter(l => l.date === date && l.startTime === timeSlot.time);

  const dropId = `slot::${date}::${timeSlot.time}`;
  
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    disabled: !!timeSlot.isLunchSlot,
  });

  // Проверяем наличие конфликтов в этой ячейке
  const hasConflicts = useMemo(() => {
    // Конфликт если внутри новых >1 с одним ресурсом ИЛИ пересечение нового и существующего по любому ресурсу
    const combined = [...cellLessons, ...cellExternal];
    if (combined.length <= 1) return false;
    const teachers = combined.map(l => l.teacherId);
    const groups = combined.map(l => l.groupId);
    const classrooms = combined.map(l => l.classroomId).filter(Boolean);
    const uniqueTeachers = [...new Set(teachers)];
    const uniqueGroups = [...new Set(groups)];
    const uniqueClassrooms = [...new Set(classrooms)];
    return teachers.length !== uniqueTeachers.length ||
      groups.length !== uniqueGroups.length ||
      (classrooms.length > 0 && classrooms.length !== uniqueClassrooms.length);
  }, [cellLessons, cellExternal]);

  // Функция для проверки пересечения времени с обедом
  const crossesLunch = (startTime: string, endTime: string) => {
    const start = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const end = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const lunchStart = parseInt(lunchBreakTime.start.split(':')[0]) * 60 + parseInt(lunchBreakTime.start.split(':')[1]);
    const lunchEnd = parseInt(lunchBreakTime.end.split(':')[0]) * 60 + parseInt(lunchBreakTime.end.split(':')[1]);
    return start < lunchEnd && end > lunchStart;
  };

  const style = {
    backgroundColor: isOver ? '#f0f9ff' : hasConflicts ? '#fef2f2' : undefined,
    borderColor: isOver ? '#3b82f6' : hasConflicts ? '#ef4444' : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 h-16 p-1 bg-white hover:bg-gray-50 transition-colors relative ${
        isOver ? 'border-2 border-blue-400 bg-blue-50' : 
        hasConflicts ? 'border-2 border-red-400 bg-red-50' : ''
      }`}
    >
      {/* Индикатор конфликта */}
      {hasConflicts && (
        <div className="absolute top-1 right-1 z-10" title="Конфликт расписания">
          <AlertTriangle className="h-3 w-3 text-red-500" />
        </div>
      )}
      
      {(cellLessons.length > 0 || cellExternal.length > 0) && (
        <div className="space-y-1">
          {cellExternal.map(ext => (
            <div
              key={`ext-${ext.id}`}
              className="bg-gray-300/70 text-gray-800 p-2 rounded-lg shadow-sm border border-dashed border-gray-400 cursor-not-allowed opacity-70"
              title="Существующий урок (только для чтения)"
            >
              <div className="text-[10px] font-semibold flex items-center justify-between">
                <span>{ext.subject}</span>
                <span className="text-[8px] uppercase tracking-wide">EXIST</span>
              </div>
              <div className="text-[10px]">{ext.groupName}</div>
              <div className="text-[10px] opacity-80 flex items-center"><Clock className="h-3 w-3 mr-1" />{ext.startTime}</div>
              {ext.classroomName && (
                <div className="text-[10px] opacity-80 flex items-center"><MapPin className="h-3 w-3 mr-1" />{ext.classroomName}</div>
              )}
            </div>
          ))}
          {cellLessons.map(lesson => (
            <div key={lesson.id} className="relative">
              <DraggableLessonCard
                lesson={lesson}
                onClick={() => {}}
              />
              {crossesLunch(lesson.startTime, lesson.endTime) && (
                <span className="absolute top-1 right-1 text-[10px] bg-red-600 text-white rounded px-1">обед</span>
              )}
            </div>
          ))}
        </div>
      )}
      {cellLessons.length === 0 && cellExternal.length === 0 && (
        <div className="h-full w-full flex items-center justify-center text-gray-300">
          <div className="text-xs">
            {isLunchSlot ? 'Обеденный перерыв' : isOver ? 'Отпустите здесь' : 'Свободно'}
          </div>
        </div>
      )}
    </div>
  );
};

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  lessons,
  onUpdateLessons,
  quarterSettings,
  workingHours,
  slotStepMinutes,
  externalLessons = [],
  lessonDurationMinutes,
  breakMinutes,
  lunchBreakTime = { start: '12:00', end: '13:00' },
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ScheduleLesson | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    groups: [] as string[],
    subjects: [] as string[],
    teachers: [] as string[],
  });

  // Состояния для системы конфликтов
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    lesson: ScheduleLesson;
    targetDate: string;
    targetTime: string;
    conflicts: ConflictInfo[];
  } | null>(null);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [alternativeSlots, setAlternativeSlots] = useState<Array<{date: string, time: string, score: number}>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Генерируем временные слоты динамически на основе сгенерированного расписания
  const timeSlots = useMemo(() => {
    if (lessons.length === 0) {
      // Если нет уроков, используем старую логику для показа пустой сетки
      const slots: TimeSlot[] = [];
      const [startH, startM] = workingHours.start.split(':').map(Number);
      const [endH, endM] = workingHours.end.split(':').map(Number);
      const step = typeof slotStepMinutes === 'number' && slotStepMinutes > 0 ? slotStepMinutes : 60;

      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      // Разбираем обеденный перерыв
      const [lunchStartH, lunchStartM] = lunchBreakTime.start.split(':').map(Number);
      const [lunchEndH, lunchEndM] = lunchBreakTime.end.split(':').map(Number);
      const lunchStartMinutes = lunchStartH * 60 + (lunchStartM || 0);
      const lunchEndMinutes = lunchEndH * 60 + (lunchEndM || 0);

      const toTimeStr = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      // Функция для генерации слотов в диапазоне
      const buildSlots = (from: number, to: number) => {
        let current = from;
        while (current + step <= to) {
          const slotEnd = current + step;
          const isLunch = current < lunchEndMinutes && slotEnd > lunchStartMinutes;
          slots.push({
            time: toTimeStr(current),
            hour: Math.floor(current / 60),
            minute: current % 60,
            isLunchSlot: isLunch,
          });
          current += step;
        }
      };

      // Слоты до обеденного перерыва
      buildSlots(startMinutes, lunchStartMinutes);

      // Слоты после обеденного перерыва
      buildSlots(lunchEndMinutes, endMinutes);

      return slots;
    }

    // Извлекаем уникальные времена начала уроков и сортируем
    const uniqueTimes = [...new Set(lessons.map(lesson => lesson.startTime))];
    const sortedTimes = uniqueTimes.sort();

    return sortedTimes.map(time => {
      const [hour, minute] = time.split(':').map(Number);
      return {
        time,
        hour,
        minute,
        isLunchSlot: false, // Пока не определяем обеденные слоты динамически
      };
    });
  }, [lessons, workingHours, slotStepMinutes, lunchBreakTime]);

  // Генерируем рабочие дни динамически на основе сгенерированного расписания
  const workingDays = useMemo(() => {
    if (lessons.length === 0) {
      // Если нет уроков, используем старую логику для показа пустой сетки
      const days: string[] = [];
      const start = new Date(quarterSettings.startDate);
      const end = new Date(quarterSettings.endDate);
      const current = new Date(start);
      const maxDays = 60;
      let dayCount = 0;

      while (current <= end && dayCount < maxDays) {
        const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay();
        
        if (quarterSettings.workingDays.includes(dayOfWeek)) {
          days.push(current.toISOString().split('T')[0]);
          dayCount++;
        }
        
        current.setDate(current.getDate() + 1);
      }

      return days;
    }

    // Извлекаем уникальные даты из уроков и сортируем
    const uniqueDates = [...new Set(lessons.map(lesson => lesson.date))];
    return uniqueDates.sort();
  }, [lessons, quarterSettings]);

  // Получаем уникальные значения для фильтров
  const filterOptions = useMemo(() => {
    const groups = [...new Set(lessons.map(l => l.groupName))];
    const subjects = [...new Set(lessons.map(l => l.subject))];
    const teachers = [...new Set(lessons.map(l => l.teacherName))];
    
    return { groups, subjects, teachers };
  }, [lessons]);

  // Анализ конфликтов в текущем расписании
  const conflictAnalysis = useMemo(() => {
    const conflicts: ConflictInfo[] = [];
    const conflictedLessons = new Set<string>();
    // Для анализа используем совокупность новых и существующих
    const all = [...lessons, ...externalLessons];

    for (const lesson of all) {
      const otherLessons = all.filter(l => l.id !== lesson.id);
      
      // Проверка конфликтов учителя
      const teacherConflicts = otherLessons.filter(
        l => l.teacherId === lesson.teacherId && l.date === lesson.date && l.startTime === lesson.startTime
      );
      
      // Проверка конфликтов группы
      const groupConflicts = otherLessons.filter(
        l => l.groupId === lesson.groupId && l.date === lesson.date && l.startTime === lesson.startTime
      );
      
      // Проверка конфликтов аудитории
      const classroomConflicts = lesson.classroomId ? otherLessons.filter(
        l => l.classroomId === lesson.classroomId && l.date === lesson.date && l.startTime === lesson.startTime
      ) : [];

      // Добавляем уникальные конфликты
      teacherConflicts.forEach(conflictLesson => {
        const conflictId = `teacher-${lesson.teacherId}-${lesson.date}-${lesson.startTime}`;
        if (!conflictedLessons.has(conflictId)) {
          conflicts.push({
            type: 'teacher',
            severity: 'error',
            title: 'Конфликт преподавателя',
            description: `${lesson.teacherName} ведет несколько уроков одновременно`,
            conflictingLessons: [lesson, conflictLesson]
          });
          conflictedLessons.add(conflictId);
        }
      });

      groupConflicts.forEach(conflictLesson => {
        const conflictId = `group-${lesson.groupId}-${lesson.date}-${lesson.startTime}`;
        if (!conflictedLessons.has(conflictId)) {
          conflicts.push({
            type: 'group',
            severity: 'error',
            title: 'Конфликт группы',
            description: `Группа ${lesson.groupName} имеет несколько уроков одновременно`,
            conflictingLessons: [lesson, conflictLesson]
          });
          conflictedLessons.add(conflictId);
        }
      });

      classroomConflicts.forEach(conflictLesson => {
        const conflictId = `classroom-${lesson.classroomId}-${lesson.date}-${lesson.startTime}`;
        if (!conflictedLessons.has(conflictId)) {
          conflicts.push({
            type: 'classroom',
            severity: 'error',
            title: 'Конфликт аудитории',
            description: `Аудитория ${lesson.classroomName} занята несколькими уроками одновременно`,
            conflictingLessons: [lesson, conflictLesson]
          });
          conflictedLessons.add(conflictId);
        }
      });
    }

    return {
      total: conflicts.length,
      byType: {
        teacher: conflicts.filter(c => c.type === 'teacher').length,
        group: conflicts.filter(c => c.type === 'group').length,
        classroom: conflicts.filter(c => c.type === 'classroom').length,
      },
      conflicts
    };
  }, [lessons, externalLessons]);

  // Фильтруем уроки
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      if (filters.groups.length > 0 && !filters.groups.includes(lesson.groupName)) {
        return false;
      }
      if (filters.subjects.length > 0 && !filters.subjects.includes(lesson.subject)) {
        return false;
      }
      if (filters.teachers.length > 0 && !filters.teachers.includes(lesson.teacherName)) {
        return false;
      }
      return true;
    });
  }, [lessons, filters]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Получаем информацию о перемещаемом уроке
    const lessonId = active.id as string;
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    // Парсим целевую позицию
    const overIdString = over.id as string;
    console.log('Drop target:', overIdString); // Для отладки

    if (overIdString.startsWith('slot::')) {
      const [, targetDate, targetTime] = overIdString.split('::');

      console.log('Target date:', targetDate, 'Target time:', targetTime); // Для отладки
      
      // Проверяем, не перемещается ли урок в обеденный перерыв
      const targetMinutes = parseInt(targetTime.split(':')[0]) * 60 + parseInt(targetTime.split(':')[1]);
      const lessonEndMinutes = targetMinutes + (lessonDurationMinutes || 45);
      const lunchStartMinutes = parseInt(lunchBreakTime.start.split(':')[0]) * 60 + parseInt(lunchBreakTime.start.split(':')[1]);
      const lunchEndMinutes = parseInt(lunchBreakTime.end.split(':')[0]) * 60 + parseInt(lunchBreakTime.end.split(':')[1]);
      
      if (targetMinutes < lunchEndMinutes && lessonEndMinutes > lunchStartMinutes) {
        // Урок пересекается с обеденным перерывом
        setPendingMove({
          lesson,
          targetDate,
          targetTime,
          conflicts: [{
            type: 'time',
            severity: 'error',
            title: 'Обеденный перерыв',
            description: 'Нельзя планировать уроки во время обеденного перерыва',
            suggestions: [
              'Выберите время до или после обеденного перерыва',
              'Перенесите урок на другое время'
            ]
          }]
        });
        setShowConflictModal(true);
        return;
      }
      
      // Проверяем, не перемещается ли урок в то же место
      if (lesson.date === targetDate && lesson.startTime === targetTime) {
        return;
      }

      // Валидация перемещения
      const validation = validateLessonMove(lesson, targetDate, targetTime, lessons);
      
      if (!validation.isValid || validation.conflicts.length > 0) {
        // Показываем модальное окно конфликтов
        setPendingMove({
          lesson,
          targetDate,
          targetTime,
          conflicts: validation.conflicts
        });
        setShowConflictModal(true);
        return;
      }

      // Если конфликтов нет, выполняем перемещение
      executeLessonMove(lesson, targetDate, targetTime);
    }
  };

  // Функция выполнения перемещения урока
  const executeLessonMove = (lesson: ScheduleLesson, targetDate: string, targetTime: string) => {
    const updatedLessons = lessons.map(l => {
      if (l.id === lesson.id) {
        return {
          ...l,
          date: targetDate,
          startTime: targetTime,
        };
      }
      return l;
    });
    
    onUpdateLessons(updatedLessons);
  };

  // Обработчики модального окна конфликтов
  const handleConflictConfirm = () => {
    if (pendingMove) {
      executeLessonMove(pendingMove.lesson, pendingMove.targetDate, pendingMove.targetTime);
    }
    setShowConflictModal(false);
    setPendingMove(null);
  };

  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setPendingMove(null);
  };

  const handleFindAlternatives = () => {
    if (pendingMove) {
      const alternatives = findAlternativeSlots(
        pendingMove.lesson,
        lessons,
        workingDays,
        timeSlots
      );
      setAlternativeSlots(alternatives);
      setShowAlternativesModal(true);
    }
  };

  const handleLessonClick = (lesson: ScheduleLesson) => {
    setSelectedLesson(lesson);
  };

  const getDateLabel = (dateString: string) => {
    // Парсим дату в UTC чтобы исключить сдвиг часового пояса
    const [y,m,d] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(y, (m||1)-1, d||1));
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const dow = date.getUTCDay();
    return `${dayNames[dow]} ${String(d).padStart(2,'0')} ${monthNames[date.getUTCMonth()]}`;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen">
        {/* Левая панель - фильтры */}
        <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Фильтры</h3>
          </div>

          {/* Фильтр по группам */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-2">Группы</h4>
            <div className="space-y-1">
              {filterOptions.groups.map(group => (
                <label key={group} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.groups.includes(group)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(f => ({ ...f, groups: [...f.groups, group] }));
                      } else {
                        setFilters(f => ({ ...f, groups: f.groups.filter(g => g !== group) }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 mr-2"
                  />
                  <span className="text-sm">{group}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Фильтр по предметам */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-2">Предметы</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filterOptions.subjects.map(subject => (
                <label key={subject} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.subjects.includes(subject)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(f => ({ ...f, subjects: [...f.subjects, subject] }));
                      } else {
                        setFilters(f => ({ ...f, subjects: f.subjects.filter(s => s !== subject) }));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 mr-2"
                  />
                  <span className="text-sm">{subject}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Статистика */}
          <div className="bg-white rounded-lg p-3 border mb-4">
            <h4 className="font-medium text-sm mb-2">Статистика</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Всего уроков: {filteredLessons.length}</div>
              <div>Показано дней: {workingDays.length}</div>
              <div>Временных слотов: {timeSlots.length}</div>
            </div>
          </div>

          {/* Модуль конфликтов */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center mb-2">
              <AlertTriangle className={`h-4 w-4 mr-2 ${conflictAnalysis.total > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <h4 className="font-medium text-sm">Конфликты</h4>
            </div>
            
            {conflictAnalysis.total === 0 ? (
              <div className="text-xs text-green-600">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Конфликтов не найдено
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-red-600 font-medium">
                  Найдено: {conflictAnalysis.total} конфликт(ов)
                </div>
                
                <div className="space-y-1">
                  {conflictAnalysis.byType.teacher > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-red-500" />
                        Преподаватели
                      </span>
                      <span className="text-red-600 font-medium">{conflictAnalysis.byType.teacher}</span>
                    </div>
                  )}
                  
                  {conflictAnalysis.byType.group > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1 text-red-500" />
                        Группы
                      </span>
                      <span className="text-red-600 font-medium">{conflictAnalysis.byType.group}</span>
                    </div>
                  )}
                  
                  {conflictAnalysis.byType.classroom > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-red-500" />
                        Аудитории
                      </span>
                      <span className="text-red-600 font-medium">{conflictAnalysis.byType.classroom}</span>
                    </div>
                  )}
                </div>

                {conflictAnalysis.conflicts.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <div className="text-xs font-medium text-gray-700 mb-1">Детали конфликтов:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {conflictAnalysis.conflicts.slice(0, 5).map((conflict, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                          <div className="text-xs font-medium text-red-800">{conflict.title}</div>
                          <div className="text-xs text-red-600 mt-1">{conflict.description}</div>
                          {conflict.conflictingLessons && (
                            <div className="mt-1 space-y-1">
                              {conflict.conflictingLessons.map(lesson => (
                                <div key={lesson.id} className="text-xs bg-white rounded px-1 py-0.5 border">
                                  {lesson.subject} - {lesson.groupName} ({lesson.date} в {lesson.startTime})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {conflictAnalysis.conflicts.length > 5 && (
                        <div className="text-xs text-gray-500 text-center">
                          ... и еще {conflictAnalysis.conflicts.length - 5} конфликт(ов)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Центральная область - сетка (полный экран) */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Сетка расписания</h2>
              <div className="text-sm text-gray-600">
                {quarterSettings.startDate} — {quarterSettings.endDate}
              </div>
            </div>

            {/* Таблица расписания */}
            <div className="border rounded-lg overflow-x-auto bg-white">
              <table className="min-w-max">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-r w-20 p-2 text-xs font-medium sticky left-0 bg-gray-50 z-10">Время</th>
                    {workingDays.map(date => (
                      <th key={date} className="border-r min-w-[140px] p-2 text-xs font-medium whitespace-nowrap">
                        {getDateLabel(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(timeSlot => (
                    <tr key={timeSlot.time}>
                      <td className="border-r border-b p-2 bg-gray-50 text-xs font-medium sticky left-0 z-10">
                        {timeSlot.time}
                      </td>
                      {workingDays.map(date => (
                        <td key={`${date}-${timeSlot.time}`} className="border-r border-b p-0">
                          <TimeSlotCell
                            date={date}
                            timeSlot={timeSlot}
                            lessons={filteredLessons}
                            externalLessons={externalLessons}
                            allLessons={lessons}
                            isLunchSlot={timeSlot.isLunchSlot}
                            lunchBreakTime={lunchBreakTime}
                            onDropLesson={(lessonId, newDate, newTime) => {
                              const updatedLessons = lessons.map(lesson => {
                                if (lesson.id === lessonId) {
                                  return { ...lesson, date: newDate, startTime: newTime };
                                }
                                return lesson;
                              });
                              onUpdateLessons(updatedLessons);
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно конфликтов */}
      <ConflictModal
        isOpen={showConflictModal}
        conflicts={pendingMove?.conflicts || []}
        lessonBeingMoved={pendingMove?.lesson || null}
        targetDate={pendingMove?.targetDate || ''}
        targetTime={pendingMove?.targetTime || ''}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        onFindAlternative={handleFindAlternatives}
      />

      {/* Модальное окно альтернативных слотов */}
      {showAlternativesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Свободные временные слоты</h3>
              <button 
                onClick={() => setShowAlternativesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {alternativeSlots.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Найдены следующие свободные слоты для урока:
                </p>
                {alternativeSlots.map((slot, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (pendingMove) {
                        executeLessonMove(pendingMove.lesson, slot.date, slot.time);
                        setShowAlternativesModal(false);
                        setShowConflictModal(false);
                        setPendingMove(null);
                      }
                    }}
                  >
                    <div>
                      <div className="font-medium">
                        {getDateLabel(slot.date)} в {slot.time}
                      </div>
                      <div className="text-xs text-gray-500">
                        Рейтинг: {slot.score}/100
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Свободные слоты не найдены</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowAlternativesModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <LessonCard
            lesson={filteredLessons.find(l => l.id === activeId)!}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ScheduleGrid;
