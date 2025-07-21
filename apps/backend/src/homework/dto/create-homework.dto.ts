import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginateQueryDto } from '../../common/dtos/paginate.dto';

export class CreateHomeworkDto {
  @ApiProperty({ description: 'Название домашнего задания' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Описание домашнего задания' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Крайний срок сдачи', 
    type: String 
  })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({ 
    description: 'ID урока',
    type: Number
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
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

export class HomeworkSubmitDto {
  @ApiPropertyOptional({ description: 'Комментарий к работе' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'ID файла с работой' })
  @IsInt()
  fileId: number;

  @ApiPropertyOptional({ 
    description: 'Массив ID дополнительных файлов работы',
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  additionalFileIds?: number[];
}

export class GradeHomeworkDto {
  @ApiProperty({ description: 'Оценка' })
  @IsInt()
  score: number;

  @ApiPropertyOptional({ description: 'Комментарий преподавателя' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class HomeworkQueryDto extends PaginateQueryDto {
  @ApiPropertyOptional({ description: 'ID урока' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  lessonId?: number;

  @ApiPropertyOptional({ description: 'ID студента' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  studentId?: number;

  @ApiPropertyOptional({ description: 'ID преподавателя' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacherId?: number;
}
