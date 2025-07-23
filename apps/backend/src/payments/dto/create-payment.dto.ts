import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

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

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  MOBILE = 'MOBILE'
}

export class CreatePaymentDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  studentId: number;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}
