import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum PdpGoalStatusDto {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class CreatePdpGoalDto {
  @IsString()
  title!: string;

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
