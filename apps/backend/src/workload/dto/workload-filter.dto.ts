import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginateQueryDto } from '../../common/dtos/paginate.dto';

export class WorkloadFilterDto extends PaginateQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacherId?: number;

  @ApiProperty({ required: false, enum: ['month', 'quarter', 'year', 'semester', 'custom'] })
  @IsOptional()
  @IsString()
  period?: 'month' | 'quarter' | 'year' | 'semester' | 'custom';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  periodValue?: number;

  @ApiProperty({ required: false, description: 'Semester number (1 or 2)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  semester?: number;

  @ApiProperty({ required: false, description: 'Start date for custom period (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for custom period (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Year for filtering (YYYY)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;
}
