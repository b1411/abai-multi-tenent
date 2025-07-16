import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator';

export class CreateMaterialDto {
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
    description: 'ID квиза/теста',
    type: Number,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  quizId?: number;

  @ApiPropertyOptional({
    description: 'ID домашнего задания',
    type: Number,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  homeworkId?: number;
}
