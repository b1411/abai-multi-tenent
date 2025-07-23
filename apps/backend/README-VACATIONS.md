# Модуль управления отпусками (Vacations)

## Описание
Модуль для управления отпусками и больничными листами преподавателей. Поддерживает создание заявок, их согласование, назначение замещений и отслеживание статистики.

## Основные возможности

### 🔐 Права доступа
- **Преподаватели**: могут создавать и редактировать свои заявки
- **HR и Администраторы**: могут просматривать все заявки, изменять статусы, назначать замещения

### 📝 Типы отпусков
- `vacation` - Обычный отпуск
- `sick_leave` - Больничный лист
- `maternity_leave` - Декретный отпуск
- `unpaid_leave` - Отпуск без содержания
- `business_trip` - Командировка

### 📊 Статусы заявок
- `pending` - На рассмотрении
- `approved` - Одобрено
- `rejected` - Отклонено
- `completed` - Завершено

## API Endpoints

### Основные операции
```
POST   /vacations                     - Создать заявку на отпуск
GET    /vacations                     - Получить список отпусков (с фильтрацией)
GET    /vacations/:id                 - Получить отпуск по ID
PATCH  /vacations/:id                 - Обновить заявку
PATCH  /vacations/:id/status          - Обновить статус отпуска
DELETE /vacations/:id                 - Удалить заявку
```

### Статистика и отчеты
```
GET    /vacations/summary             - Общая статистика по отпускам
GET    /vacations/teacher/:id/summary - Сводка по отпускам преподавателя
GET    /vacations/substitutions       - Список замещений
```

## Фильтрация и поиск

### Параметры запроса
- `search` - Поиск по имени преподавателя
- `type` - Фильтр по типу отпуска
- `status` - Фильтр по статусу
- `period` - Фильтр по периоду (current-year, next-year, previous-year)
- `startDate` / `endDate` - Фильтр по датам
- `substituteId` - Фильтр по замещающему преподавателю
- `page` / `limit` - Пагинация

## Структура данных

### CreateVacationDto
```typescript
{
  type: VacationType;           // Тип отпуска
  startDate: string;            // Дата начала (ISO string)
  endDate: string;              // Дата окончания (ISO string)
  days: number;                 // Количество дней
  substituteId?: number;        // ID замещающего преподавателя
  comment?: string;             // Комментарий
  lectureTopics?: string;       // Темы лекций для замещения
}
```

### Ответ API
```typescript
{
  id: number;
  type: VacationType;
  startDate: Date;
  endDate: Date;
  days: number;
  status: VacationStatus;
  comment?: string;
  teacher: {
    id: number;
    user: {
      name: string;
      surname: string;
      email: string;
    }
  };
  substitute?: {
    id: number;
    user: {
      name: string;
      surname: string;
    }
  };
  documents: VacationDocument[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Бизнес-логика

### Валидация
- Проверка пересечений с существующими отпусками
- Валидация прав доступа при редактировании
- Проверка существования замещающего преподавателя

### Уведомления
- Автоматические уведомления при изменении статуса
- Настраиваемые уведомления для HR и администраторов

### Статистика
- Подсчет использованных дней отпуска по преподавателям
- Статистика по типам отпусков
- Аналитика по отделам и периодам

## Интеграция с другими модулями

### Teachers
- Связь с преподавателями через `teacherId`
- Получение информации о замещающих преподавателях

### Notifications
- Создание уведомлений при изменении статуса
- Уведомления о необходимости назначения замещения

### Files
- Прикрепление документов к заявкам через `VacationDocument`

## Примеры использования

### Создание заявки на отпуск
```typescript
const vacation = await vacationsService.create({
  type: 'vacation',
  startDate: '2024-07-01T00:00:00Z',
  endDate: '2024-07-28T00:00:00Z',
  days: 28,
  substituteId: 2,
  comment: 'Плановый летний отпуск',
  lectureTopics: 'Алгебра: многочлены, Геометрия: треугольники'
}, teacherId);
```

### Одобрение заявки
```typescript
const approved = await vacationsService.updateStatus(id, {
  status: 'approved',
  comment: 'Согласовано с руководителем',
  notifyEmployee: true
}, currentUserId);
```

### Получение статистики преподавателя
```typescript
const summary = await vacationsService.getTeacherVacationSummary(teacherId);
// Возвращает: { totalDays: 28, usedDays: 14, remainingDays: 14, sickLeaveDays: 3 }
```

## Безопасность
- Все endpoints защищены аутентификацией
- Проверка прав доступа на уровне контроллера и сервиса
- Валидация входных данных с помощью DTO и class-validator
- Мягкое удаление записей (soft delete)
