import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsUrl, IsBoolean, IsArray } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID пользователя-получателя' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'Тип уведомления' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Текст уведомления' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Ссылка для перехода' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'ID создателя уведомления' })
  @IsOptional()
  @IsInt()
  createdBy?: number;

  @ApiPropertyOptional({ description: 'Прочитано ли уведомление' })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class AddNotificationDto {
  @ApiProperty({ description: 'ID пользователя или массив ID', isArray: true, type: Number, example: [1, 2, 3],  })
  @IsArray()
  @IsInt({ each: true })
  userIds: number[];

  @ApiProperty({ description: 'Тип уведомления' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Текст уведомления' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Ссылка для перехода' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'ID создателя уведомления' })
  @IsOptional()
  @IsInt()
  createdBy?: number;
}
