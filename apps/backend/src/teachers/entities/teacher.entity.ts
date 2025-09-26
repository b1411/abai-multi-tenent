import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Teacher {
  @ApiProperty({ description: 'ID ������ �������������' })
  id: number;

  @ApiProperty({ description: 'ID ������������' })
  userId: number;

  @ApiPropertyOptional({ description: '���������� �������������', nullable: true })
  specialization: string | null;

  @ApiPropertyOptional({ description: '������������', nullable: true })
  qualification: string | null;

  @ApiPropertyOptional({ description: '���� ������ (� �����)', nullable: true })
  experience: number | null;

  @ApiPropertyOptional({ description: '����� ��� �������', nullable: true })
  department: string | null;

  @ApiPropertyOptional({ description: '���������', nullable: true })
  position: string | null;

  @ApiPropertyOptional({ description: '�������������� ���������', nullable: true })
  category: string | null;

  @ApiPropertyOptional({ description: '���� ������ �� ������', nullable: true })
  hireDate: Date | null;

  @ApiProperty({ description: '���� �������� ������' })
  createdAt: Date;

  @ApiProperty({ description: '���� ���������� ����������' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '���� ��������', nullable: true })
  deletedAt: Date | null;
}
