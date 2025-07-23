import { IsEnum, IsDateString, IsOptional, IsString, IsInt, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VacationType {
  vacation = 'vacation',
  sick_leave = 'sick_leave',
  maternity_leave = 'maternity_leave',
  unpaid_leave = 'unpaid_leave',
  business_trip = 'business_trip'
}

export class CreateVacationDto {
  @ApiProperty({
    enum: VacationType,
    description: 'Тип отпуска',
    example: 'vacation'
  })
  @IsEnum(VacationType)
  type: VacationType;

  @ApiProperty({
    description: 'Дата начала отпуска',
    example: '2024-06-15T00:00:00Z'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Дата окончания отпуска',
    example: '2024-07-12T00:00:00Z'
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Количество дней',
    example: 28
  })
  @IsInt()
  @Min(1)
  days: number;

  @ApiPropertyOptional({
    description: 'ID замещающего преподавателя',
    example: 2
  })
  @IsOptional()
  @IsInt()
  substituteId?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к заявке',
    example: 'Плановый отпуск'
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Темы лекций для замещающего преподавателя',
    example: 'Темы: 1. Алгебра многочленов, 2. Тригонометрия'
  })
  @IsOptional()
  @IsString()
  lectureTopics?: string;

  @ApiPropertyOptional({
    description: 'Массив ID уроков для замещения',
    example: [1, 2, 3]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  lessonIds?: number[];

  @ApiPropertyOptional({
    description: 'Рабочие задачи для передачи замещающему',
    example: 'Провести совещание, подготовить отчет'
  })
  @IsOptional()
  @IsString()
  workTasks?: string;
}
