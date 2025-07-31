import { IsOptional, IsString } from 'class-validator';

export class ApproveSalaryDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
