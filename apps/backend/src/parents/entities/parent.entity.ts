import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Parent {
  @ApiProperty({ description: 'ID записи родителя' })
  id: number;

  @ApiProperty({ description: 'ID пользователя' })
  userId: number;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления записи' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления записи', nullable: true })
  deletedAt: Date | null;
}
