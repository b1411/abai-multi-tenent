import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PdpPlanStatusDto } from './create-pdp-plan.dto';

export class UpdatePdpPlanDto {
  @IsOptional()
  @IsString()
  subject?: string;

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
