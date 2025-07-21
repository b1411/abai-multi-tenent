import { ApiProperty } from '@nestjs/swagger';

export enum ConflictType {
  TEACHER_CONFLICT = 'teacher_conflict',
  ROOM_CONFLICT = 'room_conflict',
  GROUP_CONFLICT = 'group_conflict',
  TIME_CONFLICT = 'time_conflict',
  CAPACITY_CONFLICT = 'capacity_conflict'
}

export enum ConflictSeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum SuggestionType {
  TIME_OPTIMIZATION = 'time_optimization',
  ROOM_OPTIMIZATION = 'room_optimization',
  TEACHER_BALANCING = 'teacher_balancing',
  WORKLOAD_DISTRIBUTION = 'workload_distribution',
  BREAK_OPTIMIZATION = 'break_optimization'
}

export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export class GeneratedScheduleItemDto {
  @ApiProperty({ example: 'monday', description: 'День недели' })
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

  @ApiProperty({ example: '09:00', description: 'Время начала занятия' })
  startTime: string;

  @ApiProperty({ example: '10:30', description: 'Время окончания занятия' })
  endTime: string;

  @ApiProperty({ example: 'Математика', description: 'Название предмета' })
  subject: string;

  @ApiProperty({ example: 'МК24-1М', description: 'ID группы' })
  groupId: string;

  @ApiProperty({ example: '1', description: 'ID преподавателя' })
  teacherId: string;

  @ApiProperty({ example: 'Иванова И.И.', description: 'Имя преподавателя' })
  teacherName: string;

  @ApiProperty({ example: '301', description: 'Номер аудитории' })
  roomId: string;

  @ApiProperty({ example: 'lesson', description: 'Тип занятия' })
  type: 'lesson' | 'consultation' | 'extra';

  @ApiProperty({ example: 'weekly', description: 'Повторяемость' })
  repeat: 'weekly' | 'biweekly' | 'once';

  @ApiProperty({ example: 'upcoming', description: 'Статус занятия' })
  status: 'upcoming' | 'completed' | 'cancelled';

  @ApiProperty({ example: '2024-09-02', description: 'Конкретная дата занятия' })
  date?: string;

  @ApiProperty({ example: 'Lecture hall', description: 'Тип аудитории' })
  roomType?: string;

  @ApiProperty({ example: 50, description: 'Вместимость аудитории' })
  roomCapacity?: number;

  @ApiProperty({ example: 25, description: 'Количество студентов в группе' })
  groupSize?: number;
}

export class ConflictInfoDto {
  @ApiProperty({ enum: ConflictType, description: 'Тип конфликта' })
  type: ConflictType;

  @ApiProperty({ example: 'Преподаватель Иванов И.И. занят в это время в другой группе', description: 'Описание конфликта' })
  description: string;

  @ApiProperty({ enum: ConflictSeverity, description: 'Серьезность конфликта' })
  severity: ConflictSeverity;

  @ApiProperty({ example: [0, 3], description: 'Индексы затронутых элементов расписания' })
  affectedItems: number[];

  @ApiProperty({ example: 'Перенести занятие на 14:00 или заменить преподавателя', description: 'Предложение по решению' })
  solution?: string;

  @ApiProperty({ example: '09:00-10:30', description: 'Временной интервал конфликта' })
  timeSlot?: string;

  @ApiProperty({ example: '301', description: 'Аудитория с конфликтом' })
  conflictingRoom?: string;

  @ApiProperty({ example: 'Петров П.П.', description: 'Преподаватель с конфликтом' })
  conflictingTeacher?: string;
}

export class OptimizationSuggestionDto {
  @ApiProperty({ enum: SuggestionType, description: 'Тип предложения' })
  type: SuggestionType;

  @ApiProperty({ example: 'Рекомендуется добавить перерыв между занятиями', description: 'Описание предложения' })
  description: string;

  @ApiProperty({ enum: SuggestionPriority, description: 'Приоритет предложения' })
  priority: SuggestionPriority;

  @ApiProperty({ example: [1, 2], description: 'Индексы элементов для оптимизации' })
  affectedItems?: number[];

  @ApiProperty({ example: 'Улучшит качество обучения и снизит утомляемость', description: 'Обоснование предложения' })
  reasoning?: string;

  @ApiProperty({ example: 15, description: 'Ожидаемый процент улучшения' })
  expectedImprovement?: number;
}

export class ScheduleStatisticsDto {
  @ApiProperty({ example: 20, description: 'Общее количество занятий' })
  totalLessons: number;

  @ApiProperty({ example: 5, description: 'Количество преподавателей' })
  teachersCount: number;

  @ApiProperty({ example: 8, description: 'Количество аудиторий' })
  roomsCount: number;

  @ApiProperty({ example: 3, description: 'Количество групп' })
  groupsCount: number;

  @ApiProperty({ example: 85, description: 'Процент использования аудиторий' })
  roomUtilization: number;

  @ApiProperty({ example: 92, description: 'Процент загрузки преподавателей' })
  teacherWorkload: number;

  @ApiProperty({ example: 2, description: 'Среднее количество окон у студентов' })
  averageStudentGaps: number;

  @ApiProperty({ example: 6, description: 'Среднее количество занятий в день' })
  averageDailyLessons: number;
}

export class AIScheduleResponseDto {
  @ApiProperty({ type: [GeneratedScheduleItemDto], description: 'Сгенерированное расписание' })
  generatedSchedule: GeneratedScheduleItemDto[];

  @ApiProperty({ type: [ConflictInfoDto], description: 'Обнаруженные конфликты' })
  conflicts: ConflictInfoDto[];

  @ApiProperty({ type: [OptimizationSuggestionDto], description: 'Предложения по оптимизации' })
  suggestions: OptimizationSuggestionDto[];

  @ApiProperty({ example: 'Расписание составлено с учетом всех требований. Обнаружено 2 незначительных конфликта, которые можно решить переносом занятий.', description: 'Объяснение логики составления' })
  reasoning: string;

  @ApiProperty({ example: 0.87, minimum: 0, maximum: 1, description: 'Уровень уверенности ИИ в качестве расписания' })
  confidence: number;

  @ApiProperty({ type: ScheduleStatisticsDto, description: 'Статистика сгенерированного расписания' })
  statistics: ScheduleStatisticsDto;

  @ApiProperty({ example: '2024-01-20T10:30:00Z', description: 'Время генерации' })
  generatedAt: string;

  @ApiProperty({ example: 'gpt-4o-2024-08-06', description: 'Модель ИИ, использованная для генерации' })
  aiModel: string;

  @ApiProperty({ example: '1.2.0', description: 'Версия алгоритма генерации' })
  algorithmVersion: string;
}
