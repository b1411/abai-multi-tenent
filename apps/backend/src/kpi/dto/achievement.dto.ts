import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsInt, IsDateString, IsBoolean, IsUrl } from 'class-validator';

export enum AchievementType {
  OLYMPIAD_WIN = 'OLYMPIAD_WIN',
  SCHOOL_ADMISSION = 'SCHOOL_ADMISSION',
  QUALIFICATION = 'QUALIFICATION',
  TEAM_EVENT = 'TEAM_EVENT',
  PROJECT_HELP = 'PROJECT_HELP',
}

export enum SchoolType {
  RFMSH = 'RFMSH',
  NISH = 'NISH',
  BIL = 'BIL',
  LYCEUM = 'LYCEUM',
  PRIVATE_SCHOOL = 'PRIVATE_SCHOOL',
}

export class CreateAchievementDto {
  @ApiProperty({ description: 'ID преподавателя' })
  @IsInt()
  teacherId: number;

  @ApiProperty({ description: 'Тип достижения', enum: AchievementType })
  @IsEnum(AchievementType)
  type: AchievementType;

  @ApiProperty({ description: 'Название достижения' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Описание достижения', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Дата достижения' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Баллы за достижение', required: false })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiProperty({ description: 'Ссылка на подтверждающий документ', required: false })
  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;
}

export class CreateOlympiadResultDto {
  @ApiProperty({ description: 'ID студента' })
  @IsInt()
  studentId: number;

  @ApiProperty({ description: 'ID преподавателя' })
  @IsInt()
  teacherId: number;

  @ApiProperty({ description: 'Название олимпиады' })
  @IsString()
  olympiadName: string;

  @ApiProperty({ description: 'Предмет' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Уровень олимпиады' })
  @IsString()
  level: string;

  @ApiProperty({ description: 'Место (1, 2, 3)' })
  @IsInt()
  place: number;

  @ApiProperty({ description: 'Дата олимпиады' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Ссылка на сертификат', required: false })
  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}

export class CreateStudentAdmissionDto {
  @ApiProperty({ description: 'ID студента' })
  @IsInt()
  studentId: number;

  @ApiProperty({ description: 'ID преподавателя' })
  @IsInt()
  teacherId: number;

  @ApiProperty({ description: 'Тип школы', enum: SchoolType })
  @IsEnum(SchoolType)
  schoolType: SchoolType;

  @ApiProperty({ description: 'Название школы' })
  @IsString()
  schoolName: string;

  @ApiProperty({ description: 'Год поступления' })
  @IsInt()
  admissionYear: number;

  @ApiProperty({ description: 'Ссылка на справку о поступлении', required: false })
  @IsOptional()
  @IsUrl()
  documentUrl?: string;
}

export class AchievementResponseDto {
  @ApiProperty({ description: 'ID достижения' })
  id: number;

  @ApiProperty({ description: 'ID преподавателя' })
  teacherId: number;

  @ApiProperty({ description: 'Имя преподавателя' })
  teacherName: string;

  @ApiProperty({ description: 'Тип достижения' })
  type: AchievementType;

  @ApiProperty({ description: 'Название достижения' })
  title: string;

  @ApiProperty({ description: 'Описание достижения' })
  description?: string;

  @ApiProperty({ description: 'Дата достижения' })
  date: Date;

  @ApiProperty({ description: 'Баллы за достижение' })
  points: number;

  @ApiProperty({ description: 'Статус верификации' })
  isVerified: boolean;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;
}

export class OlympiadResultResponseDto {
  @ApiProperty({ description: 'ID результата' })
  id: number;

  @ApiProperty({ description: 'Имя студента' })
  studentName: string;

  @ApiProperty({ description: 'Имя преподавателя' })
  teacherName: string;

  @ApiProperty({ description: 'Название олимпиады' })
  olympiadName: string;

  @ApiProperty({ description: 'Предмет' })
  subject: string;

  @ApiProperty({ description: 'Уровень олимпиады' })
  level: string;

  @ApiProperty({ description: 'Место' })
  place: number;

  @ApiProperty({ description: 'Дата олимпиады' })
  date: Date;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;
}

export class StudentAdmissionResponseDto {
  @ApiProperty({ description: 'ID поступления' })
  id: number;

  @ApiProperty({ description: 'Имя студента' })
  studentName: string;

  @ApiProperty({ description: 'Имя преподавателя' })
  teacherName: string;

  @ApiProperty({ description: 'Тип школы' })
  schoolType: SchoolType;

  @ApiProperty({ description: 'Название школы' })
  schoolName: string;

  @ApiProperty({ description: 'Год поступления' })
  admissionYear: number;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;
}

export class AchievementsListResponseDto {
  @ApiProperty({ description: 'Список достижений', type: [AchievementResponseDto] })
  achievements: AchievementResponseDto[];

  @ApiProperty({ description: 'Общее количество' })
  total: number;

  @ApiProperty({ description: 'Количество на странице' })
  limit: number;

  @ApiProperty({ description: 'Смещение' })
  offset: number;
}
