import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
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
}
