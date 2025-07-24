import { IsString, IsInt, Min, Max, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Название группы',
    example: 'Группа А',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Название группы должно содержать минимум 2 символа' })
  name: string;

  @ApiProperty({
    description: 'Номер курса',
    example: 1,
    minimum: 1,
    maximum: 6,
  })
  @IsInt()
  @Min(1, { message: 'Номер курса должен быть от 1 до 6' })
  @Max(6, { message: 'Номер курса должен быть от 1 до 6' })
  courseNumber: number;
}
