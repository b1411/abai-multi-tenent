import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'Название группы', example: 'Группа А' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Номер курса', 
    example: 1,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  courseNumber: number;
}
