import { IsString, IsArray, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({ description: 'Название группового чата' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Является ли групповым чатом' })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiProperty({ description: 'Список участников чата', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  participantIds: number[];
}
