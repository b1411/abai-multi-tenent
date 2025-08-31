import { IsString, IsArray, IsOptional, IsDateString, IsEnum, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

export class WorkingHoursDto {
  @ApiProperty({ example: '08:00', description: 'Время начала рабочего дня' })
  @IsString()
  start: string;

  @ApiProperty({ example: '18:00', description: 'Время окончания рабочего дня' })
  @IsString()
  end: string;
}

export class RoomPreferenceDto {
  @ApiProperty({ example: 1, description: 'ID аудитории' })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 'lecture', description: 'Тип аудитории' })
  @IsString()
  roomType: string;

  @ApiProperty({ example: 1, description: 'Приоритет (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  priority: number;
}

export class ScheduleConstraintsDto {
  @ApiProperty({ type: WorkingHoursDto, description: 'Рабочие часы' })
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto;

  @ApiProperty({ example: [12, 13], description: 'Предпочтительное время обеда (часы)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  preferredBreaks?: number[];

  @ApiProperty({ example: 4, description: 'Максимальное количество занятий подряд' })
  @IsNumber()
  @Min(1)
  @Max(8)
  maxConsecutiveHours: number;

  @ApiProperty({ example: true, description: 'Исключить выходные дни' })
  @IsOptional()
  excludeWeekends?: boolean;

  @ApiProperty({ type: [RoomPreferenceDto], description: 'Предпочтения по аудиториям' })
  @ValidateNested({ each: true })
  @Type(() => RoomPreferenceDto)
  @IsOptional()
  roomPreferences?: RoomPreferenceDto[];

  @ApiProperty({ example: 15, description: 'Минимальная длительность перерыва (минуты)' })
  @IsNumber()
  @Min(5)
  @Max(60)
  @IsOptional()
  minBreakDuration?: number;
}

export enum GenerationType {
  FULL = 'full',
  PARTIAL = 'partial',
  OPTIMIZE = 'optimize'
}

@ApiExtraModels()
export class GenerateScheduleDto {
  @ApiProperty({ example: '2024-09-01', description: 'Дата начала периода' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-20', description: 'Дата окончания периода' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: [1, 2, 3], description: 'Массив ID групп для генерации' })
  @IsArray()
  @IsNumber({}, { each: true })
  groupIds: number[];

  @ApiProperty({ type: ScheduleConstraintsDto, description: 'Ограничения и предпочтения' })
  @ValidateNested()
  @Type(() => ScheduleConstraintsDto)
  constraints: ScheduleConstraintsDto;

  @ApiProperty({ enum: GenerationType, description: 'Тип генерации' })
  @IsEnum(GenerationType)
  generationType: GenerationType;

  @ApiProperty({ example: [1, 2], description: 'ID преподавателей (опционально)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  teacherIds?: number[];

  @ApiProperty({ example: [1, 2, 3], description: 'ID предметов (опционально)' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  subjectIds?: number[];

  @ApiProperty({ example: 'Генерация расписания для осеннего семестра', description: 'Дополнительные инструкции' })
  @IsString()
  @IsOptional()
  additionalInstructions?: string;
}
