import { IsString, IsInt, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'Содержимое сообщения' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ description: 'ID получателя для личных сообщений' })
  @IsOptional()
  @IsInt()
  receiverId?: number;

  @ApiProperty({ description: 'ID группового чата' })
  @IsOptional()
  @IsInt()
  chatId?: number;

  @ApiProperty({ description: 'ID сообщения, на которое отвечаем' })
  @IsOptional()
  @IsInt()
  replyToId?: number;
}
