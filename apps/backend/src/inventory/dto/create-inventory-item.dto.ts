import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InventoryItemStatus {
  ACTIVE = 'ACTIVE',
  REPAIR = 'REPAIR',
  WRITTEN_OFF = 'WRITTEN_OFF',
  LOST = 'LOST',
}

export class WarrantyDto {
  @ApiProperty()
  @IsDateString()
  start: string;

  @ApiProperty()
  @IsDateString()
  end: string;

  @ApiProperty()
  @IsString()
  provider: string;
}

export class MaintenanceScheduleDto {
  @ApiProperty()
  @IsDateString()
  lastMaintenance: string;

  @ApiProperty()
  @IsDateString()
  nextMaintenance: string;

  @ApiProperty()
  @IsString()
  provider: string;
}

export class CreateInventoryItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty({ enum: InventoryItemStatus })
  @IsEnum(InventoryItemStatus)
  status: InventoryItemStatus;

  @ApiProperty()
  @IsDateString()
  purchaseDate: string;

  @ApiProperty()
  @IsDateString()
  lastInventory: string;

  @ApiProperty()
  @IsNumber()
  cost: number;

  @ApiProperty()
  @IsNumber()
  currentValue: number;

  @ApiProperty()
  @IsString()
  responsible: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => WarrantyDto)
  warranty?: WarrantyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => MaintenanceScheduleDto)
  maintenanceSchedule?: MaintenanceScheduleDto;
}
