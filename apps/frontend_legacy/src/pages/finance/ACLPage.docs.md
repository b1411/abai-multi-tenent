# Документация API для ACLPage (Анализ лояльности клиентов)

## Общее описание
API для анализа лояльности клиентов (Customer Loyalty Analysis), включающий метрики повторных покупок, отзывы студентов и детальную аналитику по различным категориям (группы, направления, преподаватели, академия).

## Модели данных

### RepeatPurchaseMetrics (Метрики повторных покупок)
```typescript
interface RepeatPurchaseMetrics {
  id: string;                // Уникальный идентификатор
  name: string;             // Название (группы/направления/учителя/академии)
  type: 'group' | 'direction' | 'teacher' | 'academy';  // Тип метрики
  repeatRate: number;       // Процент повторных покупок
  totalStudents: number;    // Общее количество студентов
  returningStudents: number; // Количество вернувшихся студентов
  averageRating: number;    // Средний рейтинг
}
```

### Review (Отзыв)
```typescript
interface Review {
  id: string;           // Уникальный идентификатор
  studentName: string;  // Имя студента
  teacherName: string;  // Имя преподавателя
  group: string;        // Группа
  rating: number;       // Рейтинг (1-5)
  comment: string;      // Текст отзыва
  date: string;        // Дата отзыва
  likes: number;       // Количество лайков
  helpful: number;     // Количество отметок "полезный"
}
```

## API Endpoints

### 1. Метрики повторных покупок

#### 1.1. Получение метрик
```
GET /api/loyalty/insights
```
**Query параметры:**
- `type` ('group' | 'direction' | 'teacher' | 'academy') - тип метрик
- `period` ('month' | 'quarter' | 'year') - период анализа
- `dateFrom` (string, опционально) - начало периода
- `dateTo` (string, опционально) - конец периода

**Ответ:**
```typescript
{
  metrics: RepeatPurchaseMetrics[];
  summary: {
    totalStudents: number;
    returningStudents: number;
    averageRating: number;
    averageRepeatRate: number;
  };
}
```

#### 1.2. Получение детальной статистики
```
GET /api/loyalty/insights/detailed
```
**Query параметры:**
- Те же, что и для получения метрик
- `sortBy` ('name' | 'repeatRate' | 'totalStudents' | 'rating') - поле сортировки
- `sortOrder` ('asc' | 'desc') - порядок сортировки

### 2. Управление отзывами

#### 2.1. Получение списка отзывов
```
GET /api/loyalty/reviews
```
**Query параметры:**
- `rating` (number, опционально) - фильтр по рейтингу
- `teacherId` (string, опционально) - фильтр по преподавателю
- `groupId` (string, опционально) - фильтр по группе
- `dateFrom` (string, опционально) - начало периода
- `dateTo` (string, опционально) - конец периода
- `sortBy` ('date' | 'rating' | 'likes' | 'helpful') - поле сортировки
- `page` (number) - номер страницы
- `limit` (number) - количество отзывов на странице

**Ответ:**
```typescript
{
  reviews: Review[];
  total: number;
  summary: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>; // распределение по оценкам
  };
}
```

#### 2.2. Добавление отзыва
```
POST /api/loyalty/reviews
```
**Тело запроса:**
```typescript
{
  teacherId: string;
  groupId: string;
  rating: number;
  comment: string;
}
```

#### 2.3. Реакция на отзыв
```
POST /api/loyalty/reviews/:id/react
```
**Тело запроса:**
```typescript
{
  type: 'like' | 'helpful';
}
```

### 3. Аналитика

#### 3.1. Получение сводной статистики
```
GET /api/loyalty/analytics/summary
```
**Query параметры:**
- `period` ('month' | 'quarter' | 'year') - период анализа
- `type` ('group' | 'direction' | 'teacher' | 'academy') - тип анализа

**Ответ:**
```typescript
{
  repeatPurchaseRate: {
    current: number;
    previous: number;
    change: number;
  };
  averageRating: {
    current: number;
    previous: number;
    change: number;
  };
  studentRetention: {
    current: number;
    previous: number;
    change: number;
  };
  topPerformers: {
    byRepeatRate: RepeatPurchaseMetrics[];
    byRating: RepeatPurchaseMetrics[];
  };
}
```

#### 3.2. Экспорт данных
```
GET /api/loyalty/export
```
**Query параметры:**
- `type` ('metrics' | 'reviews' | 'summary') - тип экспорта
- `format` ('xlsx' | 'csv' | 'pdf') - формат файла
- Все фильтры, доступные для соответствующего типа данных

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Получение метрик по группам
```bash
curl -X GET "http://api.example.com/api/loyalty/insights?type=group&period=month" \
  -H "Authorization: Bearer {token}"
```

### Добавление отзыва
```bash
curl -X POST http://api.example.com/api/loyalty/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "teacherId": "teacher123",
    "groupId": "group456",
    "rating": 5,
    "comment": "Отличный преподаватель! Очень доступно объясняет сложные темы."
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр метрик: администраторы, менеджеры, преподаватели
   - Просмотр детальной статистики: только администраторы и менеджеры
   - Добавление отзывов: только студенты
   - Экспорт данных: только администраторы
3. Все действия логируются в системе
4. Отзывы проходят модерацию перед публикацией

## Интеграции
1. Интеграция с системой управления обучением (LMS)
2. Интеграция с CRM-системой
3. Интеграция с системой уведомлений
4. Интеграция с аналитическими инструментами
5. Экспорт данных в различные форматы (Excel, PDF, CSV) 