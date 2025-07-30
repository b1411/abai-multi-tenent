import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({ description: 'ID попытки' })
  @IsInt()
  quizAttemptId: number;

  @ApiProperty({ description: 'ID вопроса' })
  @IsInt()
  questionId: number;

  @ApiProperty({ description: 'ID выбранного ответа (для single/multiple choice)' })
  @IsInt()
  @IsOptional()
  answerId?: number;

  @ApiProperty({ description: 'Текстовый ответ (для text)' })
  @IsString()
  @IsOptional()
  textAnswer?: string;
}
