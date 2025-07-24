import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateScheduleDto {
  @ApiProperty({ description: 'ID учебного плана' })
  @IsNumber()
  @Type(() => Number)
  studyPlanId: number;

  @ApiProperty({ description: 'ID группы' })
  @IsNumber()
  @Type(() => Number)
  groupId: number;

  @ApiProperty({ description: 'ID преподавателя' })
  @IsNumber()
  @Type(() => Number)
  teacherId: number;

  @ApiProperty({ description: 'Дата начала' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Дата окончания' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ 
    description: 'Предпочитаемое время занятий', 
    required: false,
    example: ['09:00', '10:30', '14:00']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTimes?: string[];

  @ApiProperty({ 
    description: 'Исключенные даты', 
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  excludedDates?: string[];

  @ApiProperty({ 
    description: 'Предпочитаемые аудитории', 
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  preferredClassrooms?: number[];

  @ApiProperty({ 
    description: 'Максимум занятий в день', 
    required: false,
    default: 4
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxLessonsPerDay?: number;

  @ApiProperty({ 
    description: 'Минимальный перерыв между занятиями (минуты)', 
    required: false,
    default: 15
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minBreakBetweenLessons?: number;
}

export class RescheduleDto {
  @ApiProperty({ description: 'Новая дата' })
  @IsDateString()
  newDate: string;

  @ApiProperty({ description: 'Новое время начала' })
  @IsString()
  newStartTime: string;

  @ApiProperty({ description: 'Новое время окончания' })
  @IsString()
  newEndTime: string;

  @ApiProperty({ description: 'Новая аудитория', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  newClassroomId?: number;

  @ApiProperty({ description: 'Причина переноса' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Уведомлять участников', default: true })
  @IsOptional()
  @IsBoolean()
  notifyParticipants?: boolean;
}

export class CancelScheduleDto {
  @ApiProperty({ description: 'Причина отмены' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Уведомлять участников', default: true })
  @IsOptional()
  @IsBoolean()
  notifyParticipants?: boolean;
}

export class AssignSubstituteDto {
  @ApiProperty({ description: 'ID замещающего преподавателя' })
  @IsNumber()
  @Type(() => Number)
  substituteTeacherId: number;

  @ApiProperty({ description: 'Причина замещения' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Заметки для замещающего', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Уведомлять участников', default: true })
  @IsOptional()
  @IsBoolean()
  notifyParticipants?: boolean;
}

export class BatchOperationDto {
  @ApiProperty({ 
    description: 'Тип операции',
    enum: ['RESCHEDULE', 'CANCEL', 'SUBSTITUTE']
  })
  @IsEnum(['RESCHEDULE', 'CANCEL', 'SUBSTITUTE'])
  operation: 'RESCHEDULE' | 'CANCEL' | 'SUBSTITUTE';

  @ApiProperty({ description: 'Список ID расписаний' })
  @IsArray()
  @IsString({ each: true })
  scheduleIds: string[];

  @ApiProperty({ description: 'Данные для операции (зависят от типа)' })
  data: any;

  @ApiProperty({ description: 'Причина операции' })
  @IsString()
  reason: string;
}

export class DetectConflictsDto {
  @ApiProperty({ description: 'Дата' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Время начала' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Время окончания' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'ID преподавателя' })
  @IsNumber()
  @Type(() => Number)
  teacherId: number;

  @ApiProperty({ description: 'ID аудитории', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  classroomId?: number;

  @ApiProperty({ description: 'ID группы', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  groupId?: number;

  @ApiProperty({ description: 'Исключить расписание из проверки', required: false })
  @IsOptional()
  @IsString()
  excludeScheduleId?: string;
}

export class SuggestClassroomDto {
  @ApiProperty({ description: 'Тип урока' })
  @IsString()
  lessonType: string;

  @ApiProperty({ description: 'Размер группы' })
  @IsNumber()
  @Type(() => Number)
  groupSize: number;

  @ApiProperty({ description: 'Дата' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Время начала' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Время окончания' })
  @IsString()
  endTime: string;

  @ApiProperty({ 
    description: 'Предпочитаемые аудитории', 
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  preferredClassrooms?: number[];
}

export class ScheduleOptimizationResultDto {
  @ApiProperty({ description: 'Сгенерированные расписания' })
  schedules: any[];

  @ApiProperty({ description: 'Обнаруженные конфликты' })
  conflicts: any[];

  @ApiProperty({ description: 'Предложения по оптимизации' })
  suggestions: any[];

  @ApiProperty({ description: 'Уверенность AI в расписании (0-1)' })
  confidence: number;
}

export class ScheduleOperationResultDto {
  @ApiProperty({ description: 'Успешность операции' })
  success: boolean;

  @ApiProperty({ description: 'ID расписания' })
  scheduleId: string;

  @ApiProperty({ description: 'Сообщение о результате' })
  message: string;

  @ApiProperty({ description: 'ID нового расписания (для переносов)', required: false })
  newScheduleId?: string;

  @ApiProperty({ description: 'Конфликты', required: false })
  conflicts?: any[];
}

export class BatchOperationResultDto {
  @ApiProperty({ description: 'ID пакетной операции' })
  batchId: string;

  @ApiProperty({ description: 'Результаты по каждому расписанию', type: [ScheduleOperationResultDto] })
  results: ScheduleOperationResultDto[];

  @ApiProperty({ 
    description: 'Сводка результатов',
    properties: {
      total: { type: 'number', description: 'Общее количество' },
      successful: { type: 'number', description: 'Успешных операций' },
      failed: { type: 'number', description: 'Неудачных операций' }
    }
  })
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class VacationSubstitutionResultDto {
  @ApiProperty({ description: 'Количество обработанных расписаний' })
  processedSchedules: number;

  @ApiProperty({ description: 'Количество назначенных замещений' })
  substitutedSchedules: number;

  @ApiProperty({ description: 'Количество отмененных занятий' })
  cancelledSchedules: number;

  @ApiProperty({ description: 'Ошибки при обработке', type: [String] })
  errors: string[];
}
