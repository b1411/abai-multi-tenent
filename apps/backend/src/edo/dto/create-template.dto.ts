import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { DocumentType } from './create-document.dto';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  content: string;

  @IsOptional()
  variables?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
