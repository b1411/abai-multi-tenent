import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { PaymentType, PaymentStatus } from './create-payment.dto';

export class PaymentFilterDto {
  @ApiPropertyOptional({
    description: 'Класс ученика',
    example: '9А'
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({
    description: 'Тип услуги',
    enum: PaymentType
  })
  @IsOptional()
  @IsEnum(PaymentType)
  serviceType?: PaymentType;

  @ApiPropertyOptional({
    description: 'Статус платежа',
    enum: PaymentStatus
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'ID ученика'
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Дата начала периода',
    example: '2024-09-01'
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Дата окончания периода',
    example: '2024-09-30'
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Поиск по имени ученика или названию услуги'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Номер страницы',
    default: 1
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Количество записей на странице',
    default: 20
  })
  @IsOptional()
  limit?: number;
}
