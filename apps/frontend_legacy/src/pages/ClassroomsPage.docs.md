# Документация API для ClassroomsPage (Управление аудиториями)

## Общее описание
API для системы управления аудиторным фондом образовательного учреждения. Система обеспечивает учет и управление аудиториями, их оснащением, ответственными лицами и техническим состоянием.

## Модели данных

### Classroom (Аудитория)
```typescript
interface Classroom {
  id: string;                // Уникальный идентификатор
  number: string;            // Номер аудитории
  name: string;             // Название
  type: RoomType;           // Тип помещения
  capacity: number;         // Вместимость
  status: RoomStatus;       // Статус
  equipment: Equipment[];    // Оснащение
  responsiblePersons: ResponsiblePerson[];  // Ответственные лица
  lastUpdate: string;       // Дата последнего обновления
  schedule?: {              // Расписание (опционально)
    day: string;
    timeStart: string;
    timeEnd: string;
    status: string;
  }[];
  documents: ClassroomDocument[];  // Документы
}

type RoomType = 'lecture' | 'computer' | 'laboratory' | 
                'conference' | 'cabinet';

type RoomStatus = 'free' | 'occupied' | 'maintenance';

interface Equipment {
  name: string;            // Название оборудования
  quantity?: number;       // Количество
  status: boolean;        // Состояние (работает/не работает)
}

interface ResponsiblePerson {
  name: string;           // ФИО
  role: string;          // Роль
  lastCheck?: string;    // Дата последней проверки
}

interface ClassroomDocument {
  type: string;          // Тип документа
  name: string;         // Название
  url: string;          // Ссылка на документ
}
```

## API Endpoints

### 1. Управление аудиториями

#### 1.1. Получение списка аудиторий
```
GET /api/classrooms
```
**Query параметры:**
- `type` (string, опционально) - тип помещения
- `status` (string, опционально) - статус
- `equipment` (string, опционально) - поиск по оснащению
- `capacity` (number, опционально) - минимальная вместимость
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  classrooms: Classroom[];
  total: number;
  summary: {
    total: number;
    byType: Record<RoomType, number>;
    byStatus: Record<RoomStatus, number>;
  };
}
```

#### 1.2. Создание аудитории
```
POST /api/classrooms
```
**Тело запроса:**
```typescript
{
  number: string;
  name: string;
  type: RoomType;
  capacity: number;
  equipment: Equipment[];
  responsiblePersons: ResponsiblePerson[];
}
```

#### 1.3. Обновление информации об аудитории
```
PATCH /api/classrooms/{id}
```
**Тело запроса:**
```typescript
{
  name?: string;
  type?: RoomType;
  capacity?: number;
  status?: RoomStatus;
  equipment?: Equipment[];
  responsiblePersons?: ResponsiblePerson[];
}
```

### 2. Управление оборудованием

#### 2.1. Добавление оборудования
```
POST /api/classrooms/{id}/equipment
```
**Тело запроса:**
```typescript
{
  name: string;
  quantity?: number;
  status: boolean;
}
```

#### 2.2. Обновление статуса оборудования
```
PATCH /api/classrooms/{id}/equipment/{equipmentId}
```
**Тело запроса:**
```typescript
{
  status: boolean;
  lastCheck?: string;
  comment?: string;
}
```

### 3. Управление документами

#### 3.1. Загрузка документа
```
POST /api/classrooms/{id}/documents
```
**Тело запроса:**
Multipart form data:
- `file`: File
- `type`: string
- `name`: string

#### 3.2. Получение документов аудитории
```
GET /api/classrooms/{id}/documents
```
**Ответ:**
```typescript
{
  documents: ClassroomDocument[];
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

### Создание новой аудитории
```bash
curl -X POST http://api.example.com/api/classrooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "number": "301",
    "name": "Лекционный зал",
    "type": "lecture",
    "capacity": 120,
    "equipment": [
      {
        "name": "Проектор",
        "status": true
      },
      {
        "name": "Микрофон",
        "status": true
      }
    ],
    "responsiblePersons": [
      {
        "name": "Сатенов Е.",
        "role": "Основной"
      }
    ]
  }'
```

### Обновление статуса аудитории
```bash
curl -X PATCH http://api.example.com/api/classrooms/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "status": "maintenance",
    "comment": "Плановый ремонт оборудования"
  }'
```

## Примечания по безопасности
1. Права доступа:
   - Просмотр: все авторизованные пользователи
   - Создание/редактирование: администраторы
   - Управление оборудованием: технический персонал
   - Управление документами: ответственные лица
2. Логирование всех изменений
3. Контроль доступа к документам
4. Валидация данных оборудования
5. Защита от несанкционированного доступа

## Требования к валидации
1. Уникальность номера аудитории
2. Корректность типа помещения
3. Валидация вместимости
4. Проверка статуса оборудования
5. Валидация форматов документов

## Дополнительные требования
1. Автоматическое обновление статуса
2. История изменений состояния
3. Планирование технического обслуживания
4. Инвентаризация оборудования
5. Генерация отчетов

## Интеграции
1. Система бронирования аудиторий
2. Система учета оборудования
3. Система технического обслуживания
4. Система документооборота
5. Система инвентаризации
6. Система отчетности 