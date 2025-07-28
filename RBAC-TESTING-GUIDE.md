# 🧪 Руководство по тестированию RBAC системы

## 🚀 **Пошаговое тестирование для предотвращения поломок**

### 1. 🔧 **Подготовка к тестированию**

#### **Шаг 1: Инициализация RBAC данных**
```bash
# Выполнить скрипт инициализации RBAC
cd apps/backend
npm run ts-node scripts/init-rbac.ts

# Или через консоль базы данных
npx prisma studio
```

#### **Шаг 2: Проверка переменных окружения**
Убедитесь, что в `.env` есть:
```env
DATABASE_URL="your_database_url"
JWT_SECRET="your_jwt_secret"
```

#### **Шаг 3: Миграция базы данных**
```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

---

### 2. 🎯 **Backend тестирование (API проверки)**

#### **Запуск backend**
```bash
cd apps/backend
npm run start:dev
```

#### **Проверка RBAC эндпоинтов (через Postman/Insomnia):**

**A. Создание тестового админа:**
```bash
# Выполнить скрипт создания админа
npm run ts-node scripts/create-admin-user.ts
```

**B. Авторизация и получение токена:**
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "admin123"
}
```

**C. Проверка RBAC API:**
```http
# Получение ролей
GET http://localhost:3000/rbac/roles
Authorization: Bearer YOUR_JWT_TOKEN

# Получение разрешений
GET http://localhost:3000/rbac/permissions
Authorization: Bearer YOUR_JWT_TOKEN

# Проверка защищенных эндпоинтов
GET http://localhost:3000/students
Authorization: Bearer YOUR_JWT_TOKEN
```

#### **🔍 Что проверять в ответах:**
- ✅ Статус 200 для разрешенных запросов
- ✅ Статус 403 для запрещенных действий
- ✅ Корректный JSON в ответах
- ✅ Наличие данных о ролях и разрешениях

---

### 3. 🎨 **Frontend тестирование (UI проверки)**

#### **Запуск frontend**
```bash
cd apps/frontend
npm run dev
```

#### **Проверочный чек-лист по страницам:**

**A. Страница входа (Login.tsx)**
- ✅ Страница загружается без ошибок
- ✅ Форма входа работает
- ✅ Успешная авторизация перенаправляет на главную

**B. Навигация (Sidebar.tsx)**
- ✅ Меню отображается корректно
- ✅ Пункты меню соответствуют роли пользователя
- ✅ Недоступные разделы скрыты

**C. Защищенные страницы (с PermissionGuard)**
- ✅ Students.tsx - открывается без ошибок
- ✅ Teachers.tsx - корректно загружается
- ✅ Dashboard.tsx - показывает данные
- ✅ Users.tsx - доступен только админам
- ✅ SystemSettings.tsx - только для админов

**D. Управление ролями**
- ✅ /settings/permissions - админ-панель RBAC
- ✅ Создание/редактирование ролей
- ✅ Назначение разрешений

---

### 4. 🔐 **Тестирование разных ролей**

#### **Создание тестовых пользователей:**

**1. Админ (уже создан через скрипт)**
```typescript
// Должен видеть ВСЁ
Role: ADMIN
Permissions: *:*:ALL
```

**2. Учитель**
```sql
-- Через админ-панель или SQL
INSERT INTO User (email, password, name, role) 
VALUES ('teacher@school.com', 'hashed_password', 'Учитель Тест', 'TEACHER');
```

**3. Студент**
```sql
INSERT INTO User (email, password, name, role) 
VALUES ('student@school.com', 'hashed_password', 'Студент Тест', 'STUDENT');
```

#### **Матрица доступа для тестирования:**

