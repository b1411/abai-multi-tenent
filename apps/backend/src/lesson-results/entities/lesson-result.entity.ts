import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbsentReason } from '../dto/create-lesson-result.dto';

export class LessonResult {
  @ApiProperty({ description: 'ID записи результата' })
  id: number;

  @ApiProperty({ description: 'ID студента' })
  studentId: number;

  @ApiProperty({ description: 'ID урока' })
  lessonId: number;

  @ApiPropertyOptional({ description: 'Оценка за урок (1-5)', nullable: true })
  lessonScore: number | null;

  @ApiPropertyOptional({ description: 'Комментарий к оценке за урок', nullable: true })
  lessonScorecomment: string | null;

  @ApiPropertyOptional({ description: 'Оценка за домашнее задание (1-5)', nullable: true })
  homeworkScore: number | null;

  @ApiPropertyOptional({ description: 'Комментарий к оценке за домашнее задание', nullable: true })
  homeworkScoreComment: string | null;

  @ApiPropertyOptional({ description: 'Посещаемость (присутствовал/отсутствовал)', nullable: true })
  attendance: boolean | null;

  @ApiPropertyOptional({ description: 'Причина отсутствия', enum: AbsentReason, nullable: true })
  absentReason: AbsentReason | null;

  @ApiPropertyOptional({ description: 'Комментарий к отсутствию', nullable: true })
  absentComment: string | null;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления записи' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления записи', nullable: true })
  deletedAt: Date | null;
}
