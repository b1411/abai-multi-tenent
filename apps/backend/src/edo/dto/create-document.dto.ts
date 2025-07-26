import { IsString, IsOptional, IsEnum, IsInt, IsDateString, IsArray } from 'class-validator';

export enum DocumentType {
  STUDENT_CERTIFICATE = 'STUDENT_CERTIFICATE',
  ADMINISTRATIVE_ORDER = 'ADMINISTRATIVE_ORDER',
  FINANCIAL_CONTRACT = 'FINANCIAL_CONTRACT',
  ENROLLMENT_ORDER = 'ENROLLMENT_ORDER',
  ACADEMIC_TRANSCRIPT = 'ACADEMIC_TRANSCRIPT',
}

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  responsibleId?: number;

  @IsOptional()
  @IsInt()
  studentId?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  approverIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  fileIds?: number[];
}
