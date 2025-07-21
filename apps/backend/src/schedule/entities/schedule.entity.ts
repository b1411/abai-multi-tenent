import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Schedule {
  @ApiProperty({ description: 'ID расписания (UUID)' })
  id: string;

  @ApiProperty({ description: 'ID учебного плана' })
  studyPlanId: number;

  @ApiProperty({ description: 'ID группы' })
  groupId: number;

  @ApiProperty({ description: 'ID преподавателя' })
  teacherId: number;

  @ApiPropertyOptional({ description: 'ID аудитории', nullable: true })
  classroomId: number | null;

  @ApiProperty({ description: 'День недели (1-7: понедельник-воскресенье)' })
  dayOfWeek: number;

  @ApiProperty({ description: 'Время начала (HH:MM)' })
  startTime: string;

  @ApiProperty({ description: 'Время окончания (HH:MM)' })
  endTime: string;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;
}
