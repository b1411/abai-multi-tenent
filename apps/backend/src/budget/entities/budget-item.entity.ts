import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetItemType, BudgetItemStatus } from '../dto/create-budget-item.dto';

export class BudgetItem {
  @ApiProperty({ description: 'ID статьи бюджета' })
  id: number;

  @ApiProperty({ description: 'Название статьи' })
  name: string;

  @ApiProperty({ description: 'Тип статьи', enum: BudgetItemType })
  type: BudgetItemType;

  @ApiProperty({ description: 'Категория' })
  category: string;

  @ApiProperty({ description: 'Плановая сумма' })
  plannedAmount: number;

  @ApiProperty({ description: 'Фактическая сумма' })
  actualAmount: number;

  @ApiProperty({ description: 'Валюта' })
  currency: string;

  @ApiProperty({ description: 'Период' })
  period: string;

  @ApiPropertyOptional({ description: 'Ответственное лицо', nullable: true })
  responsible: string | null;

  @ApiProperty({ description: 'Статус', enum: BudgetItemStatus })
  status: BudgetItemStatus;

  @ApiPropertyOptional({ description: 'Описание', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;
}
