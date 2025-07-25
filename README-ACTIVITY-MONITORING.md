# Система мониторинга активности пользователей

Данная система позволяет администраторам отслеживать активность пользователей в системе в режиме реального времени. Она включает детальное логирование действий, управление сессиями и аналитику.

## Функциональные возможности

### 1. Отслеживание активности пользователей
- ✅ Автоматическое логирование всех HTTP запросов
- ✅ Отслеживание времени сессии и последней активности
- ✅ Фиксация IP адресов, устройств и браузеров
- ✅ Логирование входов и выходов из системы
- ✅ Отслеживание текущей страницы пользователя

### 2. Управление сессиями
- ✅ Создание сессий при логине
- ✅ Автоматическое завершение неактивных сессий
- ✅ Отслеживание активных сессий пользователей
- ✅ Корректное завершение сессий при выходе

### 3. Мониторинг онлайн статуса
- ✅ Real-time отслеживание пользователей онлайн
- ✅ Обновление статуса при активности
- ✅ Подсчет количества активных сессий

### 4. Детальное логирование
- ✅ Логирование различных типов активности (LOGIN, LOGOUT, PAGE_VIEW, CREATE, UPDATE, DELETE, API_REQUEST)
- ✅ Сохранение метаданных запросов (URL, метод, IP, User Agent)
- ✅ Фильтрация чувствительных данных
- ✅ Ограничение размера логируемых данных

### 5. Административная панель
- ✅ Список пользователей онлайн
- ✅ История активности с фильтрацией
- ✅ Статистика активности
- ✅ Возможность экспорта данных

## Архитектура решения

### Backend компоненты

#### 1. База данных (Prisma Schema)
```sql
-- Сессии пользователей
UserSession {
  id, userId, sessionToken, ipAddress, userAgent, 
  device, browser, os, location, status, 
  loginAt, lastActivityAt, logoutAt, expiresAt
}

-- Онлайн статус
UserOnlineStatus {
  userId, isOnline, lastSeen, currentPage, sessionCount
}

-- Лог активности
ActivityLog {
  id, userId, sessionId, type, action, description,
  method, url, route, statusCode, requestData, responseData,
  ipAddress, userAgent, duration, success, errorMessage
}

-- Статистика по дням
DailyActivityStats {
  date, totalUsers, activeUsers, newUsers, totalSessions,
  totalPageViews, totalActions, avgSessionTime, peakOnlineUsers
}
```

#### 2. Сервисы
- **ActivityMonitoringService**: Основная логика мониторинга
- **ActivityInterceptor**: Автоматическое логирование HTTP запросов
- **ActivityGateway**: WebSocket для real-time обновлений

#### 3. API Endpoints
```
GET /activity-monitoring/online-users     - Список онлайн пользователей
GET /activity-monitoring/user-activity    - История активности
GET /activity-monitoring/stats            - Статистика активности
GET /activity-monitoring/cleanup-logs     - Очистка старых логов
```

### Frontend компоненты

#### 1. Страница мониторинга
- **ActivityMonitoring.tsx**: Главная страница с табами и статистикой
- **useActivityMonitoring.ts**: WebSocket хук для real-time обновлений
- **ActivityFilters.tsx**: Компонент фильтрации данных активности

#### 2. Функциональность frontend:
- ✅ Real-time подключение через WebSocket
- ✅ Индикатор состояния подключения
- ✅ Отображение онлайн пользователей
- ✅ История активности с фильтрацией
- ✅ Экспорт данных в CSV
- ✅ Автоматические обновления
- ✅ Обработка ошибок подключения

#### 2. Типы активности
```typescript
enum ActivityType {
  LOGIN, LOGOUT, PAGE_VIEW, CREATE, UPDATE, 
  DELETE, FILE_UPLOAD, FILE_DOWNLOAD, 
  CHAT_MESSAGE, API_REQUEST, SEARCH, EXPORT, IMPORT
}
```

## Безопасность и производительность

### 1. Защита данных
- ✅ Доступ только для администраторов (роль ADMIN)
- ✅ Маскирование чувствительных данных в логах
- ✅ Фильтрация паролей, токенов и приватных ключей

### 2. Оптимизация производительности
- ✅ Batch-логирование для снижения нагрузки на БД
- ✅ Индексы в базе данных для быстрого поиска
- ✅ Ограничение размера логируемых данных (1000 символов)
- ✅ Автоматическая очистка старых логов (6 месяцев)

