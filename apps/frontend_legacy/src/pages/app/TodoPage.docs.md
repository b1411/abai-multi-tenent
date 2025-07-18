# Документация API для TodoPage

## Общее описание
API для управления задачами (Todo) с поддержкой drag-and-drop функциональности, фильтрации, сортировки и различных представлений (список/канбан).

## Модели данных

### User
```typescript
interface User {
  id: string;          // Уникальный идентификатор пользователя
  name: string;        // Имя пользователя
  avatar?: string;     // URL аватара пользователя (опционально)
  role: 'teacher' | 'admin' | 'staff';  // Роль пользователя
}
```

### Todo
```typescript
interface Todo {
  id: string;          // Уникальный идентификатор задачи
  title: string;       // Заголовок задачи
  description?: string; // Описание задачи (опционально)
  completed: boolean;   // Статус выполнения
  important: boolean;   // Признак важности
  dueDate?: string;    // Срок выполнения (опционально)
  tags: string[];      // Массив тегов
  createdAt: string;   // Дата создания
  status: 'todo' | 'in_progress' | 'review' | 'done'; // Статус в канбане
  assignee?: User;     // Ответственный (опционально)
  watchers: User[];    // Наблюдатели
  priority: 'low' | 'medium' | 'high'; // Приоритет задачи
}
```

## API Endpoints

### 1. Получение списка задач
```
GET /api/todos
```
**Query параметры:**
- `search` (string, опционально) - поисковый запрос
- `tags` (string[], опционально) - фильтр по тегам
- `sort` ('date' | 'importance', опционально) - тип сортировки
- `status` ('todo' | 'in_progress' | 'review' | 'done', опционально) - фильтр по статусу

**Ответ:**
```typescript
{
  todos: Todo[];
  total: number;
}
```

### 2. Создание задачи
```
POST /api/todos
```
**Тело запроса:**
```typescript
{
  title: string;
  description?: string;
  dueDate?: string;
  tags: string[];
  assigneeId?: string;
  watcherIds: string[];
  priority: 'low' | 'medium' | 'high';
}
```

### 3. Обновление задачи
```
PUT /api/todos/:id
```
**Тело запроса:** То же, что и при создании + дополнительные поля:
```typescript
{
  completed?: boolean;
  important?: boolean;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
}
```

### 4. Удаление задачи
```
DELETE /api/todos/:id
```

### 5. Обновление статуса задачи (для drag-and-drop)
```
PATCH /api/todos/:id/status
```
**Тело запроса:**
```typescript
{
  status: 'todo' | 'in_progress' | 'review' | 'done';
}
```

### 6. Получение списка пользователей
```
GET /api/users
```
**Query параметры:**
- `role` ('teacher' | 'admin' | 'staff', опционально) - фильтр по роли

**Ответ:**
```typescript
{
  users: User[];
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

### Создание новой задачи
```bash
curl -X POST http://api.example.com/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Проверить домашние задания",
    "description": "Проверить и оценить домашние работы учеников 9-го класса",
    "dueDate": "2025-04-15T10:00",
    "tags": ["Проверка", "Домашняя работа"],
    "assigneeId": "1",
    "watcherIds": ["2"],
    "priority": "high"
  }'
```

### Обновление статуса задачи
```bash
curl -X PATCH http://api.example.com/api/todos/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Проверка прав доступа осуществляется на основе роли пользователя
3. Только создатель задачи или администратор могут её удалить
4. Изменение статуса задачи доступно всем участникам (assignee и watchers) 