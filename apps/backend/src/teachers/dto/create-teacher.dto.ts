import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({ 
    description: 'ID пользователя (User), который станет преподавателем',
    example: 1
  })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ 
    description: 'Специализация преподавателя',
    example: 'Математика и физика',
    nullable: true
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ 
    description: 'Квалификация преподавателя',
    example: 'Кандидат физико-математических наук',
    nullable: true
  })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ 
    description: 'Опыт работы в годах',
    example: 5,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  experience?: number;
}
