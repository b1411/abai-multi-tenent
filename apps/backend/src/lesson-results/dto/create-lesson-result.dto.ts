import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsBoolean, IsEnum, Min, Max } from 'class-validator';

export enum AbsentReason {
  SICK = 'SICK',
  FAMILY = 'FAMILY',
  OTHER = 'OTHER'
}

export class CreateLessonResultDto {
  @ApiProperty({ description: 'ID студента' })
  @IsInt()
  studentId: number;

  @ApiProperty({ description: 'ID урока' })
  @IsInt()
  lessonId: number;

  @ApiPropertyOptional({ 
    description: 'Оценка за урок (1-5)', 
    minimum: 1,
    maximum: 5,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  lessonScore?: number;

  @ApiPropertyOptional({ 
    description: 'Комментарий к оценке за урок',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  lessonScorecomment?: string;

  @ApiPropertyOptional({ 
    description: 'Оценка за домашнее задание (1-5)', 
    minimum: 1,
    maximum: 5,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  homeworkScore?: number;

  @ApiPropertyOptional({ 
    description: 'Комментарий к оценке за домашнее задание',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  homeworkScoreComment?: string;

  @ApiPropertyOptional({ 
    description: 'Посещаемость (присутствовал/отсутствовал)',
    nullable: true 
  })
  @IsOptional()
  @IsBoolean()
  attendance?: boolean;

  @ApiPropertyOptional({ 
    description: 'Причина отсутствия',
    enum: AbsentReason,
    nullable: true 
  })
  @IsOptional()
  @IsEnum(AbsentReason)
  absentReason?: AbsentReason;

  @ApiPropertyOptional({ 
    description: 'Комментарий к отсутствию',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  absentComment?: string;
}
