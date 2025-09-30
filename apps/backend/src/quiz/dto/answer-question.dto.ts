import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({ description: 'ID попытки' })
  @IsInt()
  quizAttemptId: number;

  @ApiProperty({ description: 'ID вопроса' })
  @IsInt()
  questionId: number;

  @ApiProperty({ description: 'ID выбранного ответа (для single choice)' })
  @IsInt()
  @IsOptional()
  answerId?: number;

  @ApiProperty({ description: 'Массив ID выбранных ответов (для multiple choice)' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  answerIds?: number[];

  @ApiProperty({ description: 'Текстовый ответ (для text)' })
  @IsString()
  @IsOptional()
  textAnswer?: string;
}
