import { ApiProperty } from '@nestjs/swagger';

export class AttendanceSessionResponseDto {
  @ApiProperty({ description: 'Идентификатор QR-сессии', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Идентификатор элемента расписания', format: 'uuid' })
  scheduleItemId!: string;

  @ApiProperty({ description: 'Дата и время занятия', example: '2025-09-24T10:00:00.000Z' })
  occursAt!: string;

  @ApiProperty({ description: 'Момент истечения токена', example: '2025-09-24T10:05:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ description: 'Служебный токен QR-сессии' })
  token!: string;

  @ApiProperty({ description: 'Ссылка, закодированная в QR', example: 'https://app.example.com/attendance/check-in?token=...' })
  checkInUrl!: string;

  @ApiProperty({ description: 'Строковое представление для QR (дублирует checkInUrl)' })
  qrValue!: string;

  @ApiProperty({ description: 'Тип участника, которому предназначен токен', enum: ['teacher', 'student'] })
  participantType!: 'teacher' | 'student';

  @ApiProperty({ description: 'Дата создания записи', example: '2025-09-24T09:55:00.000Z' })
  createdAt!: string;
}
