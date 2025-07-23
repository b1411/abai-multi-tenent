import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VacationStatus } from './vacation-filter.dto';

export class UpdateVacationStatusDto {
  @ApiProperty({
    enum: VacationStatus,
    description: 'Новый статус отпуска',
    example: 'approved'
  })
  @IsEnum(VacationStatus)
  status: VacationStatus;

  @ApiPropertyOptional({
    description: 'Комментарий к изменению статуса',
    example: 'Согласовано с руководителем отдела'
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Уведомить сотрудника об изменении статуса',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  notifyEmployee?: boolean;
}
