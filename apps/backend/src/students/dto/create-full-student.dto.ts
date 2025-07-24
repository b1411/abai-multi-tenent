import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsInt, IsUrl } from 'class-validator';

export class CreateFullStudentDto {
  @ApiProperty({ description: 'Email студента', example: 'student@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Имя студента', example: 'Иван' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Фамилия студента', example: 'Петров' })
  @IsString()
  surname: string;

  @ApiProperty({ description: 'Пароль студента' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ 
    description: 'Номер телефона', 
    example: '+7 700 123 45 67',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Отчество студента', 
    example: 'Сергеевич',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  middlename?: string;

  @ApiPropertyOptional({ 
    description: 'URL аватара студента',
    nullable: true 
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ 
    description: 'ID группы, в которую зачисляется студент',
    example: 1
  })
  @IsInt()
  groupId: number;

  @ApiPropertyOptional({ 
    description: 'ID класса (если применимо)',
    example: 101,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  classId?: number;
}
