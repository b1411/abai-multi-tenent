import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsOptional, Min } from 'class-validator';

export enum BudgetItemType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum BudgetItemStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED'
}

export class CreateBudgetItemDto {
  @ApiProperty({
    description: 'Название статьи бюджета',
    example: 'Оплата за обучение'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Тип статьи бюджета',
    enum: BudgetItemType,
    example: BudgetItemType.INCOME
  })
  @IsEnum(BudgetItemType)
  type: BudgetItemType;

  @ApiProperty({
    description: 'Категория',
    example: 'tuition'
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Плановая сумма',
    example: 25000000
  })
  @IsInt()
  @Min(0)
  plannedAmount: number;

  @ApiPropertyOptional({
    description: 'Фактическая сумма',
    example: 24500000
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualAmount?: number;

  @ApiPropertyOptional({
    description: 'Валюта',
    example: 'KZT',
    default: 'KZT'
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Период (квартал)',
    example: '2024 Q3'
  })
  @IsString()
  period: string;

  @ApiPropertyOptional({
    description: 'Ответственное лицо',
    example: 'Иванов И.И.'
  })
  @IsOptional()
  @IsString()
  responsible?: string;

  @ApiPropertyOptional({
    description: 'Статус статьи',
    enum: BudgetItemStatus,
    default: BudgetItemStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(BudgetItemStatus)
  status?: BudgetItemStatus;

  @ApiPropertyOptional({
    description: 'Описание',
    example: 'Доходы от основной образовательной деятельности'
  })
  @IsOptional()
  @IsString()
  description?: string;
}
