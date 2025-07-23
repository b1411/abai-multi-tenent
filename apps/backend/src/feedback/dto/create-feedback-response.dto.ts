import { IsInt, IsObject, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateFeedbackResponseDto {
  @IsInt()
  templateId: number;

  @IsObject()
  answers: any; // JSON объект с ответами

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsString()
  period?: string;
}
