import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsDecimal, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum PaymentType {
  TUITION = 'TUITION',
  BOOKS = 'BOOKS',
  DORMITORY = 'DORMITORY',
  MEAL = 'MEAL',
  TRANSPORT = 'TRANSPORT',
  EXAM = 'EXAM',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  MOBILE = 'MOBILE'
}

export class CreatePaymentDto {
  @ApiProperty({ 
    description: 'ID студента, за которого производится оплата',
    example: 1
  })
  @IsInt()
  studentId: number;

  @ApiProperty({ 
    description: 'Сумма платежа',
    example: 150000.00
  })
  @IsDecimal({ decimal_digits: '2' })
  amount: number;

  @ApiProperty({ 
    description: 'Тип платежа',
    enum: PaymentType,
    example: PaymentType.TUITION
  })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ 
    description: 'Метод оплаты',
    enum: PaymentMethod,
    example: PaymentMethod.CARD
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ 
    description: 'Описание платежа',
    example: 'Оплата за обучение за осенний семестр 2025'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Дата платежа (если не указана, используется текущая)',
    example: '2025-01-15T10:30:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ 
    description: 'Дата окончания срока платежа',
    example: '2025-02-15T23:59:59.000Z'
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ 
    description: 'Номер счета или транзакции',
    example: 'INV-2025-001234'
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
