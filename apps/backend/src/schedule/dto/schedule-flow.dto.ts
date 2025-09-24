import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { GenerationType, WorkingHoursDto } from '../../ai-assistant/dto/generate-schedule.dto';

export class FlowTimeframeDto {
  @ApiProperty({ example: '2025-09-02' })
  @IsDateString()
  start!: string;

  @ApiProperty({ example: '2025-10-27' })
  @IsDateString()
  end!: string;
}

export class FlowPreferencesDto {
  @ApiProperty({ required: false, type: () => WorkingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workday?: WorkingHoursDto;

  @ApiProperty({ required: false, example: 4 })
  @IsOptional()
  @IsNumber()
  maxConsecutive?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  breakMinutes?: number;

  @ApiProperty({ required: false, type: [Number], example: [12] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  preferredBreakHours?: number[];

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  allowWeekends?: boolean;
}

export class FlowFiltersDto {
  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  subjects?: number[];

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  teachers?: number[];
}

export class ScheduleFlowRequestDto {
  @ApiProperty({ type: () => FlowTimeframeDto })
  @ValidateNested()
  @Type(() => FlowTimeframeDto)
  timeframe!: FlowTimeframeDto;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  groupIds!: number[];

  @ApiProperty({ required: false, enum: GenerationType })
  @IsOptional()
  @IsEnum(GenerationType)
  generation?: GenerationType;

  @ApiProperty({ required: false, type: () => FlowPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlowPreferencesDto)
  preferences?: FlowPreferencesDto;

  @ApiProperty({ required: false, type: () => FlowFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlowFiltersDto)
  filters?: FlowFiltersDto;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  subjectHours?: Record<number, number>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}
