import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeDetailDto {
  @ApiProperty({ description: 'ID оценки', example: 1 })
  id: number;

  @ApiProperty({ description: 'Оценка (2-5)', example: 4 })
  grade: number;

  @ApiProperty({ description: 'Дата выставления оценки', example: '2024-01-15T10:30:00Z' })
  date: Date;

  @ApiProperty({ description: 'Тема урока', example: 'Квадратные уравнения' })
  topic: string;

  @ApiProperty({ description: 'Тип оценки', example: 'Контрольная работа' })
  gradeType: string;

  @ApiProperty({ description: 'ФИО учителя', example: 'Иванова А.П.' })
  teacherName: string;

  @ApiPropertyOptional({ description: 'Комментарий к оценке', example: 'Хорошая работа' })
  comment?: string;
}

export class SubjectGradesDto {
  @ApiProperty({ description: 'ID предмета', example: 1 })
  subjectId: number;

  @ApiProperty({ description: 'Название предмета', example: 'Математика' })
  subjectName: string;

  @ApiProperty({ description: 'Список оценок', type: [GradeDetailDto] })
  grades: GradeDetailDto[];

  @ApiProperty({ description: 'Средний балл по предмету', example: 4.2 })
  averageGrade: number;

  @ApiProperty({ description: 'Качество знаний в процентах', example: 75 })
  qualityPercentage: number;

  @ApiProperty({ description: 'Количество оценок', example: 8 })
  gradesCount: number;

  @ApiProperty({ description: 'ФИО учителя', example: 'Иванова А.П.' })
  teacherName: string;
}

export class AttendanceRecordDto {
  @ApiProperty({ description: 'ID записи посещаемости', example: 1 })
  id: number;

  @ApiProperty({ description: 'Дата урока', example: '2024-01-15T08:00:00Z' })
  date: Date;

  @ApiProperty({ description: 'Присутствовал ли студент', example: true })
  isPresent: boolean;

  @ApiProperty({ description: 'Причина отсутствия', example: 'SICK', required: false })
  absentReason?: 'SICK' | 'FAMILY' | 'OTHER';

  @ApiProperty({ description: 'Комментарий к отсутствию', required: false })
  absentComment?: string;

  @ApiProperty({ description: 'Название предмета', example: 'Математика' })
  subjectName: string;

  @ApiProperty({ description: 'Тема урока', example: 'Квадратные уравнения' })
  lessonTopic: string;
}

export class PeriodGradesDto {
  @ApiProperty({ description: 'ID студента', example: 1 })
  studentId: number;

  @ApiProperty({ description: 'ФИО студента', example: 'Иванов Иван Иванович' })
  studentName: string;

  @ApiProperty({ description: 'Класс студента', example: '10А' })
  className: string;

  @ApiProperty({ description: 'Период отчета', example: 'quarter' })
  period: string;

  @ApiProperty({ description: 'Дата начала периода', example: '2024-01-01T00:00:00Z' })
  startDate: Date;

  @ApiProperty({ description: 'Дата окончания периода', example: '2024-03-31T23:59:59Z' })
  endDate: Date;

  @ApiProperty({ description: 'Оценки по предметам', type: [SubjectGradesDto] })
  subjects: SubjectGradesDto[];

  @ApiProperty({ description: 'Общий средний балл', example: 4.1 })
  overallAverageGrade: number;

  @ApiProperty({ description: 'Общее качество знаний в процентах', example: 72 })
  overallQualityPercentage: number;

  @ApiProperty({ description: 'Записи посещаемости', type: [AttendanceRecordDto] })
  attendance: AttendanceRecordDto[];

  @ApiProperty({ description: 'Процент посещаемости', example: 95 })
  attendancePercentage: number;

  @ApiProperty({ description: 'Количество пропусков по уважительной причине', example: 2 })
  excusedAbsences: number;

  @ApiProperty({ description: 'Количество пропусков без уважительной причины', example: 1 })
  unexcusedAbsences: number;
}

export class ClassSummaryDto {
  @ApiProperty({ description: 'ID класса', example: 1 })
  classId: number;

  @ApiProperty({ description: 'Название класса', example: '10А' })
  className: string;

  @ApiProperty({ description: 'Количество студентов в классе', example: 25 })
  totalStudents: number;

  @ApiProperty({ description: 'Период отчета', example: 'quarter' })
  period: string;

  @ApiProperty({ description: 'Дата начала периода', example: '2024-01-01T00:00:00Z' })
  startDate: Date;

  @ApiProperty({ description: 'Дата окончания периода', example: '2024-03-31T23:59:59Z' })
  endDate: Date;

  @ApiProperty({ description: 'Средний балл по классу', example: 4.0 })
  classAverageGrade: number;

  @ApiProperty({ description: 'Качество знаний по классу в процентах', example: 68 })
  classQualityPercentage: number;

  @ApiProperty({ description: 'Процент посещаемости по классу', example: 92 })
  classAttendancePercentage: number;

  @ApiProperty({ description: 'Данные студентов', type: [PeriodGradesDto] })
  students: PeriodGradesDto[];

  @ApiProperty({ description: 'Статистика по предметам', type: [SubjectGradesDto] })
  subjectStatistics: SubjectGradesDto[];
}
