import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProctoringSessionDto {
  @ApiProperty({ description: 'ID домашнего задания' })
  @IsNumber()
  homeworkId: number;

  @ApiProperty({ description: 'ID урока', required: false })
  @IsOptional()
  @IsNumber()
  lessonId?: number;

  @ApiProperty({ description: 'Тема прокторинга', required: false })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class ProctoringResultDto {
  @ApiProperty({ description: 'Оценка (0-100)' })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Комментарий преподавателя', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'Результаты анализа (JSON)', required: false })
  @IsOptional()
  analysisResults?: any;
}