| Страница | Админ | Учитель | Студент | Родитель |
|----------|-------|---------|---------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Students | ✅ | ✅ (свои) | ✅ (себя) | ✅ (детей) |
| Teachers | ✅ | ✅ (себя) | ❌ | ❌ |
| Lessons | ✅ | ✅ (свои) | ✅ (свои) | ✅ (детей) |
| Users | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Payments | ✅ | ❌ | ❌ | ✅ (свои) |
| Reports | ✅ | ✅ (ограниченно) | ❌ | ❌ |

---

### 5. 🚨 **Критические проверки (что НЕ должно сломаться)**

#### **A. Обратная совместимость**
- ✅ Старые роли (ADMIN, TEACHER, STUDENT) работают
- ✅ Fallback на роли, если нет RBAC разрешений
- ✅ Никто не потерял доступ к своим данным

#### **B. Производительность**
- ✅ Страницы загружаются быстро (< 2 сек)
- ✅ API ответы приходят без задержек
- ✅ Навигация переключается мгновенно

#### **C. Безопасность**
- ✅ Нет доступа к чужим данным
- ✅ API возвращает 403 для запрещенных действий
- ✅ Токены проверяются корректно

---

### 6. 🔍 **Автоматизированное тестирование**

#### **Backend тесты (Jest)**
```bash
cd apps/backend
npm run test

# Специфичные RBAC тесты
npm run test -- --grep "RBAC"
npm run test -- --grep "Permission"
```

#### **Frontend тесты**
```bash
cd apps/frontend
npm run test

# Тесты компонентов
npm run test -- PermissionGuard
npm run test -- Sidebar
```

#### **E2E тесты (Playwright/Cypress)**
```bash
# Если настроены E2E тесты
npm run test:e2e
```

---

### 7. 🐛 **Отладка типичных проблем**

#### **Проблема: Пользователь не видит никаких страниц**
```typescript
// Проверить в DevTools → Console
// Должны быть разрешения в localStorage
console.log(localStorage.getItem('user'));
console.log(localStorage.getItem('permissions'));

// Решение: переавторизация или сброс кэша
```

#### **Проблема: API возвращает 403**
```typescript
// Проверить заголовки запроса
const token = localStorage.getItem('token');
console.log('Token:', token);

// Проверить разрешения пользователя
GET /rbac/my-permissions
```

#### **Проблема: Навигация не обновляется**
```typescript
// Очистить кэш и перезагрузить
localStorage.clear();
window.location.reload();
```

---

### 8. 📋 **Чек-лист финальной проверки**

#### **Backend ✅**
- [ ] Все 30 контроллеров отвечают
- [ ] RBAC API работает корректно
- [ ] Разрешения проверяются правильно
- [ ] Нет ошибок в логах сервера

#### **Frontend ✅**
- [ ] Все 50+ страниц открываются
- [ ] Навигация работает по ролям
- [ ] PermissionGuard блокирует доступ корректно
- [ ] Нет ошибок в консоли браузера

#### **Интеграция ✅**
- [ ] Авторизация работает
- [ ] Токены обновляются
- [ ] Данные загружаются
- [ ] Роли и разрешения синхронизированы

---

### 9. 🚀 **Готовность к продакшену**

#### **Последние проверки:**
```bash
# 1. Build без ошибок
cd apps/frontend && npm run build
cd apps/backend && npm run build

# 2. Линтинг чистый
npm run lint

# 3. Тесты проходят
npm run test

# 4. База данных готова
npx prisma migrate deploy
```

#### **Мониторинг после деплоя:**
- 📊 Логи ошибок авторизации
- 📊 Время отклика API
- 📊 Количество 403 ошибок
- 📊 Активность пользователей

---

## ✅ **Итоговый результат**

После прохождения всех тестов у вас будет:
- 🔐 **Безопасная RBAC система**
- 🎯 **Работающий фронтенд без поломок**
- 🚀 **Готовая к продакшену архитектура**
- 📊 **Мониторинг и логирование**

**🎉 Система протестирована и готова к использованию!**

---

*Руководство по тестированию RBAC системы*  
*Версия: Production Ready ✅*