### 3. Настройки мониторинга
```typescript
ActivityMonitoringSettings {
  logPageViews: boolean          // Логировать просмотры страниц
  logApiRequests: boolean        // Логировать API запросы
  logFileOperations: boolean     // Логировать операции с файлами
  logChatMessages: boolean       // Логировать сообщения в чате
  retentionDays: number          // Период хранения (дни)
  sessionTimeoutMinutes: number  // Таймаут сессии (минуты)
  batchLoggingEnabled: boolean   // Включить batch логирование
  batchSize: number              // Размер batch
  enableRealTimeUpdates: boolean // Real-time обновления
  maskSensitiveData: boolean     // Маскировать чувствительные данные
}
```

## Интеграция с существующей системой

### 1. Обновленный AuthService
```typescript
// Создание сессии при логине
async login(loginDto: LoginDto, request?: Request) {
  // ... существующая логика авторизации
  
  // Создание сессии мониторинга
  if (request) {
    const sessionData = this.activityMonitoringService.getSessionDataFromRequest(request);
    await this.activityMonitoringService.createSession(user.id, token, sessionData);
  }
  
  return { access_token: token, user };
}

// Завершение сессии при выходе
async logout(token: string) {
  await this.activityMonitoringService.terminateSession(token);
}
```

### 2. Автоматическое логирование
Интерцептор автоматически логирует все HTTP запросы:
- Определяет тип активности по HTTP методу
- Извлекает информацию о пользователе из запроса
- Обновляет активность сессии
- Сохраняет лог активности

### 3. Real-time обновления (WebSocket)
WebSocket Gateway использует встроенные декораторы NestJS и обеспечивает:
- JWT аутентификация при подключении
- Подключение только администраторов с проверкой роли
- Обработчики событий с использованием `@SubscribeMessage`
- Автоматические уведомления о входе/выходе пользователей
- Обновления списка онлайн пользователей
- Уведомления о новой активности

**WebSocket события:**
- `get-online-users` - запрос списка онлайн пользователей
- `get-activity` - запрос истории активности
- `get-stats` - запрос статистики
- `online-users-update` - обновление списка онлайн пользователей
- `activity-update` - обновление истории активности
- `stats-update` - обновление статистики
- `new-activity` - уведомление о новой активности
- `user-online` / `user-offline` - уведомления о смене статуса

## Примеры использования

### 1. Просмотр онлайн пользователей
```typescript
const onlineUsers = await activityMonitoringService.getOnlineUsers(adminUserId);
```

### 2. Получение истории активности
```typescript
const activity = await activityMonitoringService.getUserActivity(
  adminUserId, 
  targetUserId, 
  limit, 
  offset
);
```

### 3. Получение статистики
```typescript
const stats = await activityMonitoringService.getActivityStats(adminUserId, days);
```

## Развертывание и настройка

### 1. Применение миграций
```bash
cd apps/backend
pnpm prisma db push
```

### 2. Установка зависимостей
```bash
cd apps/backend
pnpm install ua-parser-js @types/ua-parser-js
```

### 3. Переменные окружения
```env
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:5111
```

### 4. Доступ к странице мониторинга
- URL: `/activity-monitoring`
- Доступ: только для пользователей с ролью ADMIN

## Будущие улучшения

### 1. Расширенная аналитика
- [ ] Графики активности по времени
- [ ] Тепловые карты активности
- [ ] Анализ популярных страниц
- [ ] Статистика по устройствам и браузерам

### 2. Уведомления и алерты
- [ ] Уведомления о подозрительной активности
- [ ] Алерты при превышении лимитов
- [ ] Email уведомления администраторам

### 3. Экспорт и отчеты
- [ ] Экспорт в Excel/CSV
- [ ] Автоматические еженедельные отчеты
- [ ] Настраиваемые дашборды

### 4. Интеграция с внешними системами
- [ ] Отправка логов в Elasticsearch
- [ ] Интеграция с системами мониторинга
- [ ] API для внешних аналитических систем

## Заключение

Система мониторинга активности пользователей предоставляет администраторам полный контроль над активностью пользователей в системе. Она обеспечивает безопасность, производительность и удобство использования, при этом соблюдая принципы приватности и защиты данных.

Система готова к использованию и может быть легко расширена дополнительной функциональностью в будущем.
