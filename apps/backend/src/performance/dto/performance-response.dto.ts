import { ApiProperty } from '@nestjs/swagger';

export class PerformanceOverviewDto {
  @ApiProperty({ description: 'Средний балл', example: 4.2 })
  averageGrade: number;

  @ApiProperty({ description: 'Процент успеваемости', example: 78 })
  performanceRate: number;

  @ApiProperty({ description: 'Процент посещаемости', example: 92 })
  attendanceRate: number;

  @ApiProperty({ description: 'Процент выполнения заданий', example: 85 })
  assignmentCompletionRate: number;

  @ApiProperty({
    description: 'Тренды изменения показателей',
    example: {
      grade: 0.3,
      performance: 5,
      attendance: -2,
      assignments: 3,
    },
  })
  trends: {
    grade: number;
    performance: number;
    attendance: number;
    assignments: number;
  };
}

export class SubjectPerformanceDto {
  @ApiProperty({ description: 'Название предмета', example: 'Математика' })
  name: string;

  @ApiProperty({ description: 'Средний балл по предмету', example: 4.3 })
  grade: number;

  @ApiProperty({ description: 'Посещаемость (%)', example: 95 })
  attendance: number;

  @ApiProperty({ description: 'Выполнение заданий (%)', example: 92 })
  assignments: number;

  @ApiProperty({ description: 'Активность на занятиях (%)', example: 88 })
  participation: number;
}

export class StudentPerformanceDto {
  @ApiProperty({ description: 'ФИО студента', example: 'Арман Сериков' })
  name: string;

  @ApiProperty({ description: 'Средний балл студента', example: 2.8 })
  grade: number;

  @ApiProperty({ description: 'Тренд изменения балла', example: -0.2 })
  trend?: number;
}

export class ClassDataDto {
  @ApiProperty({ description: 'ID группы', example: '1' })
  id: string;

  @ApiProperty({ description: 'Название группы', example: 'МК24-1М' })
  name: string;

  @ApiProperty({ description: 'Средний балл группы', example: 4.2 })
  averageGrade: number;

  @ApiProperty({ description: 'Посещаемость группы (%)', example: 92 })
  attendance: number;

  @ApiProperty({ description: 'Выполнение заданий (%)', example: 85 })
  assignments: number;

  @ApiProperty({ description: 'Количество студентов', example: 25 })
  studentsCount: number;
}

export class MonthlyDataDto {
  @ApiProperty({ description: 'Месяц', example: 'Сен' })
  month: string;

  @ApiProperty({ description: 'Значение показателя', example: 3.8 })
  value: number;

  @ApiProperty({ description: 'Посещаемость', example: 88 })
  attendance: number;

  @ApiProperty({ description: 'Выполнение заданий', example: 85 })
  assignments: number;
}

export class GradeDistributionDto {
  @ApiProperty({ description: 'Оценка', example: '5' })
  name: string;

  @ApiProperty({ description: 'Количество студентов', example: 25 })
  value: number;

  @ApiProperty({ description: 'Цвет для графика', example: '#10B981' })
  color: string;
}

export class PerformanceMetricDto {
  @ApiProperty({ description: 'Название метрики', example: 'Оценки' })
  subject: string;

  @ApiProperty({ description: 'Значение метрики', example: 85 })
  value: number;
}

export class SubjectWithRecommendationsDto {
  @ApiProperty({ description: 'Название предмета', example: 'Математика' })
  name: string;

  @ApiProperty({ description: 'Балл по предмету', example: 2.5 })
  grade: number;

  @ApiProperty({
    description: 'Рекомендации для улучшения',
    example: ['Больше практики', 'Дополнительные занятия'],
  })
  recommendations: string[];
}

export class StudentWithSubjectsDto {
  @ApiProperty({ description: 'Данные студента' })
  student: StudentPerformanceDto;

  @ApiProperty({
    description: 'Предметы с низкой успеваемостью',
    type: [SubjectWithRecommendationsDto],
  })
  subjects: SubjectWithRecommendationsDto[];
}

export class SubjectImprovementDto {
  @ApiProperty({ description: 'Название предмета', example: 'Физика' })
  subject: string;

  @ApiProperty({ description: 'Улучшение балла', example: 0.5 })
  improvement: number;
}

export class StudentWithImprovementsDto {
  @ApiProperty({ description: 'Данные студента' })
  student: StudentPerformanceDto;

  @ApiProperty({
    description: 'Улучшения по предметам',
    type: [SubjectImprovementDto],
  })
  improvements: SubjectImprovementDto[];
}

export class TrendDataPointDto {
  @ApiProperty({ description: 'Период', example: '2024-01' })
  period: string;

  @ApiProperty({ description: 'Значение показателя', example: 4.2 })
  value: number;

  @ApiProperty({ description: 'Изменение относительно предыдущего периода', example: 0.1 })
  change: number;
}

export class TrendAnalysisDto {
  @ApiProperty({ description: 'Тип тренда', enum: ['positive', 'negative', 'stable'] })
  trend: 'positive' | 'negative' | 'stable';

  @ApiProperty({
    description: 'Факторы влияющие на тренд',
    example: ['Улучшение посещаемости', 'Новые методы обучения'],
  })
  factors: string[];
}

// Response DTOs
export class StatisticsResponseDto {
  @ApiProperty({ description: 'Общая статистика' })
  overview: PerformanceOverviewDto;
}

export class SubjectsResponseDto {
  @ApiProperty({
    description: 'Статистика по предметам',
    type: [SubjectPerformanceDto],
  })
  subjects: SubjectPerformanceDto[];

  @ApiProperty({
    description: 'Сводка по предметам',
    example: {
      bestPerforming: ['Английский', 'Математика'],
      needsImprovement: ['Химия', 'Биология'],
    },
  })
  summary: {
    bestPerforming: string[];
    needsImprovement: string[];
  };
}

export class ClassesResponseDto {
  @ApiProperty({
    description: 'Данные по группам',
    type: [ClassDataDto],
  })
  classes: ClassDataDto[];

  @ApiProperty({
    description: 'Общая статистика по группам',
    example: {
      averagePerformance: 4.1,
      topClasses: ['МК24-1М', 'ПК24-1П'],
      totalStudents: 94,
    },
  })
  statistics: {
    averagePerformance: number;
    topClasses: string[];
    totalStudents: number;
  };
}

export class LowPerformingStudentsResponseDto {
  @ApiProperty({
    description: 'Студенты с низкой успеваемостью',
    type: [StudentWithSubjectsDto],
  })
  students: StudentWithSubjectsDto[];
}

export class HighProgressStudentsResponseDto {
  @ApiProperty({
    description: 'Студенты с высоким прогрессом',
    type: [StudentWithImprovementsDto],
  })
  students: StudentWithImprovementsDto[];
}

export class TrendsResponseDto {
  @ApiProperty({
    description: 'Данные тренда',
    type: [TrendDataPointDto],
  })
  trends: TrendDataPointDto[];

  @ApiProperty({ description: 'Анализ тренда' })
  analysis: TrendAnalysisDto;
}
