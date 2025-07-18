# Документация API для SupplyPage

## Общее описание
API для управления системой снабжения, включающей работу с заявками на закупку, управление поставщиками и аналитику закупок.

## Модели данных

### Supplier (Поставщик)
```typescript
interface Supplier {
  id: string;           // Уникальный идентификатор
  name: string;         // Наименование поставщика
  category: string[];   // Категории поставляемых товаров/услуг
  rating: number;       // Рейтинг поставщика
  contactPerson: string; // Контактное лицо
  phone: string;        // Телефон
  email: string;        // Email
  address: string;      // Адрес
}
```

### SupplyRequest (Заявка на закупку)
```typescript
interface SupplyRequest {
  id: string;           // Уникальный идентификатор
  title: string;        // Название заявки
  description: string;  // Описание
  category: string;     // Категория закупки
  priority: 'Низкий' | 'Средний' | 'Высокий';  // Приоритет
  status: 'Черновик' | 'На согласовании' | 'Согласовано' | 
         'Отклонено' | 'В работе' | 'Выполнено';  // Статус
  requestedBy: string;  // Инициатор заявки
  requestDate: Date;    // Дата создания
  estimatedCost: number; // Предполагаемая стоимость
  actualCost?: number;   // Фактическая стоимость
  supplierId?: string;   // ID выбранного поставщика
  approvalChain: {       // Цепочка согласования
    level: number;       // Уровень согласования
    approver: string;    // Согласующее лицо
    status: 'Ожидает' | 'Одобрено' | 'Отклонено'; // Статус согласования
    comment?: string;    // Комментарий
    date?: Date;        // Дата согласования/отклонения
  }[];
}
```

## API Endpoints

### 1. Управление заявками

#### 1.1. Получение списка заявок
```
GET /api/supply/requests
```
**Query параметры:**
- `search` (string, опционально) - поиск по названию или описанию
- `status` (string, опционально) - фильтр по статусу
- `priority` (string, опционально) - фильтр по приоритету
- `category` (string, опционально) - фильтр по категории
- `dateFrom` (string, опционально) - фильтр по дате от
- `dateTo` (string, опционально) - фильтр по дате до

**Ответ:**
```typescript
{
  requests: SupplyRequest[];
  total: number;
}
```

#### 1.2. Создание заявки
```
POST /api/supply/requests
```
**Тело запроса:** `Omit<SupplyRequest, 'id' | 'status' | 'requestDate' | 'approvalChain'>`

#### 1.3. Обновление заявки
```
PUT /api/supply/requests/:id
```
**Тело запроса:** Частичный `SupplyRequest`

#### 1.4. Удаление заявки
```
DELETE /api/supply/requests/:id
```

#### 1.5. Согласование заявки
```
POST /api/supply/requests/:id/approve
```
**Тело запроса:**
```typescript
{
  approved: boolean;
  comment?: string;
}
```

### 2. Управление поставщиками

#### 2.1. Получение списка поставщиков
```
GET /api/supply/suppliers
```
**Query параметры:**
- `search` (string, опционально) - поиск по названию
- `category` (string, опционально) - фильтр по категории
- `minRating` (number, опционально) - минимальный рейтинг

#### 2.2. Создание поставщика
```
POST /api/supply/suppliers
```
**Тело запроса:** `Omit<Supplier, 'id'>`

#### 2.3. Обновление поставщика
```
PUT /api/supply/suppliers/:id
```
**Тело запроса:** Частичный `Supplier`

#### 2.4. Удаление поставщика
```
DELETE /api/supply/suppliers/:id
```

### 3. Аналитика

#### 3.1. Получение статистики закупок
```
GET /api/supply/analytics/summary
```
**Query параметры:**
- `dateFrom` (string) - начало периода
- `dateTo` (string) - конец периода

**Ответ:**
```typescript
{
  totalRequests: number;
  totalCost: number;
  byStatus: Record<SupplyRequest['status'], number>;
  byCategory: Record<string, {
    count: number;
    totalCost: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    name: string;
    requestsCount: number;
    totalCost: number;
  }>;
}
```

#### 3.2. Экспорт отчетов
```
GET /api/supply/analytics/export
```
**Query параметры:**
- `type` ('requests' | 'suppliers' | 'summary') - тип отчета
- `format` ('xlsx' | 'pdf' | 'csv') - формат файла
- `dateFrom` (string, опционально) - начало периода
- `dateTo` (string, опционально) - конец периода

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Создание заявки
```bash
curl -X POST http://api.example.com/api/supply/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Закупка офисной мебели",
    "description": "Необходимо закупить 10 офисных стульев и 5 столов для нового отдела",
    "category": "furniture",
    "priority": "Средний",
    "estimatedCost": 150000
  }'
```

### Согласование заявки
```bash
curl -X POST http://api.example.com/api/supply/requests/REQ-001/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "approved": true,
    "comment": "Согласовано в рамках бюджета"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Создание заявок: все авторизованные пользователи
   - Согласование: только пользователи с соответствующими правами
   - Управление поставщиками: только администраторы и менеджеры по закупкам
   - Просмотр аналитики: только руководители и менеджеры по закупкам
3. Все действия логируются в системе
4. Изменение статуса заявки возможно только в соответствии с бизнес-процессом

## Интеграции
1. Интеграция с бухгалтерской системой
2. Интеграция с системой электронного документооборота
3. Интеграция с системой складского учета
4. Email-уведомления для участников процесса согласования 