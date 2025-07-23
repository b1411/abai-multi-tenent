import { IsOptional, IsString, IsInt, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum MetricType {
  GROUP = 'group',
  DIRECTION = 'direction',
  TEACHER = 'teacher',
  ACADEMY = 'academy',
}

export enum PeriodType {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class LoyaltyFilterDto {
  @IsOptional()
  @IsEnum(MetricType)
  type?: MetricType;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  rating?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  teacherId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  limit?: number = 10;
}
