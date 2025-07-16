import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Material {
  @ApiProperty({ description: 'ID материала' })
  id: number;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;

  @ApiPropertyOptional({ description: 'Текст лекции', nullable: true })
  lecture: string | null;

  @ApiPropertyOptional({ description: 'URL видео', nullable: true })
  videoUrl: string | null;

  @ApiPropertyOptional({ description: 'URL презентации', nullable: true })
  presentationUrl: string | null;

  @ApiPropertyOptional({ description: 'ID квиза/теста', nullable: true })
  quizId: number | null;

  @ApiPropertyOptional({ description: 'ID домашнего задания', nullable: true })
  homeworkId: number | null;
}
