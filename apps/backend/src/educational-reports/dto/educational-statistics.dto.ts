import { ApiProperty } from '@nestjs/swagger';

export class GradeDistributionDto {
  @ApiProperty({ description: 'Оценка', example: 5 })
  grade: number;

  @ApiProperty({ description: 'Количество оценок', example: 12 })
  count: number;

  @ApiProperty({ description: 'Процент от общего числа оценок', example: 30 })
  percentage: number;
}

export class SubjectStatisticsDto {
  @ApiProperty({ description: 'ID предмета', example: 1 })
  subjectId: number;

  @ApiProperty({ description: 'Название предмета', example: 'Математика' })
  subjectName: string;

  @ApiProperty({ description: 'Средний балл по предмету', example: 4.2 })
  averageGrade: number;

  @ApiProperty({ description: 'Качество знаний в процентах', example: 75 })
  qualityPercentage: number;

  @ApiProperty({ description: 'Общее количество оценок', example: 120 })
  totalGrades: number;

  @ApiProperty({ description: 'Распределение оценок', type: [GradeDistributionDto] })
  gradeDistribution: GradeDistributionDto[];

  @ApiProperty({ description: 'Количество студентов изучающих предмет', example: 25 })
  studentsCount: number;

  @ApiProperty({ description: 'ФИО учителя', example: 'Иванова А.П.' })
  teacherName: string;
}

export class ClassStatisticsDto {
  @ApiProperty({ description: 'ID класса', example: 1 })
  classId: number;

  @ApiProperty({ description: 'Название класса', example: '10А' })
  className: string;

  @ApiProperty({ description: 'Общее количество студентов', example: 25 })
  totalStudents: number;

  @ApiProperty({ description: 'Средний балл по классу', example: 4.0 })
  classAverageGrade: number;

  @ApiProperty({ description: 'Качество знаний по классу в процентах', example: 68 })
  classQualityPercentage: number;

  @ApiProperty({ description: 'Процент посещаемости', example: 92 })
  attendancePercentage: number;

  @ApiProperty({ description: 'Количество отличников (средний балл 4.5+)', example: 5 })
  excellentStudents: number;

  @ApiProperty({ description: 'Количество хорошистов (средний балл 3.5-4.49)', example: 12 })
  goodStudents: number;

  @ApiProperty({ description: 'Количество троечников (средний балл 2.5-3.49)', example: 7 })
  satisfactoryStudents: number;

  @ApiProperty({ description: 'Количество неуспевающих (средний балл <2.5)', example: 1 })
  unsatisfactoryStudents: number;

  @ApiProperty({ description: 'Статистика по предметам', type: [SubjectStatisticsDto] })
  subjectStatistics: SubjectStatisticsDto[];
}

export class AttendanceStatisticsDto {
  @ApiProperty({ description: 'Общее количество занятий', example: 100 })
  totalLessons: number;

  @ApiProperty({ description: 'Количество посещенных занятий', example: 92 })
  attendedLessons: number;

  @ApiProperty({ description: 'Процент посещаемости', example: 92 })
  attendancePercentage: number;

  @ApiProperty({ description: 'Пропуски по уважительной причине', example: 5 })
  excusedAbsences: number;

  @ApiProperty({ description: 'Пропуски без уважительной причины', example: 3 })
  unexcusedAbsences: number;

  @ApiProperty({ description: 'Процент пропусков по уважительной причине', example: 5 })
  excusedAbsencePercentage: number;

  @ApiProperty({ description: 'Процент пропусков без уважительной причины', example: 3 })
  unexcusedAbsencePercentage: number;
}

export class PeriodComparisonDto {
  @ApiProperty({ description: 'Название периода', example: '1-я четверть' })
  periodName: string;

  @ApiProperty({ description: 'Средний балл за период', example: 4.1 })
  averageGrade: number;

  @ApiProperty({ description: 'Качество знаний за период в процентах', example: 72 })
  qualityPercentage: number;

  @ApiProperty({ description: 'Процент посещаемости за период', example: 94 })
  attendancePercentage: number;
}

export class EducationalStatisticsDto {
  @ApiProperty({ description: 'Период отчета', example: 'quarter' })
  period: string;

  @ApiProperty({ description: 'Дата начала периода', example: '2024-01-01T00:00:00Z' })
  startDate: Date;

  @ApiProperty({ description: 'Дата окончания периода', example: '2024-03-31T23:59:59Z' })
  endDate: Date;

  @ApiProperty({ description: 'Общее количество студентов', example: 150 })
  totalStudents: number;

  @ApiProperty({ description: 'Общее количество классов', example: 6 })
  totalClasses: number;

  @ApiProperty({ description: 'Общий средний балл', example: 4.0 })
  overallAverageGrade: number;

  @ApiProperty({ description: 'Общее качество знаний в процентах', example: 70 })
  overallQualityPercentage: number;

  @ApiProperty({ description: 'Общий процент посещаемости', example: 93 })
  overallAttendancePercentage: number;

  @ApiProperty({ description: 'Статистика по классам', type: [ClassStatisticsDto] })
  classStatistics: ClassStatisticsDto[];

  @ApiProperty({ description: 'Статистика по предметам', type: [SubjectStatisticsDto] })
  subjectStatistics: SubjectStatisticsDto[];

  @ApiProperty({ description: 'Статистика посещаемости', type: AttendanceStatisticsDto })
  attendanceStatistics: AttendanceStatisticsDto;

  @ApiProperty({ description: 'Сравнение с предыдущими периодами', type: [PeriodComparisonDto] })
  periodComparison: PeriodComparisonDto[];

  @ApiProperty({ description: 'Общее распределение оценок', type: [GradeDistributionDto] })
  overallGradeDistribution: GradeDistributionDto[];
}

export class TeacherStatisticsDto {
  @ApiProperty({ description: 'ID учителя', example: 1 })
  teacherId: number;

  @ApiProperty({ description: 'ФИО учителя', example: 'Иванова А.П.' })
  teacherName: string;

  @ApiProperty({ description: 'Предметы которые ведет', type: [String] })
  subjects: string[];

  @ApiProperty({ description: 'Количество студентов', example: 75 })
  studentsCount: number;

  @ApiProperty({ description: 'Средний балл по всем предметам учителя', example: 4.2 })
  averageGrade: number;

  @ApiProperty({ description: 'Качество знаний по всем предметам учителя в процентах', example: 78 })
  qualityPercentage: number;

  @ApiProperty({ description: 'Статистика по предметам учителя', type: [SubjectStatisticsDto] })
  subjectStatistics: SubjectStatisticsDto[];
}
