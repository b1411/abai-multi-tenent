import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizQuestionDto {
  @ApiProperty({ description: 'Текст вопроса' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Варианты ответов', type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: 'Количество баллов за вопрос' })
  @IsInt()
  @Min(1)
  score: number;

  @ApiPropertyOptional({ 
    description: 'Множественный выбор ответов', 
    type: Boolean,
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  multipleAnswers?: boolean;

  @ApiPropertyOptional({ 
    description: 'Правильный ответ (индекс для одиночного выбора или массив индексов для множественного)',
    example: 0 
  })
  @IsOptional()
  correctAnswer?: number | number[];
}

export class CreateQuizDto {
  @ApiProperty({ description: 'Название квиза' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Продолжительность в минутах', 
    type: Number,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ 
    description: 'Максимальное количество баллов', 
    type: Number,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional({ 
    description: 'Дата начала', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Дата окончания', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Активен ли квиз', 
    type: Boolean,
    nullable: true,
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Вопросы квиза', 
    type: [CreateQuizQuestionDto],
    nullable: true 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}
