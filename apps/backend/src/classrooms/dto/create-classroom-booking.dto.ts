import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsDateString, Min, Length, IsOptional } from 'class-validator';

export class CreateClassroomBookingDto {
  @ApiProperty({ description: 'ID аудитории', example: 12 })
  @IsInt()
  classroomId: number;

  @ApiProperty({ description: 'Дата бронирования (YYYY-MM-DD)', example: '2025-02-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Время начала (HH:MM)', example: '10:00' })
  @IsString()
  @Length(5, 5)
  startTime: string;

  @ApiProperty({ description: 'Время окончания (HH:MM)', example: '12:00' })
  @IsString()
  @Length(5, 5)
  endTime: string;

  @ApiProperty({ description: 'Цель бронирования', example: 'Лекция по алгебре' })
  @IsString()
  @Length(3, 255)
  purpose: string;

  @ApiProperty({ description: 'Ответственное лицо (ФИО)', example: 'Иванов Иван' })
  @IsString()
  @Length(3, 255)
  responsiblePerson: string;

  @ApiProperty({ description: 'Контактная информация', example: '+7 777 000 1122' })
  @IsString()
  @Length(3, 255)
  contactInfo: string;

  @ApiProperty({ description: 'Дополнительное описание', required: false, example: 'Нужно подключение проектора' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateClassroomBookingStatusDto {
  @ApiProperty({ description: 'Новый статус', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsString()
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}
