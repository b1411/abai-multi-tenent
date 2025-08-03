import { IsOptional, IsString, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReportType {
  BUDGET_ANALYSIS = 'BUDGET_ANALYSIS',
  CASHFLOW = 'CASHFLOW',
  PERFORMANCE = 'PERFORMANCE',
  FORECAST = 'FORECAST',
  VARIANCE = 'VARIANCE',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  BALANCE_SHEET = 'BALANCE_SHEET',
  WORKLOAD_ANALYSIS = 'WORKLOAD_ANALYSIS',
  SCHEDULE_ANALYSIS = 'SCHEDULE_ANALYSIS'
}

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum ReportFormat {
  JSON = 'JSON',
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV'
}

export class ReportFilterDto {
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  comparison?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;
}

export class GenerateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeComparison?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
