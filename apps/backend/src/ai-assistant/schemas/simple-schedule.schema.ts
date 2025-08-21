// Простой schema для AI генерации недельного расписания (используется фронтендом AIScheduleBuilder)
export const simpleScheduleSchema = {
  type: 'object',
  properties: {
    lessons: {
      type: 'array',
      description: 'Список занятий (ячейки сетки). Пропущенные слоты просто отсутствуют.',
      items: {
        type: 'object',
        properties: {
          day: { type: 'number', minimum: 1, maximum: 5, description: '1=Пн .. 5=Пт' },
          slot: { type: 'number', minimum: 1, maximum: 8, description: 'Номер урока внутри дня (1..8)' },
          studyPlanId: { type: 'number' },
          groupId: { type: 'number' },
          teacherId: { type: 'number' },
          classroomId: { type: ['number', 'null'], nullable: true },
          recurrence: { type: 'string', enum: ['weekly'] }
        },
  required: ['day','slot','studyPlanId','groupId','teacherId','recurrence','classroomId'],
        additionalProperties: false
      }
  },
    missedLessons: {
      type: 'array',
      description: 'Предметы, которые не удалось поставить (для ручной доработки).',
      items: {
        type: 'object',
        properties: {
          groupId: { type: 'number' },
          studyPlanId: { type: 'number' },
          reason: { type: 'string' }
        },
        required: ['groupId','studyPlanId','reason'],
        additionalProperties: false
      }
    }
  },
  required: ['lessons'],
  additionalProperties: false
};
