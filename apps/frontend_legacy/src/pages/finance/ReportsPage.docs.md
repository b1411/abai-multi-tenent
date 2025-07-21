# Документация API для ReportsPage (Финансовые отчеты)

## Общее описание
API для управления финансовыми отчетами в образовательной организации, включая создание, хранение и анализ различных типов финансовой отчетности, а также генерацию аналитических данных и визуализаций.

## Модели данных

### FinancialReport (Финансовый отчет)
```typescript
interface FinancialReport {
  id: string;           // Уникальный идентификатор
  title: string;        // Название отчета
  period: string;       // Отчетный период
  createdAt: string;    // Дата создания
  type: 'balance' | 'income' | 'expense' | 'tax' | 'custom';  // Тип отчета
  status: 'draft' | 'submitted' | 'approved' | 'final';       // Статус
  author: string;       // Автор
  description: string;  // Описание
  tags: string[];       // Теги
}
```

### Константы
```typescript
const reportTypeLabels = {
  balance: 'Баланс школы',
  income: 'Доходы',
  expense: 'Расходы',
  tax: 'Налоговый отчет',
  custom: 'Пользовательский отчет'
};

const statusLabels = {
  draft: 'Черновик',
  final: 'Финальный',
  approved: 'Утвержден',
  submitted: 'Отправлен'
};
```

### ReportSummary (Сводка по отчетам)
```typescript
interface ReportSummary {
  totalIncome: number;      // Общий доход
  avgPayment: number;       // Средний платеж
  activeStudents: number;   // Активные ученики
  growthRate: number;       // Темп роста
  revenueByMonth: {        // Доходы по месяцам
    month: string;
    value: number;
  }[];
  expensesByCategory: {    // Расходы по категориям
    category: string;
    value: number;
  }[];
}
```

## API Endpoints

### 1. Управление отчетами

#### 1.1. Получение списка отчетов
```
GET /api/reports
```
**Query параметры:**
- `type` (string, опционально) - тип отчета
- `period` (string, опционально) - период
- `status` (string, опционально) - статус
- `search` (string, опционально) - поиск по названию
- `tags` (string[], опционально) - фильтр по тегам
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  reports: FinancialReport[];
  total: number;
  summary: ReportSummary;
}
```

#### 1.2. Создание отчета
```
POST /api/reports
```
**Тело запроса:**
```typescript
{
  title: string;
  type: string;
  period: string;
  description: string;
  tags: string[];
  content: {
    data: any;
    charts?: {
      type: string;
      data: any;
      options?: any;
    }[];
  };
}
```

#### 1.3. Обновление отчета
```
PUT /api/reports/:id
```
**Тело запроса:** Частичный `FinancialReport`

#### 1.4. Изменение статуса отчета
```
PATCH /api/reports/:id/status
```
**Тело запроса:**
```typescript
{
  status: 'draft' | 'submitted' | 'approved' | 'final';
  comment?: string;
}
```

### 2. Аналитика

#### 2.1. Получение финансовой статистики
```
GET /api/reports/analytics/summary
```
**Query параметры:**
- `period` (string) - период анализа
- `type` (string[], опционально) - типы отчетов
- `compareWithPrevious` (boolean) - сравнение с предыдущим периодом

**Ответ:**
```typescript
{
  income: {
    total: number;
    byMonth: Array<{month: string; value: number}>;
    growth: number;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    growth: number;
  };
  metrics: {
    activeStudents: number;
    avgPayment: number;
    collectionRate: number;
  };
  trends: {
    monthly: Array<{
      period: string;
      income: number;
      expenses: number;
      balance: number;
    }>;
  };
}
```

#### 2.2. Анализ трендов
```
GET /api/reports/analytics/trends
```
**Query параметры:**
- `metrics` (string[]) - метрики для анализа
- `period` (string) - период
- `groupBy` ('day' | 'week' | 'month' | 'quarter')

**Ответ:**
```typescript
{
  trends: Array<{
    period: string;
    metrics: Record<string, number>;
  }>;
  forecast: Array<{
    period: string;
    predicted: Record<string, number>;
    confidence: number;
  }>;
}
```

### 3. Экспорт и генерация

#### 3.1. Экспорт отчета
```
POST /api/reports/:id/export
```
**Тело запроса:**
```typescript
{
  format: 'pdf' | 'xlsx' | 'docx';
  template?: string;
  includeCharts: boolean;
  includeSummary: boolean;
  language?: string;
}
```

#### 3.2. Массовый экспорт отчетов
```
POST /api/reports/export/bulk
```
**Тело запроса:**
```typescript
{
  reportIds: string[];
  format: 'pdf' | 'xlsx' | 'docx';
  combineFiles: boolean;
  options: {
    template?: string;
    includeCharts: boolean;
    includeSummary: boolean;
  };
}
```

### 4. Управление шаблонами

#### 4.1. Создание шаблона отчета
```
POST /api/reports/templates
```
**Тело запроса:**
```typescript
{
  name: string;
  type: string;
  structure: {
    sections: Array<{
      title: string;
      type: 'table' | 'chart' | 'text';
      content: any;
    }>;
  };
  defaultFilters?: Record<string, any>;
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

### Создание отчета
```bash
curl -X POST http://api.example.com/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Баланс школы за 3 квартал 2024",
    "type": "balance",
    "period": "Q3 2024",
    "description": "Квартальный отчет о финансовом состоянии школы",
    "tags": ["квартальный", "2024"],
    "content": {
      "data": {
        "income": 15000000,
        "expenses": 12000000,
        "balance": 3000000
      }
    }
  }'
```

### Экспорт отчета
```bash
curl -X POST http://api.example.com/api/reports/r001/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "format": "pdf",
    "includeCharts": true,
    "includeSummary": true,
    "language": "ru"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр отчетов: финансовый отдел, руководство
   - Создание отчетов: только финансовые менеджеры
   - Утверждение отчетов: финансовый директор
   - Доступ к аналитике: руководство и финансовый отдел
3. Все операции с отчетами логируются
4. Чувствительные финансовые данные шифруются
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с бухгалтерской системой
2. Интеграция с системой управления платежами
3. Интеграция с системой управления зарплатами
4. Интеграция с системой аналитики
5. Интеграция с системой документооборота
6. Экспорт данных в различные форматы 