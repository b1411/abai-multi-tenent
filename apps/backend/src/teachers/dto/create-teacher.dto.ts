import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { EmploymentType } from '../../../generated/prisma';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'ID пользователя (User), который будет связан с записью преподавателя',
    example: 1,
  })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({
    description: 'Тип занятости преподавателя',
    example: 'STAFF',
    enum: EmploymentType,
    default: EmploymentType.STAFF,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Профильная специализация',
    example: 'Высшая математика',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({
    description: 'Квалификация или ученая степень',
    example: 'Кандидат физико-математических наук',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({
    description: 'Опыт работы в годах',
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  experience?: number;

  @ApiPropertyOptional({
    description: 'Отдел или кафедра',
    example: 'Кафедра математики',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Должность преподавателя',
    example: 'Старший преподаватель',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: 'Педагогическая категория',
    example: 'Высшая категория',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Дата приема на работу',
    example: '2023-09-01',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
