import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { EmploymentType } from '../../../generated/prisma';

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional({ description: 'Имя преподавателя', example: 'Айжан' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Фамилия преподавателя', example: 'Серикова' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({ description: 'Отчество', example: 'Кайратовна' })
  @IsOptional()
  @IsString()
  middlename?: string;

  @ApiPropertyOptional({ description: 'Электронная почта', example: 'teacher@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Номер телефона', example: '+7 700 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Тип занятости', example: 'STAFF', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: 'Профильная специализация', example: 'Физика' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ description: 'Квалификация', example: 'Магистр педагогических наук' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ description: 'Опыт работы (в годах)', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @ApiPropertyOptional({ description: 'Отдел или кафедра', example: 'Кафедра информатики' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Должность', example: 'Доцент' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Педагогическая категория', example: 'Первая категория' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Дата приема на работу', example: '2022-08-15' })
  @IsOptional()
  @IsDateString()
  hireDate?: string | null;
}
