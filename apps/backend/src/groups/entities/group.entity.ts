import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Group {
  @ApiProperty({ description: 'ID группы' })
  id: number;

  @ApiProperty({ description: 'Название группы' })
  name: string;

  @ApiProperty({ description: 'Номер курса' })
  courseNumber: number;

  @ApiPropertyOptional({ description: 'ID куратора (преподаватель)', nullable: true })
  curatorTeacherId: number | null;

  @ApiPropertyOptional({ description: 'Куратор (преподаватель с данными пользователя)', nullable: true })
  curator?: any;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;
}
