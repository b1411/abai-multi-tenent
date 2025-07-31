import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min, IsArray, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentType } from './create-payment.dto';

export enum PaymentRecurrence {
  ONCE = 'ONCE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export class CreateGroupPaymentDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  groupId: number;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  // Исключения - студенты, для которых не нужно создавать платеж
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => value?.map((v: any) => parseInt(v)) || [])
  excludedStudentIds?: number[];

  // Индивидуальные суммы для студентов (переопределяют общую сумму)
  @IsOptional()
  @IsArray()
  @Type(() => StudentPaymentOverride)
  studentOverrides?: StudentPaymentOverride[];

  // Периодичность платежа
  @IsOptional()
  @IsEnum(PaymentRecurrence)
  recurrence?: PaymentRecurrence;

  // Количество повторений (для периодических платежей)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  recurrenceCount?: number;

  // Дата окончания периодических платежей
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;

  // Отправлять уведомления родителям
  @IsOptional()
  @IsBoolean()
  sendNotifications?: boolean;
}

export class StudentPaymentOverride {
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  studentId: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  excluded?: boolean;
}
