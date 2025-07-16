import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class QuizFilterDto {
  @ApiPropertyOptional({ description: 'Поиск по названию теста' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Фильтр по активности теста' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Фильтр по дате начала (от)' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Фильтр по дате начала (до)' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Фильтр по дате окончания (от)' })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({ description: 'Фильтр по дате окончания (до)' })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;
}
