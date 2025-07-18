# Документация API для FakePositionsPage (Контроль фиктивных ставок)

## Общее описание
API для системы контроля фиктивных ставок с использованием искусственного интеллекта в образовательном учреждении. Система обеспечивает автоматическое обнаружение потенциальных нарушений, верификацию присутствия сотрудников и управление уведомлениями о нарушениях.

## Модели данных

### FakePositionAlert (Уведомление о нарушении)
```typescript
interface FakePositionAlert {
  id: string;               // Уникальный идентификатор
  employeeId: string;       // ID сотрудника
  employeeName: string;     // ФИО сотрудника
  position: string;         // Должность
  department: string;       // Отдел
  riskLevel: 'high' | 'medium' | 'low' | 'none';  // Уровень риска
  anomalyType: 'no_presence' | 'schedule_conflict' | 'workload_excess' | 
               'qualification_mismatch' | 'document_inconsistency';  // Тип аномалии
  description: string;      // Описание нарушения
  detectedDate: string;     // Дата обнаружения
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';  // Статус
  evidences: Array<{        // Доказательства
    type: string;
    description: string;
    confidenceScore: number;
  }>;
  aiConfidence: number;     // Уверенность AI
  resolutionNote?: string;  // Примечание по разрешению
  assignedTo?: string;      // Назначено
}
```

### Presence (Присутствие)
```typescript
interface Presence {
  id: string;              // Уникальный идентификатор
  employeeId: string;      // ID сотрудника
  employeeName: string;    // ФИО сотрудника
  date: string;           // Дата
  time: string;           // Время
  photo: string;          // Фото
  location: string;       // Местоположение
  terminalLog?: {         // Данные терминала
    entryTime: string;
    exitTime?: string;
  };
  status: 'confirmed' | 'pending' | 'absent';  // Статус
}
```

## API Endpoints

### 1. Управление уведомлениями

#### 1.1. Получение списка уведомлений
```
GET /api/v1/fake-positions/alerts
```
**Query параметры:**
- `status` ('new' | 'investigating' | 'resolved' | 'dismissed', опционально)
- `riskLevel` ('high' | 'medium' | 'low' | 'none', опционально)
- `search` (string, опционально)
- `page` (number)
- `limit` (number)

**Ответ:**
```typescript
{
  alerts: FakePositionAlert[];
  total: number;
  summary: {
    byStatus: Record<string, number>;
    byRiskLevel: Record<string, number>;
    averageAiConfidence: number;
  };
}
```

#### 1.2. Обновление статуса уведомления
```
PUT /api/v1/fake-positions/alerts/{alertId}
```
**Тело запроса:**
```typescript
{
  status: 'investigating' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  assignedTo?: string;
}
```

### 2. Управление присутствием

#### 2.1. Получение данных о присутствии
```
GET /api/v1/fake-positions/presence
```
**Query параметры:**
- `date` (string, YYYY-MM-DD)
- `employeeId` (string, опционально)

**Ответ:**
```typescript
{
  presenceData: Presence[];
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
  };
}
```

#### 2.2. Регистрация присутствия
```
POST /api/v1/fake-positions/presence
```
**Тело запроса:**
```typescript
{
  employeeId: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  photo: File;
  location: string;
}
```

### 3. AI проверка

#### 3.1. Запуск AI проверки
```
POST /api/v1/fake-positions/scan
```
**Тело запроса:**
```typescript
{
  dateRange?: {
    start: string;    // YYYY-MM-DD
    end: string;      // YYYY-MM-DD
  };
  departments?: string[];
}
```

**Ответ:**
```typescript
{
  scanId: string;
  startTime: string;
  estimatedDuration: number;
  affectedEmployees: number;
}
```

#### 3.2. Получение результатов проверки
```
GET /api/v1/fake-positions/scan/{scanId}
```
**Ответ:**
```typescript
{
  status: 'running' | 'completed' | 'failed';
  progress: number;
  alerts: FakePositionAlert[];
  summary: {
    totalScanned: number;
    anomaliesFound: number;
    byRiskLevel: Record<string, number>;
  };
}
```

## Интеграции
1. Система контроля доступа
   - Получение данных о входе/выходе сотрудников
   - Верификация присутствия через терминалы

2. Система видеонаблюдения
   - Верификация присутствия через камеры
   - Анализ изображений для подтверждения личности

3. HR система
   - Получение данных о сотрудниках
   - Синхронизация информации о ставках и нагрузке

## Требования к безопасности

### Аутентификация и авторизация
1. Все запросы должны содержать валидный JWT токен
2. Права доступа:
   - Просмотр уведомлений: HR и руководство
   - Управление уведомлениями: только HR
   - Запуск AI проверок: руководство и HR
   - Доступ к данным о присутствии: HR и руководители подразделений

### Защита данных
1. Шифрование всех персональных данных
2. Хранение фотографий в защищенном хранилище
3. Логирование всех действий с уведомлениями
4. Rate limiting для API endpoints

## Кэширование
1. Кэширование списка уведомлений: 5 минут
2. Кэширование данных о присутствии: 1 минута
3. Кэширование результатов AI проверок: 1 час

## Уведомления
1. WebSocket для real-time обновлений:
   - Новые уведомления
   - Изменения статусов
   - Результаты проверок

2. Email уведомления:
   - Критические нарушения
   - Назначение расследования
   - Ежедневные отчеты

## Примеры запросов

### Запуск AI проверки
```bash
curl -X POST http://api.example.com/api/v1/fake-positions/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "dateRange": {
      "start": "2024-03-01",
      "end": "2024-03-31"
    },
    "departments": ["Кафедра естественных наук", "Кафедра математики"]
  }'
```

### Регистрация присутствия
```bash
curl -X POST http://api.example.com/api/v1/fake-positions/presence \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer {token}" \
  -F "employeeId=emp123" \
  -F "date=2024-03-23" \
  -F "time=09:15" \
  -F "photo=@presence.jpg" \
  -F "location=Главный корпус, 203 кабинет"
``` 