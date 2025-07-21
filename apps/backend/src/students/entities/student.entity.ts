import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Student {
  @ApiProperty({ description: 'ID записи студента' })
  id: number;

  @ApiProperty({ description: 'ID пользователя' })
  userId: number;

  @ApiProperty({ description: 'ID группы' })
  groupId: number;

  @ApiPropertyOptional({ description: 'ID класса', nullable: true })
  classId: number | null;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления записи' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления записи', nullable: true })
  deletedAt: Date | null;
}
