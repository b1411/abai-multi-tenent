import { IsString, IsDateString, IsOptional, IsArray, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Название события' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Описание события' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Дата и время начала' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Дата и время окончания' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Событие на весь день' })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ description: 'Местоположение события' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Список участников', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  participantIds?: number[];

  @ApiProperty({ description: 'Цвет события' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'Является ли повторяющимся' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Правило повторения (RRULE)' })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @ApiProperty({ description: 'Часовой пояс' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
