# Документация API для SalariesPage (Зарплаты и фонды)

## Общее описание
API для управления зарплатами и фондами в образовательной организации, включая начисление заработной платы, управление фондами оплаты труда, премиями и надбавками, а также формирование отчетности.

## Модели данных

### Salary (Зарплата)
```typescript
interface Salary {
  id: string;                // Уникальный идентификатор
  employeeId: string;        // ID сотрудника
  amount: number;            // Сумма начисления
  baseSalary: number;        // Базовый оклад
  bonuses: number;           // Премии
  allowances: number;        // Надбавки
  deductions: number;        // Удержания
  period: string;            // Период начисления
  status: 'draft' | 'calculated' | 'approved' | 'paid';  // Статус
  paymentDate?: string;      // Дата выплаты
  comment?: string;          // Комментарий
}
```

### SalaryFund (Фонд оплаты труда)
```typescript
interface SalaryFund {
  id: string;               // Уникальный идентификатор
  name: string;             // Название фонда
  type: 'main' | 'bonus' | 'allowance' | 'special';  // Тип фонда
  budget: number;           // Бюджет
  spent: number;            // Израсходовано
  remaining: number;        // Остаток
  period: string;           // Период
  description?: string;     // Описание
  status: 'active' | 'closed' | 'planned';  // Статус
}
```

### PayrollSummary (Сводка по зарплате)
```typescript
interface PayrollSummary {
  totalPayroll: number;     // Общий фонд оплаты труда
  totalEmployees: number;   // Общее количество сотрудников
  avgSalary: number;        // Средняя зарплата
  fundDistribution: {       // Распределение по фондам
    fundId: string;
    amount: number;
    percentage: number;
  }[];
  departmentStats: {        // Статистика по отделам
    department: string;
    employees: number;
    totalSalary: number;
    avgSalary: number;
  }[];
}
```

## API Endpoints

### 1. Управление зарплатами

#### 1.1. Получение списка начислений
```
GET /api/salaries
```
**Query параметры:**
- `period` (string) - период начисления
- `employeeId` (string, опционально) - ID сотрудника
- `department` (string, опционально) - отдел
- `status` (string, опционально) - статус начисления
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  salaries: Salary[];
  total: number;
  summary: PayrollSummary;
}
```

#### 1.2. Расчет зарплаты
```
POST /api/salaries/calculate
```
**Тело запроса:**
```typescript
{
  employeeIds: string[];
  period: string;
  includeAllowances: boolean;
  includeBonuses: boolean;
  taxSettings: {
    incomeTax: number;
    pensionFund: number;
    socialInsurance: number;
  };
}
```

#### 1.3. Утверждение начислений
```
POST /api/salaries/approve
```
**Тело запроса:**
```typescript
{
  salaryIds: string[];
  approverComment?: string;
  notifyEmployees?: boolean;
}
```

### 2. Управление фондами

#### 2.1. Создание фонда
```
POST /api/salary-funds
```
**Тело запроса:**
```typescript
{
  name: string;
  type: 'main' | 'bonus' | 'allowance' | 'special';
  budget: number;
  period: string;
  description?: string;
  distribution?: {
    departmentId: string;
    percentage: number;
  }[];
}
```

#### 2.2. Получение статистики по фондам
```
GET /api/salary-funds/statistics
```
**Query параметры:**
- `period` (string) - период
- `type` (string[], опционально) - типы фондов
- `includeHistory` (boolean) - включить историю использования

**Ответ:**
```typescript
{
  funds: {
    id: string;
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    utilizationRate: number;
  }[];
  history: {
    period: string;
    totalBudget: number;
    totalSpent: number;
    efficiency: number;
  }[];
}
```

### 3. Аналитика и отчетность

#### 3.1. Анализ расходов на оплату труда
```
GET /api/salaries/analytics
```
**Query параметры:**
- `period` (string) - период анализа
- `groupBy` ('department' | 'position' | 'fund')
- `metrics` (string[]) - метрики для анализа

**Ответ:**
```typescript
{
  summary: {
    totalCost: number;
    averageSalary: number;
    salaryGrowth: number;
    employeeCount: number;
  };
  distribution: {
    category: string;
    amount: number;
    percentage: number;
    employees: number;
  }[];
  trends: {
    period: string;
    metrics: Record<string, number>;
  }[];
}
```

#### 3.2. Генерация отчетов по зарплате
```
POST /api/salaries/reports
```
**Тело запроса:**
```typescript
{
  type: 'payroll' | 'fund-utilization' | 'department-analysis';
  period: string;
  format: 'pdf' | 'xlsx';
  filters?: {
    departments?: string[];
    employeeTypes?: string[];
    fundTypes?: string[];
  };
  options: {
    includeCharts: boolean;
    includeTotals: boolean;
    groupBy?: string;
  };
}
```

### 4. Интеграция с бухгалтерией

#### 4.1. Экспорт данных в бухгалтерскую систему
```
POST /api/salaries/export/accounting
```
**Тело запроса:**
```typescript
{
  period: string;
  format: 'xml' | 'json';
  system: '1c' | 'sap' | 'other';
  includeDetails: boolean;
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

### Расчет зарплаты
```bash
curl -X POST http://api.example.com/api/salaries/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "employeeIds": ["emp001", "emp002"],
    "period": "2024-03",
    "includeAllowances": true,
    "includeBonuses": true,
    "taxSettings": {
      "incomeTax": 10,
      "pensionFund": 10,
      "socialInsurance": 5
    }
  }'
```

### Создание фонда
```bash
curl -X POST http://api.example.com/api/salary-funds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Премиальный фонд Q1 2024",
    "type": "bonus",
    "budget": 5000000,
    "period": "Q1 2024",
    "description": "Фонд премирования за первый квартал",
    "distribution": [
      {
        "departmentId": "dept1",
        "percentage": 40
      },
      {
        "departmentId": "dept2",
        "percentage": 60
      }
    ]
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр зарплат: только HR и бухгалтерия
   - Расчет зарплаты: только бухгалтерия
   - Управление фондами: финансовый директор
   - Утверждение выплат: руководители подразделений и финансовый директор
3. Все операции с зарплатами логируются
4. Данные о зарплатах шифруются при хранении
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с системой кадрового учета
2. Интеграция с бухгалтерской системой
3. Интеграция с системой учета рабочего времени
4. Интеграция с системой оценки эффективности
5. Интеграция с банковскими системами для выплат
6. Экспорт данных в различные форматы отчетности 