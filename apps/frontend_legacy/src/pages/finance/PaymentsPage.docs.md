# Документация API для PaymentsPage (Оплаты и задолженности)

## Общее описание
API для управления платежами и задолженностями в образовательной организации, включая отслеживание оплат за обучение, дополнительные услуги, питание и транспорт, а также управление напоминаниями и квитанциями.

## Модели данных

### Payment (Платеж)
```typescript
interface Payment {
  id: string;           // Уникальный идентификатор
  studentId: string;    // ID ученика
  studentName: string;  // ФИО ученика
  grade: string;        // Класс
  serviceType: 'tuition' | 'extra' | 'meals' | 'transportation';  // Тип услуги
  serviceName: string;  // Название услуги
  amount: number;       // Сумма к оплате
  currency: string;     // Валюта
  dueDate: string;      // Срок оплаты
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';  // Статус
  paymentDate?: string; // Дата оплаты
  paidAmount?: number;  // Оплаченная сумма
}
```

### Типы услуг
```typescript
const serviceTypes = {
  tuition: 'Основное обучение',
  extra: 'Дополнительные занятия',
  meals: 'Питание',
  transportation: 'Транспорт'
};
```

### Статусы платежей
```typescript
const paymentStatuses = {
  paid: 'Оплачено',
  unpaid: 'Не оплачено',
  partial: 'Частично оплачено',
  overdue: 'Просрочено'
};
```

## API Endpoints

### 1. Управление платежами

#### 1.1. Получение списка платежей
```
GET /api/payments
```
**Query параметры:**
- `grade` (string, опционально) - фильтр по классу
- `serviceType` (string, опционально) - тип услуги
- `status` (string, опционально) - статус оплаты
- `studentId` (string, опционально) - ID ученика
- `dateFrom` (string, опционально) - начало периода
- `dateTo` (string, опционально) - конец периода
- `search` (string, опционально) - поиск по имени/услуге
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  payments: Payment[];
  total: number;
  summary: {
    totalDue: number;
    totalPaid: number;
    overdueCount: number;
    paidCount: number;
    collectionRate: number;
  };
}
```

#### 1.2. Создание платежа
```
POST /api/payments
```
**Тело запроса:**
```typescript
{
  studentId: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  currency: string;
  dueDate: string;
}
```

#### 1.3. Регистрация оплаты
```
POST /api/payments/:id/pay
```
**Тело запроса:**
```typescript
{
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  comment?: string;
}
```

#### 1.4. Отмена платежа
```
POST /api/payments/:id/cancel
```
**Тело запроса:**
```typescript
{
  reason: string;
  refundRequired?: boolean;
}
```

### 2. Управление напоминаниями

#### 2.1. Отправка напоминания
```
POST /api/payments/:id/remind
```
**Тело запроса:**
```typescript
{
  method: 'email' | 'sms' | 'push';
  template?: string;
  customMessage?: string;
}
```

#### 2.2. Настройка автоматических напоминаний
```
PUT /api/payments/reminders/settings
```
**Тело запроса:**
```typescript
{
  beforeDueDays: number[];
  afterDueDays: number[];
  methods: ('email' | 'sms' | 'push')[];
  templates: Record<string, string>;
  schedule: {
    enabled: boolean;
    timeOfDay: string;
    daysOfWeek: number[];
  };
}
```

### 3. Управление квитанциями

#### 3.1. Генерация квитанции
```
GET /api/payments/:id/invoice
```
**Query параметры:**
- `format` ('pdf' | 'docx') - формат файла
- `template` (string, опционально) - шаблон квитанции
- `lang` (string, опционально) - язык квитанции

#### 3.2. Массовая генерация квитанций
```
POST /api/payments/invoices/bulk
```
**Тело запроса:**
```typescript
{
  paymentIds: string[];
  format: 'pdf' | 'docx';
  template?: string;
  lang?: string;
}
```

### 4. Аналитика

#### 4.1. Получение статистики платежей
```
GET /api/payments/analytics/summary
```
**Query параметры:**
- `period` ('day' | 'week' | 'month' | 'year') - период анализа
- `serviceType` (string, опционально) - тип услуги
- `grade` (string, опционально) - класс

**Ответ:**
```typescript
{
  totalRevenue: number;
  paymentStats: {
    onTime: number;
    late: number;
    outstanding: number;
  };
  byService: Record<string, {
    total: number;
    paid: number;
    rate: number;
  }>;
  trends: Array<{
    date: string;
    amount: number;
    count: number;
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

### Регистрация оплаты
```bash
curl -X POST http://api.example.com/api/payments/p001/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "amount": 150000,
    "paymentDate": "2024-09-10",
    "paymentMethod": "card",
    "comment": "Оплата за первую четверть"
  }'
```

### Отправка напоминания
```bash
curl -X POST http://api.example.com/api/payments/p002/remind \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "method": "email",
    "customMessage": "Напоминаем о необходимости оплаты за обучение"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр платежей: финансовые менеджеры, классные руководители (только свой класс)
   - Регистрация оплат: только финансовые менеджеры и кассиры
   - Отмена платежей: только финансовый директор
   - Отправка напоминаний: финансовые менеджеры и классные руководители
3. Все операции с платежами логируются
4. Данные платежей шифруются при хранении
5. Доступ к банковским реквизитам строго ограничен

## Интеграции
1. Интеграция с бухгалтерской системой
2. Интеграция с банковским эквайрингом
3. Интеграция с системой уведомлений
4. Интеграция с системой электронного документооборота
5. Интеграция с личным кабинетом родителя
6. Экспорт данных в различные форматы 