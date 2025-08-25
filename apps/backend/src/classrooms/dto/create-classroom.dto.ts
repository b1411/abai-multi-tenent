import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, IsOptional, Min } from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({ description: 'Название аудитории', example: 'Аудитория 101' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Здание', example: 'Главный корпус' })
  @IsString()
  building: string;

  @ApiProperty({ description: 'Этаж', example: 1 })
  @IsInt()
  @Min(1)
  floor: number;

  @ApiProperty({ description: 'Вместимость (количество мест)', example: 30 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ 
    description: 'Тип аудитории', 
    enum: ['LECTURE', 'PRACTICE', 'COMPUTER', 'LABORATORY', 'OTHER'],
    example: 'LECTURE'
  })
  @IsString()
  type: string;

  @ApiProperty({ 
    description: 'Оборудование в аудитории',
    type: [String],
    example: ['проектор', 'интерактивная доска', 'компьютер']
  })
  @IsArray()
  @IsString({ each: true })
  equipment: string[];

  @ApiPropertyOptional({ 
    description: 'Дополнительное описание аудитории',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID ответственного пользователя',
    example: 42,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  responsibleId?: number;
}
