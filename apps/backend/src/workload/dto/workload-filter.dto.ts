import { IsOptional, IsString, IsInt } from 'class-validator';
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

  @ApiProperty({ required: false, enum: ['month', 'quarter', 'year'] })
  @IsOptional()
  @IsString()
  period?: 'month' | 'quarter' | 'year';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  periodValue?: number;
}
