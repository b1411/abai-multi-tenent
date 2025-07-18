# Документация API для WorkloadPage (Управление нагрузкой)

## Общее описание
API для системы управления педагогической нагрузкой в образовательном учреждении. Система обеспечивает учет и распределение учебной нагрузки, мониторинг выполнения нормативов, управление расписанием и формирование аналитической отчетности.

## Модели данных

### TeacherWorkload (Нагрузка преподавателя)
```typescript
interface TeacherWorkload {
  id: number;               // Уникальный идентификатор
  name: string;            // ФИО преподавателя
  standardHours: number;   // Нормативная нагрузка
  actualHours: number;     // Фактическая нагрузка
  monthlyHours: MonthlyWorkload[];   // Помесячная нагрузка
  quarterlyHours: QuarterlyWorkload[]; // Поквартальная нагрузка
  dailyHours: DailyWorkload[];      // Ежедневная нагрузка
  overtimeHours: number;   // Сверхурочные часы
  vacationDays: number;    // Дни отпуска
  sickLeaveDays: number;   // Дни больничного
  subjects: Subject[];     // Предметы
  additionalActivities: AdditionalActivity[]; // Дополнительная нагрузка
}

interface MonthlyWorkload {
  month: number;           // Номер месяца
  standardHours: number;   // Нормативные часы
  actualHours: number;     // Фактические часы
}

interface QuarterlyWorkload {
  quarter: number;         // Номер четвертиasd
  standardHours: number;   // Нормативные часы
  actualHours: number;     // Фактические часы
}

interface DailyWorkload {
  date: string;           // Дата
  hours: number;          // Количество часов
  type: WorkloadType;     // Тип нагрузки
  comment: string;        // Комментарий
}

interface Subject {
  name: string;           // Название предмета
  hours: number;          // Количество часов
  classes: string[];      // Классы
}

interface AdditionalActivity {
  name: string;           // Название активности
  hours: number;          // Количество часов
  description: string;    // Описание
}
```

## API Endpoints

### 1. Управление нагрузкой

#### 1.1. Получение списка нагрузки преподавателей
```
GET /api/workload/teachers
```
**Query параметры:**
- `search` (string, опционально) - поиск по имени
- `period` ('month' | 'quarter' | 'year') - период
- `periodValue` (number) - значение периода
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  teachers: TeacherWorkload[];
  total: number;
  summary: {
    totalTeachers: number;
    averageLoad: number;
    overloaded: number;
    underloaded: number;
  };
}
```

#### 1.2. Обновление нагрузки преподавателя
```
PATCH /api/workload/teachers/{id}
```
**Тело запроса:**
```typescript
{
  standardHours?: number;
  actualHours?: number;
  monthlyHours?: MonthlyWorkload[];
  quarterlyHours?: QuarterlyWorkload[];
}
```

#### 1.3. Добавление ежедневной нагрузки
```
POST /api/workload/teachers/{id}/daily
```
**Тело запроса:**
```typescript
{
  date: string;
  hours: number;
  type: 'regular' | 'overtime' | 'sick' | 'vacation';
  comment?: string;
}
```

### 2. Аналитика и отчетность

#### 2.1. Получение статистики нагрузки
```
GET /api/workload/analytics
```
**Query параметры:**
- `period` ('month' | 'quarter' | 'year')
- `periodValue` (number)
- `department` (string, опционально)

**Ответ:**
```typescript
{
  summary: {
    totalHours: number;
    standardHours: number;
    actualHours: number;
    deviation: number;
  };
  bySubject: Array<{
    name: string;
    hours: number;
    teachers: number;
  }>;
  trends: Array<{
    period: string;
    standardHours: number;
    actualHours: number;
  }>;
}
```

#### 2.2. Генерация отчетов
```
POST /api/workload/reports
```
**Тело запроса:**
```typescript
{
  type: 'workload-distribution' | 'subject-analysis' | 'teacher-summary';
  period: {
    type: 'month' | 'quarter' | 'year';
    value: number;
  };
  format: 'pdf' | 'xlsx';
  filters?: {
    departments?: string[];
    subjects?: string[];
    loadType?: string[];
  };
}
```

### 3. Управление предметами и активностями

#### 3.1. Добавление предмета
```
POST /api/workload/teachers/{id}/subjects
```
**Тело запроса:**
```typescript
{
  name: string;
  hours: number;
  classes: string[];
}
```

#### 3.2. Добавление дополнительной активности
```
POST /api/workload/teachers/{id}/activities
```
**Тело запроса:**
```typescript
{
  name: string;
  hours: number;
  description: string;
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

### Обновление нагрузки преподавателя
```bash
curl -X PATCH http://api.example.com/api/workload/teachers/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "standardHours": 180,
    "monthlyHours": [
      {
        "month": 9,
        "standardHours": 40,
        "actualHours": 38
      }
    ]
  }'
```

### Добавление ежедневной нагрузки
```bash
curl -X POST http://api.example.com/api/workload/teachers/123/daily \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "date": "2024-03-15",
    "hours": 6,
    "type": "regular",
    "comment": "Лекции и практические занятия"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен
2. Права доступа:
   - Просмотр нагрузки: преподаватели (только свою), руководители (все)
   - Редактирование нагрузки: руководители отделов, администраторы
   - Управление отчетностью: руководители, администраторы
3. Все изменения нагрузки логируются
4. Требуется подтверждение при значительных изменениях нагрузки
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с системой расписания
2. Интеграция с HR системой
3. Интеграция с системой учета рабочего времени
4. Интеграция с системой отчетности
5. Экспорт данных в различные форматы
6. Интеграция с системой уведомлений 
sasd