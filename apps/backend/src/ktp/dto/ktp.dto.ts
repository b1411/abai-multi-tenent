import { IsString, IsOptional, IsInt, IsArray, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum LessonStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export class CreateKtpLessonDto {
  @ApiProperty({ description: 'Название урока' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Описание урока' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Продолжительность в часах' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ description: 'Номер недели' })
  @IsInt()
  @Min(1)
  @Max(52)
  week: number;

  @ApiPropertyOptional({ description: 'Дата проведения' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Статус урока', enum: LessonStatus })
  @IsEnum(LessonStatus)
  status: LessonStatus;

  @ApiPropertyOptional({ description: 'Материалы урока' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @ApiProperty({ description: 'Цели урока' })
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @ApiProperty({ description: 'Методы обучения' })
  @IsArray()
  @IsString({ each: true })
  methods: string[];

  @ApiPropertyOptional({ description: 'Способ оценивания' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ description: 'Домашнее задание' })
  @IsOptional()
  @IsString()
  homework?: string;
}

export class CreateKtpSectionDto {
  @ApiProperty({ description: 'Название раздела' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Описание раздела' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Общее количество часов раздела' })
  @IsInt()
  @Min(1)
  totalHours: number;

  @ApiProperty({ description: 'Уроки раздела', type: [CreateKtpLessonDto] })
  @IsArray()
  @Type(() => CreateKtpLessonDto)
  lessons: CreateKtpLessonDto[];

  @ApiPropertyOptional({ description: 'Раздел развернут по умолчанию' })
  @IsOptional()
  expanded?: boolean;
}

export class CreateKtpDto {
  @ApiProperty({ description: 'ID учебного плана' })
  @IsInt()
  studyPlanId: number;

  @ApiProperty({ description: 'Общее количество часов' })
  @IsInt()
  @Min(1)
  totalHours: number;

  @ApiProperty({ description: 'Общее количество уроков' })
  @IsInt()
  @Min(1)
  totalLessons: number;

  @ApiProperty({ description: 'Разделы КТП', type: [CreateKtpSectionDto] })
  @IsArray()
  @Type(() => CreateKtpSectionDto)
  sections: CreateKtpSectionDto[];
}

export class UpdateKtpDto {
  @ApiPropertyOptional({ description: 'Общее количество часов' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalHours?: number;

  @ApiPropertyOptional({ description: 'Общее количество уроков' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalLessons?: number;

  @ApiPropertyOptional({ description: 'Разделы КТП', type: [CreateKtpSectionDto] })
  @IsOptional()
  @IsArray()
  @Type(() => CreateKtpSectionDto)
  sections?: CreateKtpSectionDto[];
}

export class KtpFilterDto {
  @ApiPropertyOptional({ description: 'Номер страницы' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Количество элементов на странице' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Поиск по названию' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID преподавателя' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teacherId?: number;

  @ApiPropertyOptional({ description: 'ID учебного плана' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studyPlanId?: number;

  @ApiPropertyOptional({ description: 'Статус уроков', enum: LessonStatus })
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;

  @ApiPropertyOptional({ description: 'Минимальный процент выполнения' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minCompletionRate?: number;

  @ApiPropertyOptional({ description: 'Максимальный процент выполнения' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxCompletionRate?: number;
}

export class KtpStatisticsDto {
  @ApiProperty({ description: 'Общее количество КТП' })
  totalKtp: number;

  @ApiProperty({ description: 'Средний процент выполнения' })
  averageCompletion: number;

  @ApiProperty({ description: 'Количество полностью завершенных КТП' })
  completedKtp: number;

  @ApiProperty({ description: 'Количество КТП в процессе' })
  inProgressKtp: number;

  @ApiProperty({ description: 'Количество запланированных КТП' })
  plannedKtp: number;

  @ApiProperty({ description: 'Общее количество уроков' })
  totalLessons: number;

  @ApiProperty({ description: 'Количество завершенных уроков' })
  completedLessons: number;

  @ApiProperty({ description: 'Количество уроков в процессе' })
  inProgressLessons: number;

  @ApiProperty({ description: 'Количество запланированных уроков' })
  plannedLessons: number;
}

export class KtpCompletionKpiDto {
  @ApiProperty({ description: 'ID преподавателя' })
  teacherId: number;

  @ApiProperty({ description: 'Имя преподавателя' })
  teacherName: string;

  @ApiProperty({ description: 'Процент заполнения КТП' })
  completionRate: number;

  @ApiProperty({ description: 'Количество КТП преподавателя' })
  ktpCount: number;

  @ApiProperty({ description: 'Общее количество уроков' })
  totalLessons: number;

  @ApiProperty({ description: 'Количество завершенных уроков' })
  completedLessons: number;

  @ApiProperty({ description: 'Тренд изменения (в процентах)' })
  trend: number;

  @ApiProperty({ description: 'Ранг преподавателя по заполнению КТП' })
  rank: number;
}

export class KtpCompletionKpiResponseDto {
  @ApiProperty({ description: 'КПИ преподавателей', type: [KtpCompletionKpiDto] })
  teachers: KtpCompletionKpiDto[];

  @ApiProperty({ description: 'Общая статистика' })
  statistics: {
    averageCompletion: number;
    topPerformers: number;
    needsImprovement: number;
    onTrack: number;
  };
}
