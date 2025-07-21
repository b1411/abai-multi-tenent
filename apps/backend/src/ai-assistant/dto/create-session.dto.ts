import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Дополнительные инструкции для AI ассистента',
    required: false,
    example: 'Помоги мне с расписанием на завтра',
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: 'Предпочитаемый голос AI',
    required: false,
    enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    default: 'alloy',
  })
  @IsOptional()
  @IsString()
  voice?: string;
}
