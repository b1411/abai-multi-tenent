# Документация API для SchedulePage (Управление расписанием)

## Общее описание
API для системы управления расписанием в образовательном учреждении. Система обеспечивает создание, редактирование и просмотр расписания занятий с учетом различных ролей пользователей (администратор, преподаватель, студент, родитель).

## Модели данных

### Schedule (Расписание)
```typescript
interface Schedule {
  id: string;                    // Уникальный идентификатор
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';  // День недели
  startTime: string;             // Время начала
  endTime: string;              // Время окончания
  classId: string;              // Идентификатор группы
  subject: string;              // Предмет
  teacherId: string;            // ID преподавателя
  teacherName: string;          // ФИО преподавателя
  roomId: string;               // Номер аудитории
  type: 'lesson' | 'consultation' | 'extra';  // Тип занятия
  repeat: 'weekly' | 'biweekly' | 'once';    // Периодичность
  comment?: string;             // Комментарий
  status: 'upcoming' | 'completed' | 'cancelled';  // Статус
}
```

### FilterState (Состояние фильтров)
```typescript
interface FilterState {
  day: string;        // День недели
  classId: string;    // Группа
  subject: string;    // Предмет
  teacherId: string;  // Преподаватель
  roomId: string;     // Аудитория
}
```

## API Endpoints

### 1. Управление расписанием

#### 1.1. Получение расписания
```
GET /api/schedule
```
**Query параметры:**
- `day` (string, опционально) - день недели
- `classId` (string, опционально) - ID группы
- `subject` (string, опционально) - предмет
- `teacherId` (string, опционально) - ID преподавателя
- `roomId` (string, опционально) - номер аудитории

**Ответ:**
```typescript
{
  schedule: Schedule[];
  metadata: {
    totalItems: number;
    filteredItems: number;
  };
}
```

#### 1.2. Добавление занятия
```
POST /api/schedule
```
**Тело запроса:**
```typescript
{
  day: Schedule['day'];
  startTime: string;
  endTime: string;
  classId: string;
  subject: string;
  teacherId: string;
  roomId: string;
  type: Schedule['type'];
  repeat: Schedule['repeat'];
}
```

#### 1.3. Импорт расписания из Excel
```
POST /api/schedule/import
```
**Тело запроса:**
- `file`: Excel файл с расписанием

### 2. Управление аудиториями

#### 2.1. Получение информации об аудитории
```
GET /api/rooms/{roomId}
```
**Ответ:**
```typescript
{
  roomId: string;
  capacity: number;
  equipment: string[];
  schedule: Schedule[];
}
```

### 3. AI-генерация расписания

#### 3.1. Запуск генерации
```
POST /api/schedule/generate
```
**Тело запроса:**
```typescript
{
  constraints: {
    teacherAvailability: Record<string, string[]>;
    roomAvailability: Record<string, string[]>;
    classPreferences: Record<string, any>;
  };
}
```

## Права доступа

### Роли пользователей:
1. Администратор:
   - Полный доступ ко всем функциям
   - Импорт/экспорт расписания
   - AI-генерация расписания

2. Преподаватель:
   - Просмотр своего расписания
   - Фильтрация по группам и предметам

3. Студент:
   - Просмотр расписания своей группы
   - Фильтрация по дням и предметам

4. Родитель:
   - Просмотр расписания группы ребенка
   - Фильтрация по дням и предметам

## Примеры запросов

### Получение расписания группы
```bash
curl -X GET http://api.example.com/api/schedule \
  -H "Authorization: Bearer {token}" \
  -d '{
    "classId": "МК24-1М",
    "day": "monday"
  }'
```

### Добавление нового занятия
```bash
curl -X POST http://api.example.com/api/schedule \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "day": "monday",
    "startTime": "08:00",
    "endTime": "08:45",
    "classId": "МК24-1М",
    "subject": "Алгебра",
    "teacherId": "ivanova",
    "roomId": "301",
    "type": "lesson",
    "repeat": "weekly"
  }'
```

## Коды ответов
- 200: Успешное выполнение
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Требования к данным
1. Валидация временных интервалов
2. Проверка конфликтов в расписании
3. Проверка доступности аудиторий
4. Проверка нагрузки преподавателей
5. Контроль количества занятий в день для групп

## Дополнительные функции
1. Экспорт расписания в Excel
2. Уведомления об изменениях
3. История изменений
4. Статистика занятости аудиторий
5. Оптимизация расписания

## Интеграции
1. Система управления учебным процессом
2. Система учета посещаемости
3. Система уведомлений
4. Календарь Google/Outlook
5. Excel для импорта/экспорта 