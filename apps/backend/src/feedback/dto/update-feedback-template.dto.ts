import { IsString, IsIn, IsArray, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateFeedbackTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'FINANCIST', 'HR'])
  role?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  questions?: any[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY'])
  frequency?: string;

  @IsOptional()
  @IsInt()
  priority?: number;
}
