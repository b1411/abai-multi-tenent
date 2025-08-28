import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class ToolDefinitionDto {
  @ApiProperty({ description: 'Идентификатор инструмента' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Читабельное имя инструмента' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Описание инструмента' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'JSON Schema входных параметров (optional)', required: false })
  @IsOptional()
  @IsObject()
  inputSchema?: any;

  @ApiProperty({ description: 'Роли, которым разрешён инструмент (опционально)', required: false })
  @IsOptional()
  requiredRoles?: string[];
}

export class AgentActionDto {
  @ApiProperty({ description: 'ID инструмента для выполнения' })
  @IsString()
  actionId: string;

  @ApiProperty({ description: 'Аргументы действия (зависит от инструмента)', required: false })
  @IsOptional()
  @IsObject()
  args?: any;

  @ApiProperty({ description: 'Если true — вернуть preview без выполнения', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

export class AgentActionResponseDto {
  @ApiProperty({ description: 'Статус успеха' })
  success: boolean;

  @ApiProperty({ description: 'Preview объекта (если dryRun) или результат', required: false })
  @IsOptional()
  preview?: any;

  @ApiProperty({ description: 'Результат выполнения (если применимо)', required: false })
  @IsOptional()
  result?: any;

  @ApiProperty({ description: 'ID лога активности (activityLog)', required: false })
  @IsOptional()
  logId?: number;
}
