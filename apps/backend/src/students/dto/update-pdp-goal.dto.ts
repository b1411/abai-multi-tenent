import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PdpGoalStatusDto } from './create-pdp-goal.dto';

export class UpdatePdpGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(PdpGoalStatusDto)
  status?: PdpGoalStatusDto;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
