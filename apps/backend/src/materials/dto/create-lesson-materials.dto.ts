import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuizDto } from '../../quiz/dto/create-quiz.dto';

export class CreateLessonHomeworkDto {
  @ApiPropertyOptional({ 
    description: 'Название домашнего задания',
    type: String
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Крайний срок сдачи', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class CreateLessonMaterialsDto {
  @ApiPropertyOptional({ 
    description: 'Текст лекции', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsString()
  lecture?: string;

  @ApiPropertyOptional({ 
    description: 'URL видео', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ 
    description: 'URL презентации', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsUrl()
  presentationUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Данные для создания квиза/теста',
    type: CreateQuizDto,
    nullable: true 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuizDto)
  quiz?: CreateQuizDto;

  @ApiPropertyOptional({ 
    description: 'Данные для создания домашнего задания',
    type: CreateLessonHomeworkDto,
    nullable: true 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLessonHomeworkDto)
  homework?: CreateLessonHomeworkDto;
}
