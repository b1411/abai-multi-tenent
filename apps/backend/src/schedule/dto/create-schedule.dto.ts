import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, Matches } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: 'ID учебного плана' })
  @IsInt()
  studyPlanId: number;

  @ApiProperty({ description: 'ID группы' })
  @IsInt()
  groupId: number;

  @ApiProperty({ description: 'ID преподавателя' })
  @IsInt()
  teacherId: number;

  @ApiPropertyOptional({ 
    description: 'ID аудитории', 
    type: Number,
    nullable: true 
  })
  @IsInt()
  classroomId?: number;

  @ApiProperty({ 
    description: 'День недели (1-7: понедельник-воскресенье)',
    minimum: 1,
    maximum: 7
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ 
    description: 'Время начала (HH:MM)',
    example: '09:00'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format'
  })
  startTime: string;

  @ApiProperty({ 
    description: 'Время окончания (HH:MM)',
    example: '10:30'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format'
  })
  endTime: string;
}
