import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Teacher {
  @ApiProperty({ description: 'ID записи преподавателя' })
  id: number;

  @ApiProperty({ description: 'ID пользователя' })
  userId: number;

  @ApiPropertyOptional({ description: 'Профильная специализация', nullable: true })
  specialization: string | null;

  @ApiPropertyOptional({ description: 'Квалификация', nullable: true })
  qualification: string | null;

  @ApiPropertyOptional({ description: 'Опыт работы (в годах)', nullable: true })
  experience: number | null;

  @ApiPropertyOptional({ description: 'Отдел или кафедра', nullable: true })
  department: string | null;

  @ApiPropertyOptional({ description: 'Должность', nullable: true })
  position: string | null;

  @ApiPropertyOptional({ description: 'Педагогическая категория', nullable: true })
  category: string | null;

  @ApiPropertyOptional({ description: 'Дата приема на работу', nullable: true })
  hireDate: Date | null;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;
}
