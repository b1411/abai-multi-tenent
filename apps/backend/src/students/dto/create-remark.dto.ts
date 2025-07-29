import { IsString, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum RemarkType {
  ACADEMIC = 'ACADEMIC',
  BEHAVIOR = 'BEHAVIOR',
  ATTENDANCE = 'ATTENDANCE',
  GENERAL = 'GENERAL'
}

export class CreateRemarkDto {
  @ApiProperty({
    description: 'Тип замечания',
    enum: RemarkType,
    example: 'GENERAL',
    required: false,
  })
  @IsEnum(RemarkType)
  @IsOptional()
  type?: RemarkType;

  @ApiProperty({
    description: 'Заголовок замечания',
    example: 'Нарушение дисциплины',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Содержание замечания',
    example: 'Студент опоздал на занятие на 15 минут без уважительной причины',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    description: 'Является ли замечание приватным (видимым только преподавателям и админам)',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
