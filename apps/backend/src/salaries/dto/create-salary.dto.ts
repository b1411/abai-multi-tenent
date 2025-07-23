import { IsInt, IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BonusType {
  PERFORMANCE = 'PERFORMANCE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  OVERTIME = 'OVERTIME',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER',
}

export class CreateSalaryBonusDto {
  @ApiProperty({ enum: BonusType })
  @IsEnum(BonusType)
  type: BonusType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateSalaryDeductionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateSalaryDto {
  @ApiProperty()
  @IsInt()
  teacherId: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  baseSalary: number;

  @ApiProperty({ type: [CreateSalaryBonusDto], required: false })
  @IsOptional()
  bonuses?: CreateSalaryBonusDto[];

  @ApiProperty({ type: [CreateSalaryDeductionDto], required: false })
  @IsOptional()
  deductions?: CreateSalaryDeductionDto[];

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty()
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
