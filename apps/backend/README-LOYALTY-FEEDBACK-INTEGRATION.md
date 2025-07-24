# Модуль анализа лояльности студентов - Интеграция с системой обратной связи

## Обзор

Модуль лояльности был полностью переработан для интеграции с существующей системой обратной связи (feedback). Теперь анализ лояльности основан на данных из обязательных опросников, эмоционального состояния студентов и повторных покупок.

## Ключевые изменения

### 1. Интеграция с системой feedback
- Отзывы теперь создаются автоматически через систему обязательных опросников
- Анализ лояльности основан на ответах в формах типа `student_satisfaction`, `course_evaluation`, `teacher_rating`
- Поддержка множественных источников данных для комплексного анализа

### 2. Анализ эмоционального состояния
- Интеграция с таблицей `EmotionalState`
- Анализ настроения, мотивации, концентрации и социализации студентов
- Группировка данных по группам для выявления паттернов

### 3. Анализ повторных покупок
- Отслеживание retention rate студентов
- Анализ интервалов между покупками
- Расчет показателей лояльности на основе финансового поведения

## API Endpoints

### Отзывы
- `POST /loyalty/reviews` - Создание отзыва (ручное или через форму)
- `GET /loyalty/reviews` - Получение списка отзывов с фильтрацией
- `GET /loyalty/reviews/:id` - Получение конкретного отзыва
- `POST /loyalty/reviews/:id/reactions` - Добавление реакции на отзыв

### Аналитика
- `GET /loyalty/analytics` - Основная аналитика (распределение рейтингов, топ преподаватели)
- `GET /loyalty/analytics/summary` - Сводная информация по лояльности
- `GET /loyalty/analytics/trends` - Тренды за периоды
- `GET /loyalty/analytics/teacher/:teacherId` - Аналитика по конкретному преподавателю
- `GET /loyalty/analytics/group/:groupId` - Аналитика по группе
- `GET /loyalty/analytics/feedback-based` - Анализ на основе feedback форм
- `GET /loyalty/analytics/emotional` - Анализ эмоционального состояния
- `GET /loyalty/analytics/repeat-purchases` - Анализ повторных покупок

## Основные методы сервиса

### Анализ на основе feedback
```typescript
async getFeedbackBasedLoyalty(filter?: LoyaltyFilter): Promise<{
  period: string;
  totalResponses: number;
  averageSatisfaction: number;
  recommendationScore: number;
  teacherRatings: Array<{
    teacherId: number;
    rating: number;
    comment: string;
  }>;
}>
```

### Анализ эмоционального состояния
```typescript
async getEmotionalLoyalty(filter?: LoyaltyFilter): Promise<{
  totalStudents: number;
  averages: {
    mood: number;
    motivation: number;
    satisfaction: number;
  };
  groupStats: Array<{
    group: string;
    students: number;
    averageMood: number;
    averageMotivation: number;
    loyaltyScore: number;
  }>;
}>
```

### Анализ повторных покупок
```typescript
async getRepeatPurchaseRate(filter?: LoyaltyFilter): Promise<{
  rate: number;
  totalStudents: number;
  studentsWithRepeatPurchases: number;
  averageDaysBetween: number;
}>
```

## Интеграция с системой feedback

### Автоматическое создание отзывов
В `feedback.service.ts` при завершении форм типа `student_satisfaction` автоматически создаются отзывы:

```typescript
private async createLoyaltyReview(userId: number, answers: any) {
  const student = await this.prisma.student.findUnique({
    where: { userId },
  });

  if (student && answers.teacher_id && answers.teacher_rating) {
    await this.prisma.studentReview.create({
      data: {
        studentId: student.id,
        teacherId: answers.teacher_id,
        groupId: student.groupId,
        rating: answers.teacher_rating,
        comment: answers.teacher_comment || 'Отзыв из обязательной формы',
        isModerated: true,
        isPublished: true,
      },
    });
  }
}
```

### Ожидаемые поля в feedback формах
Для корректной работы интеграции формы должны содержать:

1. **Для оценки преподавателей:**
   - `teacher_id` - ID преподавателя
   - `teacher_rating` - рейтинг от 1 до 5
   - `teacher_comment` - комментарий (опционально)

2. **Для общей удовлетворенности:**
   - `overall_satisfaction` - общая удовлетворенность (1-10)
   - `recommend_course` - рекомендация курса (boolean)

3. **Для эмоционального состояния:**
   - `mood_today` - настроение (0-100)
   - `concentration_level` - уровень концентрации (0-100)
   - `motivation_level` - уровень мотивации (0-100)
   - `stress_level` - уровень стресса (0-100)

## Фильтрация и пагинация

### LoyaltyFilter
```typescript
interface LoyaltyFilter {
  period?: 'month' | 'quarter' | 'year';
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
  teacherId?: number;
  groupId?: number;
  page?: number;
  limit?: number;
}
```

## Расчет итогового балла лояльности

Итоговый балл лояльности рассчитывается как среднее арифметическое:
1. Средний рейтинг отзывов (приведенный к 100-балльной шкале)
2. Уровень удовлетворенности из эмоционального состояния
3. Процент повторных покупок

```typescript
loyaltyScore = Math.round(
  (averageRating / 5 * 100 + satisfactionRate + repeatPurchaseRate) / 3
);
```

## Безопасность

- Все отзывы создаются с `isModerated: true` и `isPublished: true`
- Поддержка реакций на отзывы (лайки, полезность)
- Защита от дублирования реакций через уникальные индексы

## Производительность

- Оптимизированные запросы с правильными includes
- Пагинация для больших объемов данных
- Кэширование трендов и аналитики (можно добавить в будущем)

## Расширения в будущем

1. **Sentiment анализ** комментариев
2. **Машинное обучение** для предсказания оттока студентов
3. **Real-time уведомления** о критических изменениях лояльности
4. **Интеграция с CRM** системами
5. **A/B тестирование** методов повышения лояльности

## Использование на фронтенде

Обновленный компонент `Loyalty.tsx` теперь отображает:
- Аналитику на основе всех источников данных
- Эмоциональное состояние студентов
- Тренды лояльности
- Детальную информацию по преподавателям и группам

Данные автоматически обновляются при переключении между табами, обеспечивая актуальную информацию для принятия решений.
