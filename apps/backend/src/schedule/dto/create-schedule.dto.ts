import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, Matches, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: 'ID учебного плана' })
  @IsInt()
  studyPlanId: number;

  @ApiProperty({ description: 'ID группы' })
  @IsInt()
  groupId: number;

  @ApiProperty({ description: 'ID преподавателя' })
  @IsInt()
  teacherId: number;

  @ApiPropertyOptional({ 
    description: 'ID аудитории', 
    type: Number,
    nullable: true 
  })
  @IsInt()
  @IsOptional()
  classroomId?: number;

  @ApiPropertyOptional({ 
    description: 'ID урока', 
    type: Number,
    nullable: true 
  })
  @IsInt()
  @IsOptional()
  lessonId?: number;

  @ApiPropertyOptional({ 
    description: 'Конкретная дата проведения занятия в формате YYYY-MM-DD',
    type: String,
    nullable: true,
    example: '2025-02-15'
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ 
    description: 'День недели (1-7: понедельник-воскресенье)',
    minimum: 1,
    maximum: 7
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ 
    description: 'Время начала (HH:MM)',
    example: '09:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format'
  })
  startTime: string;

  @ApiProperty({ 
    description: 'Время окончания (HH:MM)',
    example: '10:30'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format'
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Дата начала периода повторения (YYYY-MM-DD). Используется при repeat weekly/biweekly',
    example: '2025-09-01'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Дата окончания периода повторения (YYYY-MM-DD). Используется при repeat weekly/biweekly',
    example: '2025-10-31'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Пресет периода: quarter1|quarter2|quarter3|quarter4|half_year_1|half_year_2|year',
    enum: ['quarter1','quarter2','quarter3','quarter4','half_year_1','half_year_2','year']
  })
  @IsEnum(['quarter1','quarter2','quarter3','quarter4','half_year_1','half_year_2','year'])
  @IsOptional()
  periodPreset?: string;

  @ApiPropertyOptional({ 
    description: 'Тип расписания',
    enum: ['REGULAR', 'MAKEUP', 'SUBSTITUTE', 'EXTRA']
  })
  @IsEnum(['REGULAR', 'MAKEUP', 'SUBSTITUTE', 'EXTRA'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Статус расписания',
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'POSTPONED', 'MOVED']
  })
  @IsEnum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'POSTPONED', 'MOVED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Регулярность занятия',
    enum: ['weekly', 'biweekly', 'once']
  })
  @IsEnum(['weekly', 'biweekly', 'once'])
  @IsOptional()
  repeat?: 'weekly' | 'biweekly' | 'once';
}
