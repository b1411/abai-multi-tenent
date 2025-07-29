import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum CommentType {
  ACADEMIC = 'ACADEMIC',
  GENERAL = 'GENERAL'
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType = CommentType.GENERAL;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean = true; // По умолчанию приватный
}
