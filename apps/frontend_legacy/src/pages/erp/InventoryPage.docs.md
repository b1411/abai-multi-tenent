# Документация API для InventoryPage

## Общее описание
API для управления цифровой инвентаризацией с поддержкой QR/штрих-кодов, отслеживания местоположения, истории перемещений и технического обслуживания.

## Модели данных

### InventoryItem
```typescript
interface InventoryItem {
  id: string;                // Уникальный идентификатор
  name: string;             // Наименование
  category: string;         // Категория
  location: string;         // Местоположение
  status: 'active' | 'repair' | 'written-off' | 'lost';  // Статус
  purchaseDate: string;     // Дата покупки
  lastInventory: string;    // Дата последней инвентаризации
  cost: number;            // Начальная стоимость
  currentValue: number;    // Текущая стоимость
  responsible: string;     // Ответственное лицо
  qrCode?: string;        // QR-код (опционально)
  barcode?: string;       // Штрих-код (опционально)
  serialNumber?: string;  // Серийный номер (опционально)
  manufacturer?: string;  // Производитель (опционально)
  model?: string;        // Модель (опционально)
  photos?: string[];     // Фотографии (опционально)
  
  warranty?: {
    start: string;      // Дата начала гарантии
    end: string;        // Дата окончания гарантии
    provider: string;   // Поставщик гарантии
  };
  
  maintenanceSchedule?: {
    lastMaintenance: string;   // Дата последнего ТО
    nextMaintenance: string;   // Дата следующего ТО
    provider: string;          // Поставщик услуг ТО
  };
  
  movements?: Array<{
    date: string;           // Дата перемещения
    fromLocation: string;   // Откуда
    toLocation: string;     // Куда
    responsible: string;    // Ответственный за перемещение
    reason: string;        // Причина перемещения
  }>;
}
```

## API Endpoints

### 1. Получение списка инвентаря
```
GET /api/inventory
```
**Query параметры:**
- `search` (string, опционально) - поиск по названию, серийному номеру или штрих-коду
- `category` (string, опционально) - фильтр по категории
- `status` ('active' | 'repair' | 'written-off' | 'lost', опционально) - фильтр по статусу
- `location` (string, опционально) - фильтр по местоположению
- `responsible` (string, опционально) - фильтр по ответственному лицу

**Ответ:**
```typescript
{
  items: InventoryItem[];
  total: number;
}
```

### 2. Получение информации об элементе по ID
```
GET /api/inventory/:id
```

### 3. Получение информации по QR/штрих-коду
```
GET /api/inventory/scan/:code
```

### 4. Создание нового элемента
```
POST /api/inventory
```
**Тело запроса:** `InventoryItem` без поля `id`

### 5. Обновление элемента
```
PUT /api/inventory/:id
```
**Тело запроса:** Частичный `InventoryItem`

### 6. Удаление элемента
```
DELETE /api/inventory/:id
```

### 7. Регистрация перемещения
```
POST /api/inventory/:id/movement
```
**Тело запроса:**
```typescript
{
  fromLocation: string;
  toLocation: string;
  responsible: string;
  reason: string;
}
```

### 8. Обновление статуса
```
PATCH /api/inventory/:id/status
```
**Тело запроса:**
```typescript
{
  status: 'active' | 'repair' | 'written-off' | 'lost';
  reason?: string;
}
```

### 9. Регистрация технического обслуживания
```
POST /api/inventory/:id/maintenance
```
**Тело запроса:**
```typescript
{
  date: string;
  provider: string;
  description: string;
  nextMaintenanceDate: string;
}
```

### 10. Экспорт данных
```
GET /api/inventory/export
```
**Query параметры:**
- `format` ('csv' | 'xlsx' | 'pdf', по умолчанию 'xlsx') - формат экспорта
- `filters` (object, опционально) - те же фильтры, что и при получении списка

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Элемент не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Создание нового элемента инвентаря
```bash
curl -X POST http://api.example.com/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Интерактивная доска Samsung Flip 3",
    "category": "Техника",
    "location": "Кабинет 204",
    "status": "active",
    "purchaseDate": "2024-01-15",
    "cost": 850000,
    "currentValue": 807500,
    "responsible": "Иванов А.П.",
    "serialNumber": "SF3-2024-001",
    "manufacturer": "Samsung",
    "model": "Flip 3",
    "warranty": {
      "start": "2024-01-15",
      "end": "2027-01-15",
      "provider": "Samsung Kazakhstan"
    }
  }'
```

### Регистрация перемещения
```bash
curl -X POST http://api.example.com/api/inventory/1/movement \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "fromLocation": "Кабинет 204",
    "toLocation": "Кабинет 305",
    "responsible": "Петров И.С.",
    "reason": "Перераспределение оборудования"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр: все авторизованные пользователи
   - Создание/редактирование: администраторы и ответственные за инвентаризацию
   - Удаление: только администраторы
   - Регистрация перемещений: администраторы и ответственные лица
3. Все действия логируются в системе
4. При работе со сканером QR/штрих-кодов требуется дополнительная верификация пользователя

## Интеграции
1. Интеграция со сканером QR/штрих-кодов
2. Интеграция с системой бухгалтерского учета
3. Интеграция с системой технического обслуживания
4. Поддержка мобильного приложения для инвентаризации 