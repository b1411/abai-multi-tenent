import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum AnswerType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT'
}

export class CreateAnswerDto {
  @ApiProperty({ description: 'Текст ответа' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Правильный ли ответ' })
  isCorrect: boolean;

  @ApiPropertyOptional({ description: 'URL изображения для ответа' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Текст вопроса' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Тип вопроса',
    enum: AnswerType
  })
  @IsEnum(AnswerType)
  type: AnswerType;

  @ApiPropertyOptional({ 
    description: 'Варианты ответов',
    type: [CreateAnswerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers?: CreateAnswerDto[];

  @ApiPropertyOptional({ description: 'URL изображения для вопроса' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Описание или пояснение к вопросу' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Баллы за правильный ответ' })
  @IsOptional()
  @IsNumber()
  points?: number;
}
