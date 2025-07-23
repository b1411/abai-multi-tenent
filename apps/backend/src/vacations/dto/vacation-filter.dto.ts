import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VacationType } from './create-vacation.dto';

export enum VacationStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  completed = 'completed'
}

export class VacationFilterDto {
  @ApiPropertyOptional({
    description: 'Поиск по имени преподавателя или отделу',
    example: 'Иванов'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: VacationType,
    description: 'Фильтр по типу отпуска'
  })
  @IsOptional()
  @IsEnum(VacationType)
  type?: VacationType;

  @ApiPropertyOptional({
    enum: VacationStatus,
    description: 'Фильтр по статусу'
  })
  @IsOptional()
  @IsEnum(VacationStatus)
  status?: VacationStatus;

  @ApiPropertyOptional({
    description: 'Фильтр по периоду (current-year, next-year, previous-year)',
    example: 'current-year'
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: 'Дата начала фильтра',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Дата окончания фильтра',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'ID отдела',
    example: 1
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'ID замещающего преподавателя',
    example: 2
  })
  @IsOptional()
  @IsString()
  substituteId?: string;
}
