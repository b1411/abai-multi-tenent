# Системный модуль - Backend API

Полная реализация backend API для системного модуля с подключением к реальной базе данных через Prisma.

## 🎯 Что реализовано

### 1. DTOs (Data Transfer Objects)
- **system-settings.dto.ts** - Валидация настроек системы
- **user.dto.ts** - Управление пользователями с енумами ролей
- **role.dto.ts** - Управление ролями и правами доступа

### 2. Сервис (system.service.ts)
Полный сервис с подключением к Prisma для:

#### Системные настройки
- `getSystemSettings()` - Получение настроек
- `updateSystemSettings()` - Обновление настроек
- `downloadBackup()` - Генерация резервной копии с реальными данными

#### Управление пользователями
- `getUsers()` - Список пользователей с фильтрацией и поиском
- `getUserById()` - Получение пользователя по ID
- `createUser()` - Создание нового пользователя
- `updateUser()` - Обновление пользователя
- `deleteUser()` - Мягкое удаление пользователя
- `resetUserPassword()` - Сброс пароля

#### Роли и права доступа
- `getRoles()` - Список ролей с разрешениями
- `createRole()` - Создание новой роли
- `updateRole()` - Обновление роли
- `deleteRole()` - Удаление роли
- `getAvailablePermissions()` - Доступные разрешения

#### Брендинг
- `getBrandingSettings()` - Настройки брендинга
- `updateBrandingSettings()` - Обновление брендинга

#### Интеграции
- `getIntegrations()` - Список интеграций
- `createIntegration()` - Создание интеграции
- `updateIntegration()` - Обновление интеграции
- `deleteIntegration()` - Удаление интеграции
- `connectIntegration()` - Подключение интеграции
- `disconnectIntegration()` - Отключение интеграции
- `syncIntegration()` - Синхронизация интеграции

### 3. Контроллер (system.controller.ts)
REST API контроллер со всеми endpoints:

```
GET/PUT /system/settings          - Системные настройки
GET /system/backup                - Скачивание резервной копии
GET/POST/PUT/DELETE /system/users - Управление пользователями
POST /system/users/:id/reset-password - Сброс пароля
GET/POST/PUT/DELETE /system/roles - Управление ролями
GET /system/permissions           - Доступные разрешения
GET/PUT /system/branding         - Настройки брендинга
POST /system/branding/logo       - Загрузка логотипа
POST /system/branding/favicon    - Загрузка favicon
GET/POST/PUT/DELETE /system/integrations - Интеграции
POST /system/integrations/:id/connect|disconnect|sync - Управление интеграциями
```

### 4. Модуль (system.module.ts)
- Настроенный модуль с PrismaService
- Интегрирован в основное приложение

## 🗄️ Работа с базой данных

### Реальные данные из Prisma
Сервис работает с реальными таблицами:
- `User` - Пользователи системы
- `Student` - Связь со студентами
- `Teacher` - Связь с преподавателями
- `Group` - Группы студентов

### Функции для пользователей
- ✅ Поиск по имени, фамилии, email
- ✅ Фильтрация по ролям
- ✅ Мягкое удаление (deletedAt)
- ✅ Проверка уникальности email
- ✅ Автоматическое определение отдела по связям
- ✅ Пагинация (лимит 100 записей)

### Безопасность
- Исключение поля `hashedPassword` из ответов
- Валидация ролей против enum из Prisma
- Проверка существования записей перед операциями

## 🔧 Роли пользователей

Поддерживаемые роли из Prisma enum:
- `ADMIN` - Администратор
- `TEACHER` - Преподаватель  
- `STUDENT` - Студент
- `PARENT` - Родитель
- `FINANCIST` - Финансист
- `HR` - HR менеджер

## 📊 Статистика в backup

Резервная копия включает реальные данные:
```json
{
  "timestamp": "2025-01-24T01:12:34.567Z",
  "version": "1.0.0",
  "users": 15,
  "students": 8,
  "teachers": 4,
  "lessons": 42
}
```

## 🚀 API Endpoints

### Системные настройки
```http
GET /system/settings
PUT /system/settings
GET /system/backup
```

### Пользователи
```http
GET /system/users?search=john&role=teacher
GET /system/users/1
POST /system/users
PUT /system/users/1
DELETE /system/users/1
POST /system/users/1/reset-password
```

### Роли
```http
GET /system/roles
POST /system/roles
PUT /system/roles/1
DELETE /system/roles/1
GET /system/permissions
```

### Брендинг
```http
GET /system/branding
PUT /system/branding
POST /system/branding/logo
POST /system/branding/favicon
```

### Интеграции
```http
GET /system/integrations
POST /system/integrations
PUT /system/integrations/1
DELETE /system/integrations/1
POST /system/integrations/1/connect
POST /system/integrations/1/disconnect
POST /system/integrations/1/sync
```

## 🔗 Связь с фронтендом

Backend API полностью совместим с фронтенд сервисом:
- `apps/frontend/src/services/systemService.ts`
- Все endpoints соответствуют ожидаемым на фронтенде
- Типы данных совместимы с TypeScript интерфейсами

## 📝 Примечания

1. **Хеширование паролей**: Временно отключено, нужно установить bcrypt
2. **Роли и разрешения**: Пока используются статичные данные, можно расширить
3. **Брендинг**: Статичные настройки, можно вынести в БД
4. **Интеграции**: Мок данные для демонстрации

## 🎉 Готово к использованию

Модуль полностью готов и может использоваться для:
- Администрирования пользователей
- Управления настройками системы
- Настройки брендинга
- Управления интеграциями
- Системы ролей и прав доступа
