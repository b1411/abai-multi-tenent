import { ApiProperty } from '@nestjs/swagger';

export class KpiMetricDto {
  @ApiProperty({ description: 'Название метрики', example: 'Качество преподавания' })
  name: string;

  @ApiProperty({ description: 'Значение метрики (0-100)', example: 85 })
  value: number;

  @ApiProperty({ description: 'Целевое значение', example: 80 })
  target: number;

  @ApiProperty({ description: 'Изменение относительно предыдущего периода', example: 5 })
  change: number;

  @ApiProperty({ description: 'Единица измерения', example: '%' })
  unit: string;

  @ApiProperty({ description: 'Статус достижения цели', enum: ['success', 'warning', 'danger'] })
  status: 'success' | 'warning' | 'danger';
}

export class TeacherKpiDto {
  @ApiProperty({ description: 'ID преподавателя', example: 1 })
  id: number;

  @ApiProperty({ description: 'ФИО преподавателя', example: 'Иванов Иван Иванович' })
  name: string;

  @ApiProperty({ description: 'Общий KPI балл', example: 87 })
  overallScore: number;

  @ApiProperty({ description: 'Качество преподавания', example: 85 })
  teachingQuality: number;

  @ApiProperty({ description: 'Удовлетворенность студентов', example: 90 })
  studentSatisfaction: number;

  @ApiProperty({ description: 'Посещаемость занятий', example: 95 })
  classAttendance: number;

  @ApiProperty({ description: 'Выполнение нагрузки', example: 88 })
  workloadCompliance: number;

  @ApiProperty({ description: 'Профессиональное развитие', example: 75 })
  professionalDevelopment: number;

  @ApiProperty({ description: 'Тренд изменения', example: 3 })
  trend: number;

  @ApiProperty({ description: 'Позиция в рейтинге', example: 5 })
  rank: number;
}

export class DepartmentKpiDto {
  @ApiProperty({ description: 'Название отдела', example: 'Математика и информатика' })
  name: string;

  @ApiProperty({ description: 'Средний KPI отдела', example: 82 })
  averageKpi: number;

  @ApiProperty({ description: 'Количество преподавателей', example: 12 })
  teacherCount: number;

  @ApiProperty({ description: 'Процент достижения целей', example: 75 })
  goalAchievement: number;

  @ApiProperty({ description: 'Тренд отдела', example: 2 })
  trend: number;
}

export class KpiTrendDto {
  @ApiProperty({ description: 'Период', example: 'Янв 2024' })
  period: string;

  @ApiProperty({ description: 'Значение KPI', example: 82 })
  value: number;

  @ApiProperty({ description: 'Целевое значение', example: 80 })
  target: number;
}

export class KpiGoalDto {
  @ApiProperty({ description: 'ID цели', example: 1 })
  id: number;

  @ApiProperty({ description: 'Название цели', example: 'Повышение качества преподавания' })
  title: string;

  @ApiProperty({ description: 'Описание', example: 'Достижение 85% удовлетворенности студентов' })
  description: string;

  @ApiProperty({ description: 'Целевое значение', example: 85 })
  target: number;

  @ApiProperty({ description: 'Текущее значение', example: 78 })
  current: number;

  @ApiProperty({ description: 'Прогресс (%)', example: 92 })
  progress: number;

  @ApiProperty({ description: 'Дедлайн', example: '2024-06-30' })
  deadline: string;

  @ApiProperty({ description: 'Статус', enum: ['on_track', 'at_risk', 'behind'] })
  status: 'on_track' | 'at_risk' | 'behind';

  @ApiProperty({ description: 'Ответственный', example: 'Иванов И.И.' })
  responsible: string;
}

export class KpiComparisonDto {
  @ApiProperty({ description: 'Название категории', example: 'Качество преподавания' })
  category: string;

  @ApiProperty({ description: 'Текущий период', example: 85 })
  current: number;

  @ApiProperty({ description: 'Предыдущий период', example: 82 })
  previous: number;

  @ApiProperty({ description: 'Изменение', example: 3 })
  change: number;

  @ApiProperty({ description: 'Процент изменения', example: 3.7 })
  changePercent: number;
}

// Response DTOs
export class KpiOverviewResponseDto {
  @ApiProperty({ description: 'Общие метрики KPI', type: [KpiMetricDto] })
  metrics: KpiMetricDto[];

  @ApiProperty({ description: 'Средний KPI по организации', example: 83 })
  overallKpi: number;

  @ApiProperty({ description: 'Процент достижения целей', example: 78 })
  goalAchievement: number;

  @ApiProperty({ description: 'Количество активных целей', example: 15 })
  activeGoals: number;

  @ApiProperty({ description: 'Количество преподавателей', example: 45 })
  totalTeachers: number;
}

export class TeacherKpiResponseDto {
  @ApiProperty({ description: 'Список преподавателей с KPI', type: [TeacherKpiDto] })
  teachers: TeacherKpiDto[];

  @ApiProperty({ description: 'Статистика по преподавателям' })
  statistics: {
    averageKpi: number;
    topPerformers: number;
    needsImprovement: number;
    onTrack: number;
  };
}

export class DepartmentKpiResponseDto {
  @ApiProperty({ description: 'KPI по отделам', type: [DepartmentKpiDto] })
  departments: DepartmentKpiDto[];

  @ApiProperty({ description: 'Лучший отдел' })
  topDepartment: DepartmentKpiDto;
}

export class KpiTrendsResponseDto {
  @ApiProperty({ description: 'Данные трендов', type: [KpiTrendDto] })
  trends: KpiTrendDto[];

  @ApiProperty({ description: 'Анализ тренда' })
  analysis: {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    projection: number;
  };
}

export class KpiGoalsResponseDto {
  @ApiProperty({ description: 'Список целей KPI', type: [KpiGoalDto] })
  goals: KpiGoalDto[];

  @ApiProperty({ description: 'Сводка по целям' })
  summary: {
    total: number;
    onTrack: number;
    atRisk: number;
    behind: number;
    completed: number;
  };
}

export class KpiComparisonResponseDto {
  @ApiProperty({ description: 'Сравнение KPI', type: [KpiComparisonDto] })
  comparison: KpiComparisonDto[];

  @ApiProperty({ description: 'Общее изменение', example: 2.5 })
  overallChange: number;
}
