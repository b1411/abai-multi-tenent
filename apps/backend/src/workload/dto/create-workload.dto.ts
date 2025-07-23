import { IsString, IsInt, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum WorkloadType {
  REGULAR = 'REGULAR',
  OVERTIME = 'OVERTIME',
  SICK = 'SICK',
  VACATION = 'VACATION',
}

export class CreateMonthlyWorkloadDto {
  @ApiProperty()
  @IsInt()
  month: number;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsInt()
  standardHours: number;

  @ApiProperty()
  @IsInt()
  actualHours: number;
}

export class CreateQuarterlyWorkloadDto {
  @ApiProperty()
  @IsInt()
  quarter: number;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsInt()
  standardHours: number;

  @ApiProperty()
  @IsInt()
  actualHours: number;
}

export class CreateDailyWorkloadDto {
  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty()
  @IsInt()
  hours: number;

  @ApiProperty({ enum: WorkloadType })
  @IsEnum(WorkloadType)
  type: WorkloadType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateSubjectWorkloadDto {
  @ApiProperty()
  @IsString()
  subjectName: string;

  @ApiProperty()
  @IsInt()
  hours: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  studyPlanId?: number;
}

export class CreateAdditionalActivityDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  hours: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWorkloadDto {
  @ApiProperty()
  @IsInt()
  teacherId: number;

  @ApiProperty()
  @IsString()
  academicYear: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  standardHours?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  actualHours?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  overtimeHours?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  vacationDays?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  sickLeaveDays?: number;

  @ApiProperty({ type: [CreateMonthlyWorkloadDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMonthlyWorkloadDto)
  monthlyHours?: CreateMonthlyWorkloadDto[];

  @ApiProperty({ type: [CreateQuarterlyWorkloadDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuarterlyWorkloadDto)
  quarterlyHours?: CreateQuarterlyWorkloadDto[];

  @ApiProperty({ type: [CreateDailyWorkloadDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDailyWorkloadDto)
  dailyHours?: CreateDailyWorkloadDto[];

  @ApiProperty({ type: [CreateSubjectWorkloadDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectWorkloadDto)
  subjectWorkloads?: CreateSubjectWorkloadDto[];

  @ApiProperty({ type: [CreateAdditionalActivityDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdditionalActivityDto)
  additionalActivities?: CreateAdditionalActivityDto[];
}
