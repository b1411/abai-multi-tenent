import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Classroom {
  @ApiProperty({ description: 'ID аудитории' })
  id: number;

  @ApiProperty({ description: 'Название аудитории' })
  name: string;

  @ApiProperty({ description: 'Здание' })
  building: string;

  @ApiProperty({ description: 'Этаж' })
  floor: number;

  @ApiProperty({ description: 'Вместимость (количество мест)' })
  capacity: number;

  @ApiProperty({ description: 'Тип аудитории' })
  type: string;

  @ApiProperty({ description: 'Оборудование в аудитории', type: [String] })
  equipment: string[];

  @ApiPropertyOptional({ description: 'Дополнительное описание аудитории', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;
}
