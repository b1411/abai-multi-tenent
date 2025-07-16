# Документация API для VacationPage (Отпуска и замены)

## Общее описание
API для системы управления отпусками и заменами в образовательном учреждении. Система обеспечивает учет различных типов отпусков, управление заменами преподавателей, обработку документов и формирование отчетности.

## Модели данных

### Vacation (Отпуск)
```typescript
interface Vacation {
  id: string;                // Уникальный идентификатор
  employeeId: string;        // ID сотрудника
  employeeName: string;      // ФИО сотрудника
  department: string;        // Отдел
  position: string;         // Должность
  type: 'vacation' | 'sick-leave' | 'maternity-leave' | 
        'unpaid-leave' | 'business-trip';  // Тип отпуска
  startDate: string;        // Дата начала
  endDate: string;         // Дата окончания
  days: number;            // Количество дней
  status: 'pending' | 'approved' | 'rejected' | 'completed';  // Статус
  substituteId?: string;    // ID замещающего сотрудника
  substituteName?: string;  // ФИО замещающего
  comment?: string;        // Комментарий
  lectureTopics?: string;  // Темы лекций для замены
  documents?: Array<{      // Документы
    name: string;
    url: string;
    size: number;
    uploadDate: string;
  }>;
}
```

### VacationSummary (Сводка по отпускам)
```typescript
interface VacationSummary {
  employeeId: string;      // ID сотрудника
  employeeName: string;    // ФИО сотрудника
  totalDays: number;       // Всего дней отпуска
  usedDays: number;        // Использовано дней
  remainingDays: number;   // Осталось дней
  sickLeaveDays: number;   // Дней на больничном
}
```

## API Endpoints

### 1. Управление отпусками

#### 1.1. Получение списка отпусков
```
GET /api/vacations
```
**Query параметры:**
- `search` (string, опционально) - поиск по имени/отделу
- `type` (string, опционально) - тип отпуска
- `status` (string, опционально) - статус
- `period` (string, опционально) - период
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  vacations: Vacation[];
  total: number;
  summary: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    currentMonth: {
      onVacation: number;
      onSickLeave: number;
      planned: number;
    };
  };
}
```

#### 1.2. Создание заявки на отпуск
```
POST /api/vacations
```
**Тело запроса:**
```typescript
{
  type: 'vacation' | 'sick-leave' | 'maternity-leave' | 
        'unpaid-leave' | 'business-trip';
  startDate: string;
  endDate: string;
  substituteId?: string;
  comment?: string;
  lectureTopics?: string;
  documents?: File[];
}
```

#### 1.3. Обновление статуса отпуска
```
PATCH /api/vacations/{id}/status
```
**Тело запроса:**
```typescript
{
  status: 'approved' | 'rejected' | 'completed';
  comment?: string;
  notifyEmployee?: boolean;
}
```

### 2. Управление заменами

#### 2.1. Получение списка замен
```
GET /api/vacations/substitutions
```
**Query параметры:**
- `date` (string) - дата
- `department` (string, опционально) - отдел
- `substituteId` (string, опционально) - ID замещающего

**Ответ:**
```typescript
{
  substitutions: Array<{
    vacationId: string;
    originalEmployee: {
      id: string;
      name: string;
      subjects: string[];
    };
    substituteEmployee: {
      id: string;
      name: string;
      subjects: string[];
    };
    period: {
      start: string;
      end: string;
    };
    topics: string[];
    status: string;
  }>;
}
```

#### 2.2. Назначение замены
```
POST /api/vacations/{id}/substitution
```
**Тело запроса:**
```typescript
{
  substituteId: string;
  lectureTopics: string;
  notifySubstitute?: boolean;
}
```

### 3. Управление документами

#### 3.1. Загрузка документов
```
POST /api/vacations/{id}/documents
```
**Тело запроса:**
Multipart form data:
- `file`: File (PDF, до 10MB)
- `type`: string ('sick-leave' | 'order' | 'other')
- `description`: string (опционально)

#### 3.2. Получение документов
```
GET /api/vacations/{id}/documents
```
**Ответ:**
```typescript
{
  documents: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadDate: string;
    status: 'active' | 'archived';
  }>;
}
```

### 4. Аналитика и отчетность

#### 4.1. Получение статистики
```
GET /api/vacations/analytics
```
**Query параметры:**
- `period` (string)
- `department` (string, опционально)

**Ответ:**
```typescript
{
  summary: {
    totalEmployees: number;
    onVacation: number;
    onSickLeave: number;
    planned: number;
  };
  byDepartment: Record<string, {
    total: number;
    current: number;
    planned: number;
  }>;
  trends: Array<{
    period: string;
    metrics: Record<string, number>;
  }>;
}
```

#### 4.2. Генерация отчетов
```
POST /api/vacations/reports
```
**Тело запроса:**
```typescript
{
  type: 'vacation-schedule' | 'substitutions' | 'summary';
  period: string;
  format: 'pdf' | 'xlsx';
  filters?: {
    departments?: string[];
    types?: string[];
    status?: string[];
  };
  options: {
    includeDocuments: boolean;
    includeSubstitutions: boolean;
    groupBy?: 'department' | 'month';
  };
}
```

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Создание заявки на отпуск
```bash
curl -X POST http://api.example.com/api/vacations \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer {token}" \
  -F "type=vacation" \
  -F "startDate=2024-06-15" \
  -F "endDate=2024-07-12" \
  -F "substituteId=emp123" \
  -F "lectureTopics=Темы: 1. Алгебра многочленов, 2. Тригонометрия" \
  -F "document=@sick-leave.pdf"
```

### Утверждение отпуска
```bash
curl -X PATCH http://api.example.com/api/vacations/v001/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "status": "approved",
    "comment": "Согласовано с руководителем отдела",
    "notifyEmployee": true
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен
2. Права доступа:
   - Просмотр отпусков: все сотрудники (только свои), HR (все)
   - Создание заявок: все сотрудники
   - Утверждение отпусков: руководители отделов, HR
   - Управление заменами: руководители отделов, HR
3. Все операции с отпусками логируются
4. Документы хранятся в защищенном хранилище
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с HR системой
2. Интеграция с системой расписания
3. Интеграция с системой учета рабочего времени
4. Интеграция с системой документооборота
5. Интеграция с системой уведомлений
6. Экспорт данных в различные форматы отчетности 