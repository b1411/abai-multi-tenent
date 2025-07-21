import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ 
    description: 'ID пользователя (User), который станет родителем',
    example: 1
  })
  @IsInt()
  userId: number;
}
