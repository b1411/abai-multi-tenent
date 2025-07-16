import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsUrl } from 'class-validator';

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  ADMIN = 'ADMIN',
  FINANCIST = 'FINANCIST',
  HR = 'HR'
}

export class CreateUserDto {
  @ApiProperty({ description: 'Email пользователя', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Имя пользователя', example: 'Иван' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Фамилия пользователя', example: 'Петров' })
  @IsString()
  surname: string;

  @ApiProperty({ description: 'Пароль пользователя' })
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
    description: 'Отчество пользователя', 
    example: 'Сергеевич',
    nullable: true 
  })
  @IsOptional()
  @IsString()
  middlename?: string;

  @ApiPropertyOptional({ 
    description: 'URL аватара пользователя',
    nullable: true 
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ 
    description: 'Роль пользователя',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  @IsEnum(UserRole)
  role: UserRole;
}
