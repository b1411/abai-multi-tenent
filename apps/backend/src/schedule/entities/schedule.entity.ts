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

  @ApiPropertyOptional({ description: 'Дата начала периода повторения', nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({ description: 'Дата окончания периода повторения', nullable: true })
  endDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Пресет периода (quarter1|quarter2|quarter3|quarter4|half_year_1|half_year_2|year)',
    nullable: true
  })
  periodPreset?: string | null;

  @ApiPropertyOptional({
    description: 'Регулярность занятия',
    enum: ['weekly', 'biweekly', 'once'],
    nullable: true,
  })
  repeat: string | null;
}
