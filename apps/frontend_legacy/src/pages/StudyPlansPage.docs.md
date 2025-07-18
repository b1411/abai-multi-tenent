# Документация API для StudyPlansPage (Учебные планы)

## Общее описание
API для управления учебными планами в образовательном учреждении. Система обеспечивает создание, просмотр и анализ учебных планов, включая информацию о уроках, материалах и прогрессе выполнения.

## Модели данных

### StudyPlan (Учебный план)
```typescript
interface StudyPlan {
  id: string;              // Уникальный идентификатор
  subject: string;         // Предмет
  class: string;          // Группа
  teacher: string;        // Преподаватель
  totalLessons: number;   // Общее количество уроков
  completedLessons: number; // Выполненные уроки
  lastUpdate: string;     // Дата последнего обновления
  lessons: Lesson[];      // Список уроков
}
```

### Lesson (Урок)
```typescript
interface Lesson {
  id: string;              // Уникальный идентификатор
  topic: string;           // Тема урока
  hasVideo: boolean;       // Наличие видео
  hasPresentation: boolean; // Наличие презентации
  hasTest: boolean;        // Наличие теста
  addedDate: string;       // Дата добавления
  responsible: string;     // Ответственный
  scheduledDate?: string;  // Запланированная дата
}
```

## API Endpoints

### 1. Управление учебными планами

#### 1.1. Получение списка планов
```
GET /api/study-plans
```
**Query параметры:**
- `class` (string, опционально) - фильтр по группе
- `subject` (string, опционально) - фильтр по предмету
- `teacher` (string, опционально) - фильтр по преподавателю

**Ответ:**
```typescript
{
  plans: StudyPlan[];
  metadata: {
    total: number;
    completed: number;
    inProgress: number;
  };
}
```

#### 1.2. Получение детальной информации о плане
```
GET /api/study-plans/{id}
```
**Ответ:**
```typescript
{
  plan: StudyPlan;
  analytics: {
    completionRate: number;
    missingMaterials: {
      videos: number;
      presentations: number;
      tests: number;
    };
    deviations: string[];
  };
}
```

#### 1.3. Экспорт в Excel
```
GET /api/study-plans/export
```
**Query параметры:**
- `format` (string) - формат экспорта ('xlsx', 'csv')
- `filters` (object, опционально) - применяемые фильтры

### 2. Управление уроками

#### 2.1. Получение списка уроков плана
```
GET /api/study-plans/{id}/lessons
```
**Ответ:**
```typescript
{
  lessons: Lesson[];
  summary: {
    total: number;
    withVideo: number;
    withPresentation: number;
    withTest: number;
  };
}
```

#### 2.2. Обновление статуса материалов урока
```
PATCH /api/study-plans/{planId}/lessons/{lessonId}
```
**Тело запроса:**
```typescript
{
  hasVideo?: boolean;
  hasPresentation?: boolean;
  hasTest?: boolean;
  responsible?: string;
}
```

### 3. AI-анализ

#### 3.1. Получение аналитики плана
```
GET /api/study-plans/{id}/analysis
```
**Ответ:**
```typescript
{
  issues: Array<{
    type: 'critical' | 'warning' | 'suggestion';
    message: string;
    details: string;
  }>;
  recommendations: string[];
  complianceScore: number;
}
```

## Права доступа

### Роли пользователей:
1. Администратор:
   - Полный доступ к учебным планам
   - Управление всеми планами
   - Экспорт данных

2. Методист:
   - Просмотр всех планов
   - Анализ и рекомендации
   - Проверка соответствия

3. Преподаватель:
   - Просмотр своих планов
   - Обновление материалов
   - Отметка выполнения

4. Куратор:
   - Просмотр планов своей группы
   - Мониторинг прогресса
   - Получение уведомлений

## Примеры запросов

### Получение списка планов с фильтрацией
```bash
curl -X GET http://api.example.com/api/study-plans \
  -H "Authorization: Bearer {token}" \
  -d '{
    "class": "10A",
    "subject": "Алгебра",
    "teacher": "Иванова Л."
  }'
```

### Обновление материалов урока
```bash
curl -X PATCH http://api.example.com/api/study-plans/1/lessons/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "hasVideo": true,
    "hasPresentation": true,
    "hasTest": false,
    "responsible": "Иванова Л."
  }'
```

## Коды ответов
- 200: Успешное выполнение
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Требования к данным
1. Валидация всех входных данных
2. Проверка прав доступа
3. Контроль целостности данных
4. Отслеживание изменений
5. Сохранение истории изменений

## Дополнительные функции
1. Экспорт в Excel
2. AI-анализ планов
3. Отслеживание прогресса
4. Уведомления об изменениях
5. Проверка соответствия базовому плану

## Интеграции
1. Система управления обучением
2. Система хранения материалов
3. Система уведомлений
4. Excel для экспорта
5. AI-система для анализа

## UI Компоненты

### StudyPlanModal (Модальное окно плана)
```typescript
interface StudyPlanModalProps {
  plan: StudyPlan | null;
  onClose: () => void;
}
```

### LessonTable (Таблица уроков)
```typescript
interface LessonTableProps {
  lessons: Lesson[];
  onStatusChange: (lessonId: string, updates: Partial<Lesson>) => void;
}
```

## Статусы и индикаторы

### Статусы выполнения
```typescript
type Status = 'ok' | 'incomplete' | 'critical';

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'ok': return 'bg-green-100 text-green-800';
    case 'incomplete': return 'bg-yellow-100 text-yellow-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### Индикаторы прогресса
```typescript
const getCompletionIcon = (completed: number, total: number) => {
  const percentage = (completed / total) * 100;
  if (percentage === 100) return '✅';
  if (percentage >= 50) return '⚠️';
  return '❌';
};
``` 