# Документация API для BookingRequestsPage (Бронирование аудиторий)

## Общее описание
API для системы управления бронированием аудиторий в образовательном учреждении. Система обеспечивает процесс подачи и рассмотрения заявок на бронирование аудиторий, согласование с ответственными лицами и ведение учета использования помещений.

## Модели данных

### BookingRequest (Заявка на бронирование)
```typescript
interface BookingRequest {
  id: string;              // Уникальный идентификатор
  roomNumber: string;      // Номер аудитории
  teacherName: string;     // ФИО преподавателя
  purpose: string;         // Цель бронирования
  startTime: string;       // Время начала
  endTime: string;         // Время окончания
  date: string;           // Дата
  status: 'pending' | 'approved' | 'rejected';  // Статус заявки
  approvals: {            // Статусы согласования
    director: boolean;    // Одобрение директора
    supervisor: boolean;  // Одобрение контролирующего
  };
  comments: Array<{       // Комментарии
    author: string;      // Автор комментария
    text: string;        // Текст комментария
    timestamp: string;   // Время комментария
  }>;
}
```

## API Endpoints

### 1. Управление заявками

#### 1.1. Получение списка заявок
```
GET /api/booking-requests
```
**Query параметры:**
- `roomNumber` (string, опционально) - номер аудитории
- `status` (string, опционально) - статус заявки
- `startDate` (string, опционально) - начальная дата
- `endDate` (string, опционально) - конечная дата
- `teacherId` (string, опционально) - ID преподавателя
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  requests: BookingRequest[];
  total: number;
  currentPage: number;
  totalPages: number;
  summary: {
    pending: number;
    approved: number;
    rejected: number;
  };
}
```

#### 1.2. Создание заявки
```
POST /api/booking-requests
```
**Тело запроса:**
```typescript
{
  roomNumber: string;
  purpose: string;
  date: string;
  startTime: string;
  endTime: string;
  additionalInfo?: string;
}
```

#### 1.3. Обновление статуса заявки
```
PATCH /api/booking-requests/{id}/status
```
**Тело запроса:**
```typescript
{
  status: 'approved' | 'rejected';
  comment?: string;
  approvalType: 'director' | 'supervisor';
}
```

#### 1.4. Добавление комментария
```
POST /api/booking-requests/{id}/comments
```
**Тело запроса:**
```typescript
{
  text: string;
  author: string;
}
```

### 2. Управление аудиториями

#### 2.1. Проверка доступности аудитории
```
GET /api/rooms/availability
```
**Query параметры:**
- `roomNumber` (string) - номер аудитории
- `date` (string) - дата
- `startTime` (string) - время начала
- `endTime` (string) - время окончания

**Ответ:**
```typescript
{
  available: boolean;
  conflictingBookings?: BookingRequest[];
}
```

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 409: Конфликт (аудитория уже забронирована)
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Создание заявки на бронирование
```bash
curl -X POST http://api.example.com/api/booking-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "roomNumber": "301",
    "purpose": "Дополнительное занятие по физике",
    "date": "2024-03-25",
    "startTime": "14:00",
    "endTime": "15:30",
    "additionalInfo": "Требуется проектор"
  }'
```

### Одобрение заявки
```bash
curl -X PATCH http://api.example.com/api/booking-requests/123/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "status": "approved",
    "comment": "Одобряю проведение занятия",
    "approvalType": "director"
  }'
```

## Примечания по безопасности
1. Права доступа:
   - Создание заявок: преподаватели
   - Одобрение заявок: директор, контролирующий
   - Просмотр всех заявок: администраторы
2. Логирование всех действий с заявками
3. Проверка конфликтов бронирования
4. Валидация временных интервалов
5. Защита от дублирования заявок

## Требования к валидации
1. Проверка доступности аудитории
2. Валидация времени (рабочие часы)
3. Проверка прав доступа к аудитории
4. Валидация длительности бронирования
5. Проверка обязательных полей

## Дополнительные требования
1. Уведомления о статусе заявки
2. История изменений статуса
3. Автоматическое отклонение просроченных заявок
4. Периодическое бронирование
5. Экспорт данных в календарь

## Интеграции
1. Система управления расписанием
2. Система уведомлений
3. Система учета оборудования
4. Календарные системы
5. Система контроля доступа
6. Система отчетности 