import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Clock,
  Calendar,
  BookOpen,
  X,
  CheckCircle,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  User,
  Heart,
  Star
} from 'lucide-react';
import { Button } from './ui';

interface ScheduleConstraints {
  workingHours: { start: string; end: string };
  maxLessonsPerDay: number;
  lunchBreakTime: { start: string; end: string };
  lessonDuration: number;
  breakDuration: number;
  forbiddenFirstSubjects: string[];
  forbiddenLastSubjects: string[];
  preferredDays: { [subjectName: string]: number[] };
}

interface SubjectOption {
  id: number;
  name: string;
  groupId: number;
  groupName: string;
  teacherId: number;
  teacherName: string;
}

interface TeacherPreference {
  id: string;
  type: 'time' | 'day' | 'lesson' | 'classroom' | 'special';
  title: string;
  description: string;
  enabled: boolean;
  value?: string | number | number[] | { startTime?: string; endTime?: string; maxConsecutive?: number; preferredDays?: number[]; preferredClassrooms?: number[] };
}

interface ScheduleConstraintsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  constraints: ScheduleConstraints;
  onSave: (constraints: ScheduleConstraints) => void;
  availableSubjects: SubjectOption[];
  teacherPreferences?: { [key: string]: TeacherPreference[] };
  onTeacherPreferencesChange?: (preferences: { [key: string]: TeacherPreference[] }) => void;
}

