import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class KpiMetricSettingDto {
  @ApiProperty({ description: 'Название метрики', example: 'Качество преподавания' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Вес метрики в общем KPI (0-100)', example: 25 })
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @ApiProperty({ description: 'Целевое значение', example: 80 })
  @IsNumber()
  @Min(0)
  @Max(100)
  target: number;

  @ApiProperty({ description: 'Минимальное значение для статуса "success"', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  successThreshold: number;

  @ApiProperty({ description: 'Минимальное значение для статуса "warning"', example: 70 })
  @IsNumber()
  @Min(0)
  @Max(100)
  warningThreshold: number;

  @ApiProperty({ description: 'Активна ли метрика', example: true })
  @IsOptional()
  isActive?: boolean;
}

export class CreateKpiGoalDto {
  @ApiProperty({ description: 'Название цели', example: 'Повышение качества преподавания' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Описание цели', example: 'Достижение 85% удовлетворенности студентов' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Целевое значение', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  target: number;

  @ApiProperty({ description: 'Дедлайн (ISO строка)', example: '2024-06-30T00:00:00.000Z' })
  @IsString()
  deadline: string;

  @ApiProperty({ description: 'Ответственный за цель', example: 'Иванов И.И.' })
  @IsString()
  responsible: string;

  @ApiProperty({ description: 'ID отдела (опционально)', required: false })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiProperty({ description: 'ID преподавателя (опционально)', required: false })
  @IsOptional()
  @IsNumber()
  teacherId?: number;
}

export class UpdateKpiGoalDto {
  @ApiProperty({ description: 'Название цели', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Описание цели', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Целевое значение', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  target?: number;

  @ApiProperty({ description: 'Текущее значение', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  current?: number;

  @ApiProperty({ description: 'Дедлайн (ISO строка)', required: false })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiProperty({ description: 'Ответственный за цель', required: false })
  @IsOptional()
  @IsString()
  responsible?: string;

  @ApiProperty({ description: 'Статус цели', required: false })
  @IsOptional()
  @IsString()
  status?: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

export class KpiSettingsDto {
  @ApiProperty({ description: 'Настройки метрик KPI', type: [KpiMetricSettingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KpiMetricSettingDto)
  metrics: KpiMetricSettingDto[];

  @ApiProperty({ description: 'Период пересчета KPI', example: 'monthly' })
  @IsString()
  calculationPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  @ApiProperty({ description: 'Автоматическое уведомление о низких показателях', example: true })
  @IsOptional()
  autoNotifications?: boolean;

  @ApiProperty({ description: 'Порог для уведомлений', example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  notificationThreshold?: number;
}

export class KpiSettingsResponseDto {
  @ApiProperty({ description: 'Настройки KPI' })
  settings: KpiSettingsDto;

  @ApiProperty({ description: 'Дата последнего обновления' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Кто обновил настройки' })
  updatedBy: string;
}
