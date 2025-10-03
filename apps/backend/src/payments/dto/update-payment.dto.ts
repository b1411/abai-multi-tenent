import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  paidAmount?: number;

  @IsOptional()
  @IsIn(['unpaid', 'partial', 'paid', 'overdue'])
  status?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
