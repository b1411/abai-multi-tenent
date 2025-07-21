import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Teacher {
  @ApiProperty({ description: 'ID записи преподавателя' })
  id: number;

  @ApiProperty({ description: 'ID пользователя' })
  userId: number;

  @ApiPropertyOptional({ description: 'Специализация преподавателя', nullable: true })
  specialization: string | null;

  @ApiPropertyOptional({ description: 'Квалификация преподавателя', nullable: true })
  qualification: string | null;

  @ApiPropertyOptional({ description: 'Опыт работы в годах', nullable: true })
  experience: number | null;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления записи' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления записи', nullable: true })
  deletedAt: Date | null;
}
