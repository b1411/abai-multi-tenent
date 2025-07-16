import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateQuizSubmissionDto {
  @ApiProperty({ description: 'ID студента' })
  @IsInt()
  studentId: number;

  @ApiPropertyOptional({ 
    description: 'Ответы в формате JSON',
    example: '{"1": ["a"], "2": ["b", "c"], "3": "open answer"}'
  })
  @IsOptional()
  @IsString()
  answers?: string;

  @ApiPropertyOptional({ description: 'Обратная связь от преподавателя' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ description: 'Оценка за тест' })
  @IsOptional()
  @IsInt()
  score?: number;
}
