import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, Min } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty({ description: 'Название квиза' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Продолжительность в минутах', 
    type: Number,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ 
    description: 'Максимальное количество баллов', 
    type: Number,
    nullable: true 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional({ 
    description: 'Дата начала', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Дата окончания', 
    type: String,
    nullable: true 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Активен ли квиз', 
    type: Boolean,
    nullable: true,
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
