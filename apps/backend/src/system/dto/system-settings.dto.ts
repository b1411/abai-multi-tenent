import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @IsOptional()
  @IsNumber()
  maxUploadSize?: number;

  @IsOptional()
  @IsString()
  emailServer?: string;

  @IsOptional()
  @IsString()
  emailPort?: string;

  @IsOptional()
  @IsString()
  emailEncryption?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsNumber()
  sessionTimeout?: number;

  @IsOptional()
  @IsBoolean()
  maintenance?: boolean;

  @IsOptional()
  @IsBoolean()
  debugMode?: boolean;

  @IsOptional()
  @IsBoolean()
  backupEnabled?: boolean;

  @IsOptional()
  @IsString()
  backupFrequency?: string;
}
