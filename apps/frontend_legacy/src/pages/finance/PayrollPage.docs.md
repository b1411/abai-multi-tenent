# Документация API для PayrollPage (Управление заработной платой)

## Общее описание
API для управления заработной платой в образовательной организации, включая расчет окладов, премий, ведение штатного расписания и формирование отчетности по фонду оплаты труда.

## Модели данных

### Employee (Сотрудник)
```typescript
interface Employee {
  id: string;           // Уникальный идентификатор
  name: string;         // ФИО сотрудника
  position: string;     // Должность
  department: string;   // Отдел
  base: number;         // Базовый оклад
  bonus: number;        // Премия
  total: number;        // Итоговая сумма
  email?: string;       // Email
  phone?: string;       // Телефон
  startDate?: string;   // Дата начала работы
  education?: string;   // Образование
  achievements?: string[]; // Достижения
  schedule?: string;    // График работы
  photo?: string;       // Фото
  experience?: number;  // Стаж работы
  skills?: string[];    // Компетенции
}
```

### PayrollSummary (Сводка по зарплате)
```typescript
interface PayrollSummary {
  totalPayroll: number;    // Общий фонд оплаты труда
  avgSalary: number;       // Средняя зарплата
  employeeCount: number;   // Количество сотрудников
  payrollGrowth: number;   // Рост ФОТ
  departments: {           // Статистика по отделам
    [key: string]: {
      count: number;       // Количество сотрудников
      total: number;       // Сумма зарплат
      avg: number;         // Средняя зарплата
    };
  };
}
```

## API Endpoints

### 1. Управление сотрудниками

#### 1.1. Получение списка сотрудников
```
GET /api/payroll/employees
```
**Query параметры:**
- `department` (string, опционально) - фильтр по отделу
- `position` (string, опционально) - фильтр по должности
- `search` (string, опционально) - поиск по ФИО
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  employees: Employee[];
  total: number;
  summary: PayrollSummary;
}
```

#### 1.2. Получение информации о сотруднике
```
GET /api/payroll/employees/:id
```

#### 1.3. Создание сотрудника
```
POST /api/payroll/employees
```
**Тело запроса:** `Omit<Employee, 'id' | 'total'>`

#### 1.4. Обновление данных сотрудника
```
PUT /api/payroll/employees/:id
```
**Тело запроса:** Частичный `Employee`

### 2. Управление зарплатами

#### 2.1. Расчет зарплаты
```
POST /api/payroll/calculate
```
**Тело запроса:**
```typescript
{
  period: string;        // Период расчета
  employeeIds?: string[]; // ID сотрудников (если не указано - все)
  includeBonus: boolean; // Включать премии
  taxSettings: {        // Настройки налогов
    incomeTax: number;
    socialTax: number;
    pensionFund: number;
  };
}
```

#### 2.2. Начисление премий
```
POST /api/payroll/bonus
```
**Тело запроса:**
```typescript
{
  employeeId: string;
  amount: number;
  reason: string;
  period: string;
  approvedBy: string;
}
```

#### 2.3. Формирование платежной ведомости
```
POST /api/payroll/payslips
```
**Тело запроса:**
```typescript
{
  period: string;
  departments?: string[];
  format: 'pdf' | 'xlsx';
  includeBonuses: boolean;
  includeDeductions: boolean;
}
```

### 3. Аналитика

#### 3.1. Получение статистики по ФОТ
```
GET /api/payroll/analytics/summary
```
**Query параметры:**
- `period` (string) - период анализа
- `department` (string, опционально) - отдел
- `compareWithPrevious` (boolean) - сравнение с предыдущим периодом

**Ответ:**
```typescript
{
  current: {
    totalPayroll: number;
    byDepartment: Record<string, number>;
    avgSalary: number;
    employeeCount: number;
    bonusPool: number;
  };
  previous?: {
    // Та же структура, что и current
  };
  trends: {
    payroll: Array<{
      period: string;
      amount: number;
    }>;
    headcount: Array<{
      period: string;
      count: number;
    }>;
  };
}
```

#### 3.2. Анализ эффективности
```
GET /api/payroll/analytics/efficiency
```
**Query параметры:**
- `period` (string) - период анализа
- `metrics` (string[]) - метрики для анализа

**Ответ:**
```typescript
{
  payrollToRevenue: number;
  avgSalaryByRole: Record<string, number>;
  salaryGrowth: number;
  turnoverRate: number;
  bonusDistribution: {
    total: number;
    byDepartment: Record<string, number>;
    byReason: Record<string, number>;
  };
}
```

### 4. Отчетность

#### 4.1. Генерация отчетов
```
POST /api/payroll/reports
```
**Тело запроса:**
```typescript
{
  type: 'payroll' | 'tax' | 'statistics' | 'efficiency';
  period: string;
  format: 'pdf' | 'xlsx' | 'docx';
  filters?: {
    departments?: string[];
    positions?: string[];
    employeeTypes?: string[];
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

### Расчет зарплаты
```bash
curl -X POST http://api.example.com/api/payroll/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "period": "2024-03",
    "includeBonus": true,
    "taxSettings": {
      "incomeTax": 10,
      "socialTax": 9.5,
      "pensionFund": 10
    }
  }'
```

### Начисление премии
```bash
curl -X POST http://api.example.com/api/payroll/bonus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "employeeId": "emp123",
    "amount": 50000,
    "reason": "Высокие показатели в работе",
    "period": "2024-03",
    "approvedBy": "dir456"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр зарплат: только HR и финансовый отдел
   - Расчет зарплаты: только бухгалтерия
   - Утверждение премий: только руководители отделов и выше
   - Доступ к аналитике: только руководство
3. Все операции с зарплатами логируются
4. Данные о зарплатах шифруются при хранении
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с бухгалтерской системой
2. Интеграция с HR-системой
3. Интеграция с системой учета рабочего времени
4. Интеграция с системой KPI
5. Интеграция с банковской системой для выплат
6. Экспорт данных в различные форматы для отчетности 