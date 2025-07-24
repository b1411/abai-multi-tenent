import { ApiProperty } from '@nestjs/swagger';

export class GroupStatisticsDto {
  @ApiProperty({
    description: 'Общее количество групп',
    example: 15,
  })
  totalGroups: number;

  @ApiProperty({
    description: 'Общее количество студентов',
    example: 250,
  })
  totalStudents: number;

  @ApiProperty({
    description: 'Среднее количество студентов в группе',
    example: 16.67,
  })
  averageStudentsPerGroup: number;

  @ApiProperty({
    description: 'Статистика групп по курсам',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        courseNumber: { type: 'number', example: 1 },
        count: { type: 'number', example: 3 },
      },
    },
  })
  groupsByCourse: {
    courseNumber: number;
    count: number;
  }[];
}
