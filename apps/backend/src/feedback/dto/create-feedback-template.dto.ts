import { IsString, IsIn, IsArray, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { UserRole, FeedbackFrequency } from 'generated/prisma';

export class CreateFeedbackTemplateDto {
  @IsString()
  name: string;

  @IsIn(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'FINANCIST', 'HR'])
  role: UserRole;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  questions: any[]; // JSON массив вопросов

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY'])
  frequency: FeedbackFrequency;

  @IsOptional()
  @IsInt()
  priority?: number;
}
