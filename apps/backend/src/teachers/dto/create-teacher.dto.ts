import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { EmploymentType } from '../../../generated/prisma';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'ID ������������ (User), ������� ����� ������ � ������� �������������',
    example: 1,
  })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({
    description: '��� ��������� �������������',
    example: 'STAFF',
    enum: EmploymentType,
    default: EmploymentType.STAFF,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: '���������� �������������',
    example: '������ ����������',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({
    description: '������������ ��� ������ �������',
    example: '�������� ������-�������������� ����',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({
    description: '���� ������ � �����',
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  experience?: number;

  @ApiPropertyOptional({
    description: '����� ��� �������',
    example: '������� ����������',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: '��������� �������������',
    example: '������� �������������',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: '�������������� ���������',
    example: '������ ���������',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: '���� ������ �� ������',
    example: '2023-09-01',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
