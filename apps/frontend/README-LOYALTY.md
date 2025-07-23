# Модуль лояльности студентов

Система анализа лояльности и удовлетворенности студентов на основе отзывов и рейтингов преподавателей.

## Функциональность

### Основные возможности
- 📊 **Анализ отзывов студентов** - сбор и анализ отзывов о преподавателях
- ⭐ **Система рейтингов** - оценка от 1 до 5 звезд с комментариями
- 📈 **Аналитические дашборды** - визуализация данных лояльности
- 🎯 **Трекинг трендов** - отслеживание изменений во времени
- 👨‍🏫 **Аналитика по преподавателям** - индивидуальная статистика
- 👥 **Аналитика по группам** - статистика по учебным группам
- 👍 **Реакции на отзывы** - лайки и пометки "полезно"

### Интерфейс

#### Страница анализа лояльности (`/loyalty`)
Основная страница с двумя вкладками:

**Вкладка "Аналитика":**
- Общая статистика (всего отзывов, средний рейтинг, активные преподаватели/группы, уровень удовлетворенности)
- Распределение рейтингов с визуальными диаграммами
- Топ преподавателей по рейтингу
- Тренды рейтингов по периодам

**Вкладка "Отзывы":**
- Список всех отзывов студентов
- Информация о преподавателе и группе
- Рейтинг в звездах и текстовый комментарий
- Счетчики лайков и полезности
- Пагинация результатов

#### Фильтры
- **Период**: месяц, квартал, год
- **Рейтинг**: фильтр по количеству звезд (1-5)
- **Даты**: диапазон дат "с" и "до"

## Архитектура

### Backend

#### Модели данных (Prisma)
```prisma
model StudentReview {
  id          Int      @id @default(autoincrement())
  studentId   Int
  teacherId   Int
  groupId     Int
  rating      Int      // 1-5 звезд
  comment     String
  likes       Int      @default(0)
  helpful     Int      @default(0)
  isModerated Boolean  @default(false)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  student   User              @relation("StudentReviews", fields: [studentId], references: [id])
  teacher   Teacher           @relation(fields: [teacherId], references: [id])
  group     Group             @relation(fields: [groupId], references: [id])
  reactions ReviewReaction[]
}

model ReviewReaction {
  id       Int                @id @default(autoincrement())
  reviewId Int
  userId   Int
  type     ReviewReactionType
  createdAt DateTime          @default(now())

  review StudentReview @relation(fields: [reviewId], references: [id])
  user   User          @relation("ReviewReactions", fields: [userId], references: [id])

  @@unique([reviewId, userId, type])
}

enum ReviewReactionType {
  LIKE
  HELPFUL
}
```

#### API эндпоинты

**Отзывы:**
- `POST /loyalty/reviews` - создание отзыва
- `GET /loyalty/reviews` - получение списка отзывов
- `GET /loyalty/reviews/:id` - получение отдельного отзыва
- `POST /loyalty/reviews/:id/reactions` - добавление реакции

**Аналитика:**
- `GET /loyalty/analytics` - общая аналитика
- `GET /loyalty/analytics/trends` - тренды по периодам
- `GET /loyalty/analytics/teacher/:id` - аналитика по преподавателю
- `GET /loyalty/analytics/group/:id` - аналитика по группе
- `GET /loyalty/analytics/summary` - общее резюме

#### DTO и фильтры
```typescript
// Создание отзыва
interface CreateReviewDto {
  teacherId: number;
  groupId: number;
  rating: number; // 1-5
  comment: string;
}

// Фильтры
interface LoyaltyFilterDto {
  type?: 'group' | 'direction' | 'teacher' | 'academy';
  period?: 'month' | 'quarter' | 'year';
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
  teacherId?: number;
  groupId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

### Frontend

#### Сервисы
- **LoyaltyService** - работа с API лояльности
- Методы для создания отзывов, получения аналитики, добавления реакций

#### Хуки
- **useLoyalty** - основной хук для работы с данными
- **useReviews** - хук для списка отзывов с автозагрузкой
- **useLoyaltyAnalytics** - хук для аналитических данных
- **useTeacherLoyalty** - аналитика конкретного преподавателя
- **useGroupLoyalty** - аналитика конкретной группы

#### Компоненты
- **Loyalty** - основная страница анализа лояльности
- Система табов (аналитика/отзывы)
- Фильтры по периодам и рейтингам
- Карточки статистики
- Диаграммы распределения рейтингов
- Список отзывов с пагинацией

#### Типы TypeScript
```typescript
interface StudentReview {
  id: number;
  studentId: number;
  teacherId: number;
  groupId: number;
  rating: number;
  comment: string;
  likes: number;
  helpful: number;
  isModerated: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      surname: string;
    };
  };
  group: {
    id: number;
    name: string;
  };
  reactions: ReviewReaction[];
}

interface LoyaltyAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingDistribution[];
  topTeachers: TopTeacher[];
}
```

## Права доступа

### Роли и разрешения
- **ADMIN** - полный доступ ко всем функциям
- **TEACHER** - просмотр собственной аналитики и общих трендов
- **HR** - доступ к аналитике для управления персоналом
- **STUDENT** - создание отзывов и реакций
- **PARENT** - просмотр отзывов (ограниченный)

### Навигация
- Добавлен пункт "Анализ лояльности" в раздел "Студенты" бокового меню
- Иконка: Heart (сердце)
- Доступ: ADMIN, TEACHER, HR

## Интеграции

### С другими модулями
- **Users** - связь с пользователями (студенты, преподаватели)
- **Teachers** - информация о преподавателях
- **Groups** - информация об учебных группах
- **Performance** - может использовать данные лояльности для анализа

### Уведомления
- Уведомления преподавателям о новых отзывах
- Алерты администраторам при низких оценках
- Еженедельные отчеты по трендам

## Будущие улучшения

### Планируемый функционал
1. **AI-анализ комментариев** - автоматическое определение тональности
2. **Автоматическая модерация** - фильтрация неподходящих отзывов
3. **Интеграция с KPI** - влияние лояльности на показатели преподавателей
4. **Мобильные уведомления** - push-уведомления о новых отзывах
5. **Экспорт отчетов** - PDF/Excel отчеты по аналитике
6. **Анонимные отзывы** - возможность оставлять анонимные отзывы
7. **Система рекомендаций** - рекомендации преподавателям по улучшению

### Метрики для мониторинга
- Количество отзывов в день/неделю/месяц
- Средний рейтинг по академии
- Процент активных студентов (оставляющих отзывы)
- Время ответа преподавателей на обратную связь
- Корреляция между лояльностью и успеваемостью

## Техническая информация

### Зависимости
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma, PostgreSQL
- **Валидация**: class-validator, class-transformer

### Производительность
- Индексы в базе данных на часто запрашиваемые поля
- Кэширование аналитических данных
- Пагинация для больших списков отзывов
- Оптимизированные SQL-запросы для аналитики

### Безопасность
- Валидация всех входящих данных
- Проверка прав доступа на уровне API
- Защита от спама (ограничение количества отзывов)
- Логирование всех действий с отзывами
