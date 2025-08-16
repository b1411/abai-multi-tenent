# Документация API для KpiPage (KPI и эффективность)

## Общее описание
API для системы управления ключевыми показателями эффективности (KPI) в образовательном учреждении. Система обеспечивает оценку эффективности сотрудников по различным категориям, отслеживание динамики показателей и формирование аналитических отчетов.

## Модели данных

### KpiCategory (Категория KPI)
```typescript
interface KpiCategory {
  id: string;           // Уникальный идентификатор
  name: string;         // Название категории
  description: string;  // Описание
  weight: number;       // Вес категории (0-1)
}
```

### KpiMetric (Метрика KPI)
```typescript
interface KpiMetric {
  id: string;           // Уникальный идентификатор
  categoryId: string;   // ID категории
  name: string;         // Название метрики
  description: string;  // Описание
  targetValue: number;  // Целевое значение
  weight: number;       // Вес метрики в категории (0-1)
}
```

### EmployeeKpi (KPI сотрудника)
```typescript
interface EmployeeKpi {
  id: string;              // Уникальный идентификатор
  employeeId: string;      // ID сотрудника
  employeeName: string;    // ФИО сотрудника
  department: string;      // Отдел
  position: string;        // Должность
  period: string;         // Период оценки
  metrics: Array<{        // Метрики
    metricId: string;
    actualValue: number;
    percentOfTarget: number;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  totalScore: number;     // Общий балл
  previousScore: number;  // Предыдущий балл
  scoreTrend: 'up' | 'down' | 'stable';  // Тренд
}
```

## API Endpoints

### 1. Управление KPI

#### 1.1. Получение списка KPI сотрудников
```
GET /api/kpi/employees
```
**Query параметры:**
- `search` (string, опционально) - поиск по имени/должности
- `department` (string, опционально) - фильтр по отделу
- `period` (string, опционально) - период оценки
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  employees: EmployeeKpi[];
  total: number;
  summary: {
    averageScore: number;
    byDepartment: Record<string, number>;
    trends: {
      improved: number;
      declined: number;
      stable: number;
    };
  };
}
```

#### 1.2. Получение детальной информации о KPI сотрудника
```
GET /api/kpi/employees/{employeeId}
```
**Query параметры:**
- `period` (string, опционально)
- `includeHistory` (boolean, опционально)

**Ответ:**
```typescript
{
  current: EmployeeKpi;
  history?: Array<{
    period: string;
    totalScore: number;
    categoryScores: Record<string, number>;
  }>;
  trends: {
    monthly: Array<{
      month: string;
      score: number;
    }>;
    byCategory: Record<string, {
      current: number;
      previous: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
}
```

#### 1.3. Обновление KPI сотрудника
```
PUT /api/kpi/employees/{employeeId}
```
**Тело запроса:**
```typescript
{
  period: string;
  metrics: Array<{
    metricId: string;
    actualValue: number;
    notes?: string;
  }>;
}
```

### 2. Управление категориями и метриками

#### 2.1. Создание категории KPI
```
POST /api/kpi/categories
```
**Тело запроса:**
```typescript
{
  name: string;
  description: string;
  weight: number;
}
```

#### 2.2. Создание метрики KPI
```
POST /api/kpi/insights
```
**Тело запроса:**
```typescript
{
  categoryId: string;
  name: string;
  description: string;
  targetValue: number;
  weight: number;
  evaluationCriteria?: {
    excellent: number;
    good: number;
    satisfactory: number;
  };
}
```

### 3. Аналитика и отчетность

#### 3.1. Получение аналитики по KPI
```
GET /api/kpi/analytics
```
**Query параметры:**
- `period` (string)
- `department` (string, опционально)
- `groupBy` ('department' | 'category' | 'position')

**Ответ:**
```typescript
{
  summary: {
    averageScore: number;
    topPerformers: number;
    needsImprovement: number;
    improvementRate: number;
  };
  distribution: {
    byScore: Record<string, number>;
    byCategory: Record<string, {
      average: number;
      min: number;
      max: number;
    }>;
  };
  trends: Array<{
    period: string;
    metrics: Record<string, number>;
  }>;
}
```

#### 3.2. Генерация отчетов
```
POST /api/kpi/reports
```
**Тело запроса:**
```typescript
{
  type: 'individual' | 'department' | 'summary';
  period: string;
  format: 'pdf' | 'xlsx';
  filters?: {
    departments?: string[];
    categories?: string[];
    scoreRange?: {
      min: number;
      max: number;
    };
  };
  options: {
    includeCharts: boolean;
    includeHistory: boolean;
    includeTrends: boolean;
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

### Обновление KPI сотрудника
```bash
curl -X PUT http://api.example.com/api/kpi/employees/emp123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "period": "2024-Q1",
    "metrics": [
      {
        "metricId": "met1",
        "actualValue": 4.3,
        "notes": "Улучшение показателей по сравнению с прошлым периодом"
      },
      {
        "metricId": "met2",
        "actualValue": 97,
        "notes": "Стабильно высокий результат"
      }
    ]
  }'
```

### Генерация отчета
```bash
curl -X POST http://api.example.com/api/kpi/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "type": "department",
    "period": "2024-Q1",
    "format": "pdf",
    "filters": {
      "departments": ["Кафедра математики", "Кафедра филологии"],
      "scoreRange": {
        "min": 4.0,
        "max": 5.0
      }
    },
    "options": {
      "includeCharts": true,
      "includeHistory": true,
      "includeTrends": true
    }
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен
2. Права доступа:
   - Просмотр KPI: сотрудник (только свои), руководители (своего отдела)
   - Редактирование KPI: только HR и руководители отделов
   - Управление категориями и метриками: только HR
   - Доступ к аналитике: руководство и HR
3. Все операции с KPI логируются
4. Данные о показателях шифруются при хранении
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с HR системой
2. Интеграция с системой учета рабочего времени
3. Интеграция с системой оценки успеваемости
4. Интеграция с системой документооборота
5. Интеграция с системой расчета зарплаты
6. Экспорт данных в различные форматы отчетности 