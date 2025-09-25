import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AttendanceCheckInDto {
  @ApiProperty({ description: 'Одноразовый токен из QR-кода' })
  @IsString()
  token!: string;

  @ApiPropertyOptional({ description: 'Тип участника, выполняющего отметку', enum: ['teacher', 'student'] })
  @IsOptional()
  @IsIn(['teacher', 'student'])
  participantType?: 'teacher' | 'student';
}
