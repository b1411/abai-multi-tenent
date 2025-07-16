import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuizDto } from '../../quiz/dto/create-quiz.dto';
import { CreateHomeworkDto } from '../../homework/dto/create-homework.dto';

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
    type: CreateHomeworkDto,
    nullable: true 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateHomeworkDto)
  homework?: CreateHomeworkDto;
}
