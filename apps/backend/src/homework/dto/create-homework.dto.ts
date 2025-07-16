import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt } from 'class-validator';

export class CreateHomeworkDto {
  @ApiProperty({ description: 'Название домашнего задания' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Крайний срок сдачи', 
    type: String 
  })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({ 
    description: 'ID материалов', 
    type: Number,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  materialsId?: number;
}
