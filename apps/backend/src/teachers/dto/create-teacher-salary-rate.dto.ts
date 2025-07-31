import { IsInt, IsArray, ValidateNested, IsOptional, Min, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SalaryFactorDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateTeacherSalaryRateDto {
  @IsInt()
  teacherId: number;

  @IsInt()
  @Min(0)
  baseRate: number; // базовая ставка в тенге за час

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryFactorDto)
  @IsOptional()
  factors?: SalaryFactorDto[]; // дополнительные факторы
}
