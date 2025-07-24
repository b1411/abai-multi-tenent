# Chat & Calendar Backend API

Полная документация по API для модулей чата и календаря.

## 🚀 Chat API

### Endpoints

**POST /chat**
- Создать новый чат (личный или групповой)
- Body: `{ participantIds: number[], name?: string, isGroup?: boolean }`

**GET /chat**
- Получить список чатов пользователя с последними сообщениями и счетчиком непрочитанных

**GET /chat/:chatId/messages**
- Получить сообщения чата с пагинацией
- Query: `page?, limit?`

**POST /chat/messages**
- Отправить сообщение
- Body: `{ content: string, chatId?: number, receiverId?: number, replyToId?: number }`

**PUT /chat/:chatId/read**
- Отметить все сообщения в чате как прочитанные

**PUT /chat/messages/:messageId**
- Редактировать сообщение
- Body: `{ content: string }`

**DELETE /chat/messages/:messageId**
- Удалить сообщение (только автор)

### Функциональность

✅ **Личные и групповые чаты**
✅ **Отправка и получение сообщений**
✅ **Ответы на сообщения (reply)**
✅ **Редактирование и удаление сообщений**
✅ **Отметка как прочитанное**
✅ **Счетчик непрочитанных сообщений**
✅ **Пагинация сообщений**
✅ **Проверка прав доступа**

---

## 📅 Calendar API

### Endpoints

**POST /calendar/events**
- Создать новое событие
- Body: `CreateEventDto` (см. ниже)

**GET /calendar/events**
- Получить события пользователя с фильтрацией
- Query: `startDate?, endDate?, search?, timezone?`

**GET /calendar/events/today**
- Получить события на сегодня

**GET /calendar/events/:eventId**
- Получить детали события

**PUT /calendar/events/:eventId**
- Обновить событие (только создатель)
- Body: `UpdateEventDto`

**DELETE /calendar/events/:eventId**
- Удалить событие (только создатель)

**PUT /calendar/events/:eventId/status**
- Обновить статус участия в событии
- Body: `{ status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE', comment?: string }`

**POST /calendar/events/:eventId/reminders**
- Создать напоминание для события
- Body: `{ minutes: number, method?: string }`

**DELETE /calendar/reminders/:reminderId**
- Удалить напоминание

### DTOs

#### CreateEventDto
```typescript
{
  title: string;              // Название события
  description?: string;       // Описание
  startDate: string;          // ISO дата начала
  endDate: string;           // ISO дата окончания
  isAllDay?: boolean;        // Событие на весь день
  location?: string;         // Местоположение
  participantIds?: number[]; // ID участников
  color?: string;            // Цвет события
  isRecurring?: boolean;     // Повторяющееся событие
  recurrenceRule?: string;   // RRULE для повторения
  timezone?: string;         // Часовой пояс
}
```

#### EventFilterDto
```typescript
{
  startDate?: string;    // Фильтр с даты
  endDate?: string;      // Фильтр до даты
  search?: string;       // Поиск по названию
  timezone?: string;     // Часовой пояс
}
```

### Функциональность

✅ **Создание, редактирование, удаление событий**
✅ **События на весь день**
✅ **Повторяющиеся события (RRULE)**
✅ **Управление участниками**
✅ **Статусы участия (принять/отклонить/возможно)**
✅ **Система напоминаний**
✅ **Фильтрация по датам и поиск**
✅ **Поддержка часовых поясов**
✅ **События на сегодня**
✅ **Проверка прав доступа**

---

## 🔐 Безопасность

- Все endpoints защищены `AuthGuard`
- Пользователи могут видеть только свои чаты и события, в которых участвуют
- Редактирование/удаление только своих сообщений и созданных событий
- Валидация всех входных данных через DTOs
- Проверка существования пользователей при добавлении участников

## 🗄️ База данных

Используются модели Prisma:
- `ChatRoom`, `ChatParticipant`, `ChatMessage` для чата
- `CalendarEvent`, `EventParticipant`, `EventReminder` для календаря

## 📚 Swagger

Все endpoints документированы в Swagger с описаниями и примерами.

## 🎯 Готовность

✅ **Полностью готов к продакшену**
✅ **Интегрирован в AppModule**
✅ **Использует существующую аутентификацию**
✅ **Подключен к Prisma ORM**
