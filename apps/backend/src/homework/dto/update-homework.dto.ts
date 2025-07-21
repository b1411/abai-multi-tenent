import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHomeworkDto {
  @ApiPropertyOptional({ description: 'Название домашнего задания' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Крайний срок сдачи', 
    type: String 
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ 
    description: 'Описание домашнего задания'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'ID урока',
    type: Number
  })
  @IsOptional()
  @IsInt()
  lessonId?: number;

  @ApiPropertyOptional({ 
    description: 'Массив ID дополнительных файлов',
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  additionalFileIds?: number[];
}
