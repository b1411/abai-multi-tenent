import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PerformancePeriod {
  WEEK = 'week',
  MONTH = 'month',
  SEMESTER = 'semester',
  YEAR = 'year',
}

export enum PerformanceMetric {
  GRADE = 'grade',
  ATTENDANCE = 'attendance',
  ASSIGNMENTS = 'assignments',
  PARTICIPATION = 'participation',
}

export class PerformanceFilterDto {
  @ApiPropertyOptional({
    description: 'ID группы для фильтрации',
    example: '1',
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({
    description: 'ID предмета для фильтрации',
    example: '1',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Период анализа',
    enum: PerformancePeriod,
    example: PerformancePeriod.MONTH,
  })
  @IsOptional()
  @IsEnum(PerformancePeriod)
  period?: PerformancePeriod;

  @ApiPropertyOptional({
    description: 'Метрика для анализа тренда',
    enum: PerformanceMetric,
    example: PerformanceMetric.GRADE,
  })
  @IsOptional()
  @IsEnum(PerformanceMetric)
  metric?: PerformanceMetric;

  @ApiPropertyOptional({
    description: 'Дата начала периода',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Дата окончания периода',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Пороговый балл для отстающих студентов',
    example: 3.0,
  })
  @IsOptional()
  threshold?: number;
}
