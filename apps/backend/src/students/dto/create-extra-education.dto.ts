import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtraScheduleItemDto {
  @ApiProperty({ example: 'Пн' })
  @IsString()
  @IsNotEmpty()
  day!: string;

  @ApiProperty({ example: '18:00-19:00' })
  @IsString()
  @IsNotEmpty()
  time!: string;
}

export class ExtraAchievementItemDto {
  @ApiProperty({ example: 'Проект: Поиск пути' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Реализация A* и сравнение с Dijkstra', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2025-07-10' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: ['WIN', 'PARTICIPANT', 'PROJECT', 'CERT'] })
  @IsString()
  @IsIn(['WIN', 'PARTICIPANT', 'PROJECT', 'CERT'])
  level!: 'WIN' | 'PARTICIPANT' | 'PROJECT' | 'CERT';
}

export class CreateExtraEducationDto {
  @ApiProperty({ example: 'Курс по алгоритмам' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Курсы', enum: ['Кружки', 'Организации', 'Курсы', 'Олимпиады'] })
  @IsString()
  @IsIn(['Кружки', 'Организации', 'Курсы', 'Олимпиады'])
  category!: 'Кружки' | 'Организации' | 'Курсы' | 'Олимпиады';

  @ApiProperty({ example: 'IT Academy' })
  @IsString()
  @IsNotEmpty()
  organization!: string;

  @ApiProperty({ example: 70, minimum: 0, maximum: 100, required: false })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED', 'PLANNED'] })
  @IsString()
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'PLANNED'])
  status!: 'IN_PROGRESS' | 'COMPLETED' | 'PLANNED';

  @ApiProperty({ example: '2025-06-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-09-01', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'Иванов Сергей' })
  @IsString()
  @IsNotEmpty()
  mentor!: string;

  @ApiProperty({ example: 'Senior Engineer', required: false })
  @IsString()
  @IsOptional()
  mentorTitle?: string;

  @ApiProperty({ example: 'Продвинутые структуры данных и алгоритмы оптимизации.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Кампус А, ауд. 204' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: 18, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  participants?: number;

  @ApiProperty({ type: [String], example: ['Алгоритмы', 'Оптимизация'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ type: [ExtraScheduleItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraScheduleItemDto)
  @IsOptional()
  schedule?: ExtraScheduleItemDto[];

  @ApiProperty({ type: [ExtraAchievementItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraAchievementItemDto)
  @IsOptional()
  achievements?: ExtraAchievementItemDto[];
}