const ScheduleConstraintsEditor: React.FC<ScheduleConstraintsEditorProps> = ({
  isOpen,
  onClose,
  constraints,
  onSave,
  availableSubjects,
  teacherPreferences = {},
  onTeacherPreferencesChange
}) => {
  const [localConstraints, setLocalConstraints] = useState<ScheduleConstraints>(constraints);
  const [localTeacherPreferences, setLocalTeacherPreferences] = useState<{ [key: string]: TeacherPreference[] }>(teacherPreferences);
  const [expandedSections, setExpandedSections] = useState({
    workingHours: true,
    lunchBreak: true,
    lessonSettings: true,
    subjectRestrictions: false,
    preferredDays: false,
    teacherPreferences: false
  });

  // Синхронизируем локальное состояние при изменении пропсов
  useEffect(() => {
    setLocalConstraints(constraints);
  }, [constraints]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = () => {
    onSave(localConstraints);
    onClose();
  };

  const handleReset = () => {
    setLocalConstraints({
      workingHours: { start: '08:00', end: '15:00' },
      maxLessonsPerDay: 7,
      lunchBreakTime: { start: '12:00', end: '13:00' },
      lessonDuration: 45,
      breakDuration: 10,
      forbiddenFirstSubjects: [],
      forbiddenLastSubjects: [],
      preferredDays: {}
    });
  };

  const updateWorkingHours = (field: 'start' | 'end', value: string) => {
    setLocalConstraints(prev => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: value }
    }));
  };

  const updateLunchBreak = (field: 'start' | 'end', value: string) => {
    setLocalConstraints(prev => ({
      ...prev,
      lunchBreakTime: { ...prev.lunchBreakTime, [field]: value }
    }));
  };

  const toggleSubjectRestriction = (subject: string, type: 'first' | 'last') => {
    setLocalConstraints(prev => {
      const key = type === 'first' ? 'forbiddenFirstSubjects' : 'forbiddenLastSubjects';
      const current = prev[key];
      const updated = current.includes(subject)
        ? current.filter(s => s !== subject)
        : [...current, subject];

      return { ...prev, [key]: updated };
    });
  };

  const togglePreferredDay = (subjectName: string, day: number) => {
    setLocalConstraints(prev => {
      const currentDays = prev.preferredDays[subjectName] || [];
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];

      return {
        ...prev,
        preferredDays: {
          ...prev.preferredDays,
          [subjectName]: updatedDays
        }
      };
    });
  };

  const getUniqueSubjects = () => {
    const subjectNames = new Set<string>();
    availableSubjects.forEach(subject => {
      subjectNames.add(subject.name);
    });
    return Array.from(subjectNames).sort();
  };

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dayNumbers = [1, 2, 3, 4, 5, 6];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Редактор ограничений расписания</h2>
                <p className="text-sm text-gray-600">Настройте правила составления расписания</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Содержимое */}
          <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
            <div className="space-y-6">

              {/* Рабочее время */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('workingHours')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium text-gray-900">Рабочее время</h3>
                  </div>
                  {expandedSections.workingHours ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {expandedSections.workingHours && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Начало учебного дня
                            </label>
                            <input
                              type="time"
                              value={localConstraints.workingHours.start}
                              onChange={(e) => updateWorkingHours('start', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Конец учебного дня
                            </label>
                            <input
                              type="time"
                              value={localConstraints.workingHours.end}
                              onChange={(e) => updateWorkingHours('end', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Максимум уроков в день
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={localConstraints.maxLessonsPerDay}
                            onChange={(e) => setLocalConstraints(prev => ({
                              ...prev,
                              maxLessonsPerDay: parseInt(e.target.value) || 1
                            }))}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Обеденный перерыв */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('lunchBreak')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium text-gray-900">Обеденный перерыв</h3>
                  </div>
                  {expandedSections.lunchBreak ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {expandedSections.lunchBreak && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Начало перерыва
                            </label>
                            <input
                              type="time"
                              value={localConstraints.lunchBreakTime.start}
                              onChange={(e) => updateLunchBreak('start', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Конец перерыва
                            </label>
                            <input
                              type="time"
                              value={localConstraints.lunchBreakTime.end}
                              onChange={(e) => updateLunchBreak('end', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Настройки уроков */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('lessonSettings')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium text-gray-900">Настройки уроков</h3>
                  </div>
                  {expandedSections.lessonSettings ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {expandedSections.lessonSettings && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Длительность урока (мин)
                            </label>
                            <input
                              type="number"
                              min="30"
                              max="60"
                              value={localConstraints.lessonDuration}
                              onChange={(e) => setLocalConstraints(prev => ({
                                ...prev,
                                lessonDuration: parseInt(e.target.value) || 45
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Длительность перемены (мин)
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="20"
                              value={localConstraints.breakDuration}
                              onChange={(e) => setLocalConstraints(prev => ({
                                ...prev,
                                breakDuration: parseInt(e.target.value) || 10
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ограничения по предметам */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('subjectRestrictions')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium text-gray-900">Ограничения по предметам</h3>
                  </div>
                  {expandedSections.subjectRestrictions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {expandedSections.subjectRestrictions && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Не ставить первым уроком:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getUniqueSubjects().map(subject => (
                              <label key={`first-${subject}`} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={localConstraints.forbiddenFirstSubjects.includes(subject)}
                                  onChange={() => toggleSubjectRestriction(subject, 'first')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{subject}</span>
                              </label>
                            ))}
                          </div>
                          {getUniqueSubjects().length === 0 && (
                            <p className="text-sm text-gray-500 italic">Сначала выберите группы и предметы</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Не ставить последним уроком:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getUniqueSubjects().map(subject => (
                              <label key={`last-${subject}`} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={localConstraints.forbiddenLastSubjects.includes(subject)}
                                  onChange={() => toggleSubjectRestriction(subject, 'last')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{subject}</span>
                              </label>
                            ))}
                          </div>
                          {getUniqueSubjects().length === 0 && (
                            <p className="text-sm text-gray-500 italic">Сначала выберите группы и предметы</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Предпочитаемые дни */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('preferredDays')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-medium text-gray-900">Предпочитаемые дни для предметов</h3>
                  </div>
                  {expandedSections.preferredDays ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {expandedSections.preferredDays && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                              Выберите дни недели, в которые предпочтительно проводить каждый предмет.
                              Алгоритм будет стараться учитывать эти предпочтения при составлении расписания.
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {getUniqueSubjects().map(subject => {
                            const preferredDays = localConstraints.preferredDays[subject] || [];

                            return (
                              <div key={subject} className="border rounded-lg p-4 bg-gray-50">
                                <div className="font-medium text-gray-900 mb-3">{subject}</div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {dayNumbers.map(dayNum => (
                                    <label key={dayNum} className="flex items-center space-x-1">
                                      <input
                                        type="checkbox"
                                        checked={preferredDays.includes(dayNum)}
                                        onChange={() => togglePreferredDay(subject, dayNum)}
                                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span className="text-xs text-gray-700">{dayNames[dayNum - 1]}</span>
                                    </label>
                                  ))}
                                </div>
                                {preferredDays.length > 0 && (
                                  <div className="mt-2 text-xs text-blue-600">
                                    Предпочитаемые дни: {preferredDays.map(d => dayNames[d - 1]).join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Пожелания педагогов */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('teacherPreferences')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-pink-500" />
                    <h3 className="font-medium text-gray-900">Пожелания педагогов</h3>
                  </div>
                  {expandedSections.teacherPreferences ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                <AnimatePresence>
                  {expandedSections.teacherPreferences && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-pink-800">
                              Настройте индивидуальные предпочтения для каждого преподавателя.
                              Эти настройки помогут алгоритму создать более комфортное расписание.
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {availableSubjects.reduce((uniqueTeachers: { id: number; name: string }[], subject) => {
                            const teacherExists = uniqueTeachers.find(t => t.id === subject.teacherId);
                            if (!teacherExists) {
                              uniqueTeachers.push({
                                id: subject.teacherId,
                                name: subject.teacherName
                              });
                            }
                            return uniqueTeachers;
                          }, []).map(teacher => {
                            const teacherPrefs = localTeacherPreferences[`teacher-${teacher.id}`] || [];

                            return (
                              <div key={teacher.id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="font-medium text-gray-900 mb-3 flex items-center">
                                  <User className="h-4 w-4 mr-2 text-gray-600" />
                                  {teacher.name}
                                </div>

                                <div className="space-y-3">
                                  {[
                                    { type: 'time', title: '⏰ Временные ограничения', icon: Clock, items: [
                                      { id: 'after-14', title: 'Не работать после 14:00', description: 'Избегать уроков после 14:00' },
                                      { id: 'start-10', title: 'Начинать с 10:00', description: 'Предпочитать уроки начиная с 10:00' }
                                    ]},
                                    { type: 'day', title: '📅 Предпочтения по дням', icon: Calendar, items: [
                                      { id: 'avoid-tuesday', title: 'Избегать вторник', description: 'Не ставить уроки по вторникам' },
                                      { id: 'prefer-monday', title: 'Предпочитать понедельник', description: 'Предпочитать уроки в понедельник' }
                                    ]},
                                    { type: 'lesson', title: '📚 Ограничения по урокам', icon: BookOpen, items: [
                                      { id: 'no-first-lesson', title: 'Не первым уроком', description: 'Не ставить первым уроком в день' },
                                      { id: 'max-2-consecutive', title: 'Не более 2 подряд', description: 'Максимум 2 урока подряд' }
                                    ]},
                                    { type: 'classroom', title: '🏫 Аудиторные предпочтения', icon: Settings, items: [
                                      { id: 'room-202', title: 'Аудитория 202', description: 'Предпочитать аудиторию 202' },
                                      { id: 'first-floor', title: 'Первый этаж', description: 'Только аудитории на первом этаже' }
                                    ]}
                                  ].map(category => (
                                    <div key={category.type} className="border rounded-lg p-3 bg-white">
                                      <h5 className="font-medium text-gray-800 mb-2 flex items-center text-sm">
                                        {category.title}
                                      </h5>
                                      <div className="space-y-2">
                                        {category.items.map(item => {
                                          const existingPref = teacherPrefs.find(p => p.id === item.id);
                                          const isEnabled = existingPref?.enabled || false;

                                          return (
                                            <label key={item.id} className="flex items-start space-x-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={(e) => {
                                                  const newPrefs = [...teacherPrefs];
                                                  const existingIndex = newPrefs.findIndex(p => p.id === item.id);

                                                  if (e.target.checked) {
                                                    if (existingIndex === -1) {
                                                      newPrefs.push({
                                                        id: item.id,
                                                        type: category.type as any,
                                                        title: item.title,
                                                        description: item.description,
                                                        enabled: true
                                                      });
                                                    } else {
                                                      newPrefs[existingIndex].enabled = true;
                                                    }
                                                  } else {
                                                    if (existingIndex !== -1) {
                                                      newPrefs[existingIndex].enabled = false;
                                                    }
                                                  }

                                                  setLocalTeacherPreferences(prev => ({
                                                    ...prev,
                                                    [`teacher-${teacher.id}`]: newPrefs
                                                  }));

                                                  if (onTeacherPreferencesChange) {
                                                    onTeacherPreferencesChange({
                                                      ...localTeacherPreferences,
                                                      [`teacher-${teacher.id}`]: newPrefs
                                                    });
                                                  }
                                                }}
                                                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mt-0.5"
                                              />
                                              <div className="flex-1">
                                                <div className={`text-sm font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-600'}`}>
                                                  {item.title}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                  {item.description}
                                                </div>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {teacherPrefs.filter(p => p.enabled).length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="text-xs text-pink-600">
                                      Активных пожеланий: {teacherPrefs.filter(p => p.enabled).length}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Сбросить</span>
            </Button>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Сохранить</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleConstraintsEditor;
