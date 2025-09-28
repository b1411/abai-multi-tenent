# 🧪 Тестирование системы уведомлений

## Способы тестирования:

### 1. Через npm скрипт (бекенд)
```bash
cd apps/backend
npm run test:notifications
```

### 2. Через curl команды

#### Создание одиночного уведомления:
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": 1,
    "type": "TEST_NOTIFICATION",
    "message": "Тестовое уведомление",
    "url": "/notifications"
  }'
```

#### Массовая отправка уведомлений:
```bash
curl -X POST http://localhost:3000/notifications/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userIds": [1, 2, 3],
    "type": "BULK_TEST",
    "message": "Тестовое массовое уведомление",
    "url": "/dashboard"
  }'
```

### 3. Через Postman

#### Настройка:
1. Откройте Postman
2. Создайте новый запрос
3. Метод: POST
4. URL: `http://localhost:3000/notifications`

#### Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Body (JSON):
```json
{
  "userId": 1,
  "type": "TEST_NOTIFICATION",
  "message": "Тестовое уведомление от Postman",
  "url": "/notifications"
}
```

### 4. Через фронтенд компонент

Добавьте компонент `NotificationTester` на любую страницу:

```tsx
import { NotificationTester } from '../components/NotificationTester';

// В JSX:
<NotificationTester />
```

### 5. Проверка SSE потока

1. Откройте браузер
2. Авторизуйтесь в приложении
3. Откройте Developer Tools (F12)
4. Перейдите на вкладку Network
5. Выполните запрос на создание уведомления
6. Проверьте, что приходит SSE событие

### 6. Проверка в интерфейсе

1. Авторизуйтесь как пользователь
2. Посмотрите на панель уведомлений в шапке (должен появиться красный индикатор)
3. Кликните на колокольчик - должно открыться выпадающее меню с уведомлением
4. Перейдите на страницу `/notifications` - уведомление должно быть в списке

## 🔍 Отладка:

### Логи SSE:
В консоли браузера должны появляться сообщения:
```
Notification stream connected
New notification received: {...}
```

### Логи бэкенда:
```
SSE: Подключение для пользователя X, токен: есть/нет
SSE: Отправляем уведомление пользователю X: {...}
```

### Проверка подключения:
В панели уведомлений должен гореть зеленый индикатор "Подключено"