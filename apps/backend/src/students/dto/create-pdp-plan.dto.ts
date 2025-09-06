import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum PdpPlanStatusDto {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

export class CreatePdpPlanDto {
  @IsString()
  subject!: string;

  @IsOptional()
  @IsEnum(PdpPlanStatusDto)
  status?: PdpPlanStatusDto;

  @IsOptional()
  @IsString()
  mentor?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
