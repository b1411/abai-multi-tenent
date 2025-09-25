import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsOptional, IsUUID } from 'class-validator';

export type AttendanceSessionParticipantDto = 'teacher' | 'student';

export class CreateAttendanceSessionDto {
  @ApiProperty({ description: 'Идентификатор элемента расписания (Schedule.id)', format: 'uuid' })
  @IsUUID()
  scheduleItemId!: string;

  @ApiProperty({ description: 'Дата и время занятия в ISO-формате', example: '2025-09-24T10:00:00.000Z' })
  @IsISO8601({ strict: true })
  occursAt!: string;

  @ApiPropertyOptional({ description: 'Тип участника, для которого предназначен токен', enum: ['teacher', 'student'] })
  @IsOptional()
  @IsIn(['teacher', 'student'])
  participantType?: AttendanceSessionParticipantDto;
}
