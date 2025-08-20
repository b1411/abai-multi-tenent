# Groups Backend API

Этот модуль предоставляет REST API для управления учебными группами в системе Fizmat.AI.

## Структура файлов

- `src/groups/groups.controller.ts` - REST API контроллер
- `src/groups/groups.service.ts` - Бизнес-логика работы с группами
- `src/groups/groups.module.ts` - NestJS модуль
- `src/groups/dto/create-group.dto.ts` - DTO для создания группы
- `src/groups/dto/update-group.dto.ts` - DTO для обновления группы
- `src/groups/dto/group-statistics.dto.ts` - DTO для статистики групп

## API Endpoints

### Основные операции CRUD

#### `POST /groups`
Создать новую группу
- **Права доступа**: ADMIN
- **Body**: `CreateGroupDto`
- **Response**: Созданная группа

#### `GET /groups`
Получить все группы
- **Права доступа**: ADMIN, TEACHER, STUDENT, PARENT
- **Response**: Массив групп с информацией о студентах

#### `GET /groups/:id`
Получить группу по ID
- **Права доступа**: ADMIN, TEACHER, STUDENT, PARENT
- **Parameters**: `id` - ID группы
- **Response**: Подробная информация о группе

#### `PATCH /groups/:id`
Обновить информацию о группе
- **Права доступа**: ADMIN
- **Parameters**: `id` - ID группы
- **Body**: `UpdateGroupDto`
- **Response**: Обновленная группа

#### `DELETE /groups/:id`
Удалить группу (мягкое удаление)
- **Права доступа**: ADMIN
- **Parameters**: `id` - ID группы
- **Response**: 204 No Content

### Специальные операции

#### `GET /groups/statistics`
Получить статистику по группам
- **Права доступа**: ADMIN, TEACHER, HR
- **Response**: `GroupStatisticsDto`

#### `GET /groups/course/:courseNumber`
Получить группы по номеру курса
- **Права доступа**: ADMIN, TEACHER, STUDENT, PARENT
- **Parameters**: `courseNumber` - Номер курса (1-6)
- **Response**: Массив групп указанного курса

#### `GET /groups/:id/schedule`
Получить расписание группы
- **Права доступа**: ADMIN, TEACHER, STUDENT, PARENT
- **Parameters**: `id` - ID группы
- **Response**: Расписание группы

#### `GET /groups/:id/study-plans`
Получить учебные планы группы
- **Права доступа**: ADMIN, TEACHER, STUDENT, PARENT
- **Parameters**: `id` - ID группы
- **Response**: Учебные планы группы

#### `POST /groups/:groupId/students/:studentId`
Добавить студента в группу
- **Права доступа**: ADMIN
- **Parameters**: 
  - `groupId` - ID группы
  - `studentId` - ID студента
- **Response**: Обновленная информация о студенте

#### `DELETE /groups/students/:studentId`
Исключить студента из группы
- **Права доступа**: ADMIN
- **Parameters**: `studentId` - ID студента
- **Response**: 204 No Content

## DTO Структуры

### CreateGroupDto
```typescript
{
  name: string;        // Название группы (минимум 2 символа)
  courseNumber: number; // Номер курса (1-6)
}
```

### UpdateGroupDto
```typescript
{
  name?: string;        // Опциональное название группы
  courseNumber?: number; // Опциональный номер курса
}
```

### GroupStatisticsDto
```typescript
{
  totalGroups: number;           // Общее количество групп
  totalStudents: number;         // Общее количество студентов
  averageStudentsPerGroup: number; // Среднее количество студентов в группе
  groupsByCourse: {              // Статистика по курсам
    courseNumber: number;
    count: number;
  }[];
}
```

## Валидация

### CreateGroupDto
- `name`: Обязательное поле, строка, минимум 2 символа
- `courseNumber`: Обязательное поле, целое число от 1 до 6

### UpdateGroupDto
- Все поля опциональные
- При указании применяются те же правила валидации, что и для создания

## Права доступа

Модуль использует систему ролей и guard'ов:

- **AuthGuard**: Проверка аутентификации
- **RolesGuard**: Проверка ролей пользователя
- **@Roles**: Декоратор для указания разрешенных ролей

### Роли
- **ADMIN**: Полный доступ ко всем операциям
- **TEACHER**: Просмотр групп и получение информации
- **STUDENT**: Просмотр групп (ограниченный)
- **PARENT**: Просмотр групп (ограниченный)
- **HR**: Просмотр статистики групп

## Обработка ошибок

### HTTP Status Codes
- **200**: Успешное выполнение запроса
- **201**: Успешное создание группы
- **204**: Успешное удаление (без контента)
- **400**: Неверные данные запроса
- **403**: Недостаточно прав доступа
- **404**: Группа или студент не найдены

### Примеры ошибок
```json
{
  "statusCode": 404,
  "message": "Group with ID 1 not found",
  "error": "Not Found"
}
```

## Интеграция с базой данных

Модуль использует Prisma ORM для работы с базой данных:

### Основные запросы
- Получение групп с подсчетом студентов
- Мягкое удаление через поле `deletedAt`
- Включение связанных данных (студенты, расписание, учебные планы)
- Группировка данных для статистики

### Оптимизации
- Использование `include` для получения связанных данных
- Использование `_count` для подсчета количества записей
- Сортировка по курсу и названию группы
- Фильтрация по `deletedAt` для исключения удаленных записей

## Swagger документация

Все endpoints документированы с помощью Swagger декораторов:
- `@ApiTags('Groups')` - Группировка endpoints
- `@ApiOperation()` - Описание операции
- `@ApiResponse()` - Возможные ответы
- `@ApiParam()` - Параметры запроса
- `@ApiBearerAuth()` - Требование авторизации

## Зависимости

Модуль зависит от:
- `PrismaService` - Для работы с базой данных
- `AuthGuard` и `RolesGuard` - Для авторизации
- `@nestjs/swagger` - Для документации API
- `class-validator` - Для валидации DTO

## Будущие улучшения

- Пагинация для больших списков групп
- Поиск групп по названию
- Экспорт данных о группах
- Уведомления при изменениях в группах
- Логирование операций с группами
- Кэширование часто запрашиваемых данных
