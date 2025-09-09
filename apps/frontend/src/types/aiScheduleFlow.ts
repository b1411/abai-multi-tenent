export interface GenerationConstraints {
  workingHours: { start: string; end: string };
  maxConsecutiveHours: number;
  preferredBreaks: number[];
  excludeWeekends: boolean;
  minBreakDuration: number;
}

export type GenerationType = 'full' | 'partial' | 'optimize';

export interface GenerationParams {
  startDate: string;
  endDate: string;
  groupIds: number[];
  constraints: GenerationConstraints;
  generationType: GenerationType;
  subjectHours?: Record<number, number>;
  subjectIds?: number[];
  teacherIds?: number[];
  /** Включает подробное логирование оптимизатора */
  debug?: boolean;
}

export interface DraftItem {
  tempId: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  groupId: number;
  teacherId?: number;
  roomType?: string;
  classroomId?: number | null;
  groupSize?: number;
}

export interface DraftStats {
  classroomsAssigned: number;
  [k: string]: unknown;
}

export interface OptimizedLesson {
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  groupId: number;
  teacherId?: number;
  roomType?: string;
  classroomId?: number | null;
}

export interface ConflictDescriptor {
  type: string;
  description: string;
  severity?: string;
}

export interface OptimizedScheduleResponse {
  generatedSchedule: OptimizedLesson[];
  conflicts: ConflictDescriptor[];
  suggestions?: string[];
  statistics?: Record<string, unknown> & { averageDailyLessons?: number };
  confidence?: number;
  // Агрегированные данные периодичности от локального оптимизатора
  recurringTemplates?: Array<{
    groupId: number;
    teacherId: number;
    studyPlanId?: number;
    subject: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number; // 1=Пн ... 7=Вс
    startDate: string;
    endDate: string;
    repeat: 'weekly' | 'biweekly';
    excludedDates: string[];
    isTemplate: boolean;
    roomId?: string | number;
    roomType?: string;
    roomCapacity?: number;
  }>;
  singleOccurrences?: Array<{
    groupId: number;
    teacherId: number;
    studyPlanId?: number;
    subject: string;
    startTime: string;
    endTime: string;
    date: string;
    repeat: 'once';
    excludedDates: string[];
    isTemplate: boolean;
    roomId?: string | number;
    roomType?: string;
    roomCapacity?: number;
  }>;
}

export interface ValidationResult {
  conflicts: ConflictDescriptor[];
  isOk: boolean;
}

export interface ApplyRawResponse {
  createdCount?: number;
  created?: unknown[];
}

export interface ApplyResult {
  success: boolean;
  count: number;
}

export interface DraftResponse {
  draft: DraftItem[];
  stats: DraftStats;
}

export interface OptimizeRequestBody {
  draft: DraftItem[];
  params: GenerationParams;
}

export type ApplyResponse = ApplyRawResponse;
