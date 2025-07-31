import { IsInt, IsNumber, IsOptional, IsString, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BonusType {
  PERFORMANCE = 'PERFORMANCE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  OVERTIME = 'OVERTIME',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER',
}

export enum AllowanceType {
  EXPERIENCE = 'EXPERIENCE',
  CATEGORY = 'CATEGORY',
  CONDITIONS = 'CONDITIONS',
  QUALIFICATION = 'QUALIFICATION',
  OTHER = 'OTHER',
}

export class CreateSalaryAllowanceDto {
  @ApiProperty({ enum: AllowanceType })
  @IsEnum(AllowanceType)
  type: AllowanceType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPercentage?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateSalaryBonusDto {
  @ApiProperty({ enum: BonusType })
  @IsEnum(BonusType)
  type: BonusType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPercentage?: boolean;

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
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPercentage?: boolean;

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
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  hoursWorked: number;

  @ApiProperty({ type: [CreateSalaryAllowanceDto], required: false })
  @IsOptional()
  allowances?: CreateSalaryAllowanceDto[];

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
