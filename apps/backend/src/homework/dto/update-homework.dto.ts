import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt } from 'class-validator';

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
}
