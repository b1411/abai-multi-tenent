import { IsString, IsInt, Min, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    description: 'Номер группы',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'Номер группы должен быть не меньше 1' })
  courseNumber: number;

  @ApiPropertyOptional({
    description: 'ID куратора (преподаватель)',
    example: 12,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsInt()
  curatorTeacherId?: number | null;
}
