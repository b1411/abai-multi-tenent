import { LessonType } from '../types/lesson';

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  [LessonType.REGULAR]: 'Обычный урок',
  [LessonType.CONTROL_WORK]: 'Контрольная работа',
  [LessonType.EXAM]: 'Экзамен',
  [LessonType.TEST]: 'Тест',
  [LessonType.PRACTICAL]: 'Практическая работа',
  [LessonType.LAB]: 'Лабораторная работа'
};

export const LESSON_TYPE_COLORS: Record<LessonType, string> = {
  [LessonType.REGULAR]: 'bg-blue-100 text-blue-800',
  [LessonType.CONTROL_WORK]: 'bg-red-100 text-red-800',
  [LessonType.EXAM]: 'bg-purple-100 text-purple-800',
  [LessonType.TEST]: 'bg-yellow-100 text-yellow-800',
  [LessonType.PRACTICAL]: 'bg-green-100 text-green-800',
  [LessonType.LAB]: 'bg-indigo-100 text-indigo-800'
};

export const getLessonTypeLabel = (type: LessonType): string => {
  return LESSON_TYPE_LABELS[type] || type;
};

export const getLessonTypeColor = (type: LessonType): string => {
  return LESSON_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800';
};

export const getLessonTypeOptions = () => {
  return Object.entries(LESSON_TYPE_LABELS).map(([value, label]) => ({
    value: value as LessonType,
    label
  }));
};
