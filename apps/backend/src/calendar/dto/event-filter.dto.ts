import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EventFilterDto {
  @ApiProperty({ description: 'Дата начала периода', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Дата окончания периода', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Поиск по названию события', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Часовой пояс', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}
