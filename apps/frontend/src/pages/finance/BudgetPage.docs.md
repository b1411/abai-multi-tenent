# Документация API для BudgetPage (Бюджет и прогноз)

## Общее описание
API для управления бюджетом образовательной организации, включая планирование, отслеживание и анализ доходов и расходов, а также прогнозирование финансовых показателей.

## Модели данных

### BudgetItem (Статья бюджета)
```typescript
interface BudgetItem {
  id: string;           // Уникальный идентификатор
  name: string;         // Название статьи
  type: 'income' | 'expense';  // Тип: доход/расход
  category: string;     // Категория
  plannedAmount: number;  // Плановая сумма
  actualAmount: number;   // Фактическая сумма
  variance: number;       // Отклонение
  variancePercent: number; // Процент отклонения
  trend: 'up' | 'down' | 'stable';  // Тренд
  period: string;        // Период (квартал)
  responsible?: string;  // Ответственное лицо
  status: 'pending' | 'active' | 'closed';  // Статус
}
```

### Категории доходов
```typescript
const incomeCategories = {
  tuition: 'Оплата за обучение',
  grants: 'Гранты и субсидии',
  donations: 'Пожертвования',
  rentals: 'Аренда помещений',
  services: 'Дополнительные услуги',
  other_income: 'Прочие доходы'
};
```

### Категории расходов
```typescript
const expenseCategories = {
  salaries: 'Зарплаты и компенсации',
  infrastructure: 'Инфраструктура',
  utilities: 'Коммунальные услуги',
  materials: 'Учебные материалы',
  equipment: 'Оборудование',
  events: 'Мероприятия',
  services: 'Услуги сторонних организаций',
  other_expense: 'Прочие расходы'
};
```

## API Endpoints

### 1. Управление бюджетными статьями

#### 1.1. Получение списка статей
```
GET /api/budget/items
```
**Query параметры:**
- `period` (string) - период (квартал)
- `type` ('income' | 'expense', опционально) - тип статьи
- `category` (string, опционально) - категория
- `status` (string, опционально) - статус
- `responsible` (string, опционально) - ответственное лицо
- `search` (string, опционально) - поиск по названию

**Ответ:**
```typescript
{
  items: BudgetItem[];
  summary: {
    totalPlannedIncome: number;
    totalActualIncome: number;
    totalPlannedExpense: number;
    totalActualExpense: number;
    plannedBalance: number;
    actualBalance: number;
    incomeVariance: number;
    expenseVariance: number;
  };
}
```

#### 1.2. Создание статьи
```
POST /api/budget/items
```
**Тело запроса:** `Omit<BudgetItem, 'id' | 'variance' | 'variancePercent' | 'trend'>`

#### 1.3. Обновление статьи
```
PUT /api/budget/items/:id
```
**Тело запроса:** Частичный `BudgetItem`

#### 1.4. Удаление статьи
```
DELETE /api/budget/items/:id
```

### 2. Аналитика

#### 2.1. Получение сводной статистики
```
GET /api/budget/analytics/summary
```
**Query параметры:**
- `period` (string) - период анализа
- `compareWithPrevious` (boolean, опционально) - сравнение с предыдущим периодом

**Ответ:**
```typescript
{
  currentPeriod: {
    income: {
      planned: number;
      actual: number;
      variance: number;
      byCategory: Record<string, {
        planned: number;
        actual: number;
        variance: number;
      }>;
    };
    expense: {
      planned: number;
      actual: number;
      variance: number;
      byCategory: Record<string, {
        planned: number;
        actual: number;
        variance: number;
      }>;
    };
    balance: {
      planned: number;
      actual: number;
      variance: number;
    };
  };
  previousPeriod?: {
    // Та же структура, что и currentPeriod
  };
  trends: {
    income: Array<{
      period: string;
      planned: number;
      actual: number;
    }>;
    expense: Array<{
      period: string;
      planned: number;
      actual: number;
    }>;
  };
}
```

#### 2.2. Получение прогноза
```
GET /api/budget/analytics/forecast
```
**Query параметры:**
- `periods` (number) - количество периодов для прогноза
- `confidence` (number, опционально) - уровень доверия (0-1)

**Ответ:**
```typescript
{
  forecast: Array<{
    period: string;
    income: {
      expected: number;
      min: number;
      max: number;
    };
    expense: {
      expected: number;
      min: number;
      max: number;
    };
  }>;
  factors: Array<{
    name: string;
    impact: number;
    trend: 'positive' | 'negative' | 'neutral';
  }>;
}
```

#### 2.3. Экспорт отчетов
```
GET /api/budget/export
```
**Query параметры:**
- `type` ('summary' | 'details' | 'forecast') - тип отчета
- `period` (string) - период
- `format` ('xlsx' | 'pdf' | 'csv') - формат файла

### 3. Управление периодами

#### 3.1. Закрытие периода
```
POST /api/budget/periods/:period/close
```
**Тело запроса:**
```typescript
{
  notes?: string;
  adjustments?: Array<{
    itemId: string;
    actualAmount: number;
    comment: string;
  }>;
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

### Создание бюджетной статьи
```bash
curl -X POST http://api.example.com/api/budget/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Оплата за обучение",
    "type": "income",
    "category": "tuition",
    "plannedAmount": 25000000,
    "period": "2024 Q3",
    "status": "active"
  }'
```

### Получение статистики
```bash
curl -X GET "http://api.example.com/api/budget/analytics/summary?period=2024Q3&compareWithPrevious=true" \
  -H "Authorization: Bearer {token}"
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр бюджета: финансовые менеджеры, руководители
   - Создание/редактирование статей: только финансовые менеджеры
   - Закрытие периода: главный бухгалтер или финансовый директор
   - Просмотр прогнозов: только руководство
3. Все финансовые операции логируются
4. Изменение статей закрытого периода запрещено

## Интеграции
1. Интеграция с бухгалтерской системой
2. Интеграция с системой управления платежами
3. Интеграция с системой планирования ресурсов
4. Интеграция с системой отчетности
5. Интеграция с ML-моделями для прогнозирования
6. Экспорт данных в различные форматы 