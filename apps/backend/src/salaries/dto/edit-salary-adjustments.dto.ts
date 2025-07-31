import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SalaryAdjustmentDto {
  name: string;
  amount: number;
  comment?: string;
}

export class EditSalaryAdjustmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryAdjustmentDto)
  @IsOptional()
  bonuses?: SalaryAdjustmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryAdjustmentDto)
  @IsOptional()
  deductions?: SalaryAdjustmentDto[];

  @IsOptional()
  comment?: string;
}
