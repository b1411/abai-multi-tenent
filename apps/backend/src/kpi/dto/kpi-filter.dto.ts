import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum KpiPeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum KpiMetricType {
  TEACHING_QUALITY = 'teaching_quality',
  STUDENT_SATISFACTION = 'student_satisfaction',
  ATTENDANCE = 'attendance',
  WORKLOAD = 'workload',
  PROFESSIONAL_DEVELOPMENT = 'professional_development',
}

export class KpiFilterDto {
  @ApiPropertyOptional({ description: 'ID преподавателя' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'ID отдела/кафедры' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Период анализа', enum: KpiPeriod })
  @IsOptional()
  @IsEnum(KpiPeriod)
  period?: KpiPeriod;

  @ApiPropertyOptional({ description: 'Тип метрики', enum: KpiMetricType })
  @IsOptional()
  @IsEnum(KpiMetricType)
  metric?: KpiMetricType;

  @ApiPropertyOptional({ description: 'Дата начала периода' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Дата окончания периода' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
