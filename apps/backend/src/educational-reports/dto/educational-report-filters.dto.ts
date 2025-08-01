import { IsOptional, IsString, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportPeriod {
  DAY = 'day',
  WEEK = 'week', 
  QUARTER = 'quarter',
  SEMESTER = 'semester',
  YEAR = 'year',
  // Готовые школьные периоды
  SCHOOL_QUARTER_1 = 'school_quarter_1',
  SCHOOL_QUARTER_2 = 'school_quarter_2', 
  SCHOOL_QUARTER_3 = 'school_quarter_3',
  SCHOOL_QUARTER_4 = 'school_quarter_4',
  // Календарные кварталы
  CALENDAR_Q1 = 'calendar_q1',
  CALENDAR_Q2 = 'calendar_q2',
  CALENDAR_Q3 = 'calendar_q3', 
  CALENDAR_Q4 = 'calendar_q4',
  // Семестры
  FALL_SEMESTER = 'fall_semester',
  SPRING_SEMESTER = 'spring_semester',
  // Триместры
  TRIMESTER_1 = 'trimester_1',
  TRIMESTER_2 = 'trimester_2',
  TRIMESTER_3 = 'trimester_3',
  // Кастомный период
  CUSTOM = 'custom'
}

export enum ReportType {
  PERFORMANCE = 'performance',
  ATTENDANCE = 'attendance',
  DISCIPLINE = 'discipline',
  HOMEWORK = 'homework',
  CLASS_SUMMARY = 'class-summary',
  SUBJECT_ANALYSIS = 'subject-analysis'
}

export class EducationalReportFiltersDto {
  @ApiPropertyOptional({ 
    enum: ReportPeriod, 
    description: 'Период отчета',
    example: ReportPeriod.QUARTER 
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ 
    description: 'ID класса/группы',
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  classId?: number;

  @ApiPropertyOptional({ 
    description: 'Название класса',
    example: '10А' 
  })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ 
    description: 'ID предмета из учебного плана',
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subjectId?: number;

  @ApiPropertyOptional({ 
    description: 'Название предмета',
    example: 'Математика' 
  })
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiPropertyOptional({ 
    description: 'ID учителя',
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teacherId?: number;

  @ApiPropertyOptional({ 
    enum: ReportType,
    description: 'Тип отчета',
    example: ReportType.PERFORMANCE 
  })
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @ApiPropertyOptional({ 
    description: 'Дата начала периода (YYYY-MM-DD)',
    example: '2024-01-01' 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Дата окончания периода (YYYY-MM-DD)',
    example: '2024-03-31' 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Поиск по ФИО студента',
    example: 'Иванов' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Учебный год',
    example: '2023-2024' 
  })
  @IsOptional()
  @IsString()
  academicYear?: string;
}

export class StudentReportFiltersDto {
  @ApiPropertyOptional({ 
    enum: ReportPeriod,
    description: 'Период отчета',
    example: ReportPeriod.QUARTER 
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ 
    description: 'ID предмета из учебного плана',
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subjectId?: number;

  @ApiPropertyOptional({ 
    description: 'Дата начала периода (YYYY-MM-DD)',
    example: '2024-01-01' 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Дата окончания периода (YYYY-MM-DD)',
    example: '2024-03-31' 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
