import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { EmploymentType } from '../../../generated/prisma';

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional({ description: '��� �������������', example: '�����' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '������� �������������', example: '��������' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({ description: '��������', example: '����������' })
  @IsOptional()
  @IsString()
  middlename?: string;

  @ApiPropertyOptional({ description: '����������� �����', example: 'teacher@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '����� ��������', example: '+7 700 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '��� ���������', example: 'STAFF', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: '���������� �������������', example: '������' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ description: '������������', example: '������� �������������� ����' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ description: '���� ������ (� �����)', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @ApiPropertyOptional({ description: '����� ��� �������', example: '������� �����������' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '���������', example: '������' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: '�������������� ���������', example: '������ ���������' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '���� ������ �� ������', example: '2022-08-15' })
  @IsOptional()
  @IsDateString()
  hireDate?: string | null;
}
