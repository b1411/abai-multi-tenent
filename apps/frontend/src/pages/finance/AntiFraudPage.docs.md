# Документация API для AntiFraudPage (Антифрод-система)

## Общее описание
API для системы обнаружения и предотвращения мошеннических действий в образовательной платформе, включая анализ подозрительных транзакций, поведенческих паттернов и аномалий в использовании системы.

## Модели данных

### FraudAlert (Сигнал о мошенничестве)
```typescript
interface FraudAlert {
  id: string;                // Уникальный идентификатор
  type: 'payment' | 'access' | 'account' | 'exam' | 'attendance';  // Тип сигнала
  severity: 'low' | 'medium' | 'high' | 'critical';  // Уровень серьезности
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';  // Статус
  timestamp: string;         // Время обнаружения
  description: string;       // Описание сигнала
  entityType: 'student' | 'teacher' | 'group' | 'course';  // Тип связанной сущности
  entityId: string;         // ID связанной сущности
  metadata: {              // Дополнительные данные
    ipAddress?: string;    // IP-адрес
    deviceInfo?: string;   // Информация об устройстве
    location?: string;     // Геолокация
    [key: string]: any;    // Другие метаданные
  };
  riskScore: number;       // Оценка риска (0-100)
}
```

### FraudRule (Правило обнаружения)
```typescript
interface FraudRule {
  id: string;              // Уникальный идентификатор
  name: string;           // Название правила
  description: string;    // Описание правила
  type: 'simple' | 'complex' | 'ml';  // Тип правила
  conditions: {           // Условия срабатывания
    field: string;       // Поле для проверки
    operator: 'eq' | 'gt' | 'lt' | 'contains' | 'pattern';  // Оператор
    value: any;          // Значение для сравнения
  }[];
  actions: {             // Действия при срабатывании
    type: 'alert' | 'block' | 'review' | 'notify';  // Тип действия
    config: any;         // Конфигурация действия
  }[];
  enabled: boolean;      // Активность правила
  priority: number;      // Приоритет (1-100)
}
```

## API Endpoints

### 1. Управление сигналами

#### 1.1. Получение списка сигналов
```
GET /api/antifraud/alerts
```
**Query параметры:**
- `type` (string[], опционально) - типы сигналов
- `severity` (string[], опционально) - уровни серьезности
- `status` (string[], опционально) - статусы
- `dateFrom` (string, опционально) - начало периода
- `dateTo` (string, опционально) - конец периода
- `entityType` (string, опционально) - тип сущности
- `entityId` (string, опционально) - ID сущности
- `minRiskScore` (number, опционально) - минимальный риск-скор
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  alerts: FraudAlert[];
  total: number;
  summary: {
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    averageRiskScore: number;
  };
}
```

#### 1.2. Обновление статуса сигнала
```
PATCH /api/antifraud/alerts/:id/status
```
**Тело запроса:**
```typescript
{
  status: 'investigating' | 'resolved' | 'false_positive';
  comment?: string;
  resolution?: {
    type: 'block' | 'warning' | 'no_action';
    details: string;
  };
}
```

### 2. Управление правилами

#### 2.1. Получение списка правил
```
GET /api/antifraud/rules
```
**Query параметры:**
- `type` (string[], опционально) - типы правил
- `enabled` (boolean, опционально) - статус активности
- `search` (string, опционально) - поиск по названию/описанию

#### 2.2. Создание правила
```
POST /api/antifraud/rules
```
**Тело запроса:** `Omit<FraudRule, 'id'>`

#### 2.3. Обновление правила
```
PUT /api/antifraud/rules/:id
```
**Тело запроса:** Частичный `FraudRule`

#### 2.4. Тестирование правила
```
POST /api/antifraud/rules/test
```
**Тело запроса:**
```typescript
{
  rule: Omit<FraudRule, 'id'>;
  testData: any[];
}
```

### 3. Аналитика

#### 3.1. Получение статистики
```
GET /api/antifraud/analytics/summary
```
**Query параметры:**
- `period` ('day' | 'week' | 'month' | 'year') - период анализа
- `dateFrom` (string, опционально) - начало периода
- `dateTo` (string, опционально) - конец периода

**Ответ:**
```typescript
{
  totalAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  topRules: {
    ruleId: string;
    name: string;
    triggers: number;
    accuracy: number;
  }[];
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  geographicDistribution: Record<string, number>;
  timeDistribution: Record<string, number>;
}
```

#### 3.2. Экспорт отчетов
```
GET /api/antifraud/export
```
**Query параметры:**
- `type` ('alerts' | 'rules' | 'analytics') - тип отчета
- `format` ('xlsx' | 'csv' | 'pdf') - формат файла
- Все фильтры, доступные для соответствующего типа данных

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Получение активных сигналов высокого приоритета
```bash
curl -X GET "http://api.example.com/api/antifraud/alerts?severity=high,critical&status=new,investigating" \
  -H "Authorization: Bearer {token}"
```

### Создание нового правила
```bash
curl -X POST http://api.example.com/api/antifraud/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Множественные попытки входа",
    "description": "Обнаружение множественных неудачных попыток входа с одного IP",
    "type": "simple",
    "conditions": [
      {
        "field": "failed_login_attempts",
        "operator": "gt",
        "value": 5
      }
    ],
    "actions": [
      {
        "type": "block",
        "config": {
          "duration": 3600,
          "reason": "Превышено количество попыток входа"
        }
      }
    ],
    "enabled": true,
    "priority": 80
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр сигналов: только сотрудники службы безопасности и администраторы
   - Управление правилами: только администраторы безопасности
   - Просмотр аналитики: руководители и администраторы безопасности
3. Все действия логируются в системе безопасности
4. IP-адреса и чувствительные данные должны быть зашифрованы

## Интеграции
1. Интеграция с системой аутентификации
2. Интеграция с платежной системой
3. Интеграция с системой мониторинга
4. Интеграция с системой уведомлений
5. Интеграция с внешними базами данных мошенников
6. Интеграция с ML-моделями для выявления аномалий 