import { ApiProperty } from '@nestjs/swagger';

export class AttendanceCheckInScheduleDto {
  @ApiProperty({ description: 'Идентификатор записи расписания', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Дата занятия в ISO формате' })
  date!: string;

  @ApiProperty({ description: 'Время начала', example: '10:00' })
  startTime!: string;

  @ApiProperty({ description: 'Время окончания', example: '10:45' })
  endTime!: string;

  @ApiProperty({ description: 'Название предмета' })
  subject!: string;

  @ApiProperty({ description: 'Название группы', required: false })
  groupName?: string;

  @ApiProperty({ description: 'Аудитория', required: false })
  classroomName?: string;

  @ApiProperty({ description: 'Преподаватель' })
  teacherName!: string;
}

export class AttendanceCheckInSessionDto {
  @ApiProperty({ description: 'Идентификатор QR-сессии', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Дата и время занятия', example: '2025-09-24T10:00:00.000Z' })
  occursAt!: string;

  @ApiProperty({ description: 'Дата и время окончания действия токена', example: '2025-09-24T10:05:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ description: 'Дата и время отметки', required: false })
  consumedAt?: string | null;
}

export class AttendanceCheckInResponseDto {
  @ApiProperty({ description: 'Информация о занятии' })
  lesson!: AttendanceCheckInScheduleDto;

  @ApiProperty({ description: 'Информация о QR-сессии' })
  session!: AttendanceCheckInSessionDto;
}
