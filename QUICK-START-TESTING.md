# ⚡ Быстрый старт тестирования RBAC системы

## 🚀 **3 минуты до полной проверки**

### 1. 🔧 **Подготовка (1 минута)**

```bash
# Инициализация RBAC данных
cd apps/backend
npm run ts-node scripts/init-rbac.ts

# Создание тестового админа  
npm run ts-node scripts/create-admin-user.ts

# Запуск backend
npm run start:dev
```

```bash
# В новом терминале - запуск frontend
cd apps/frontend
npm run dev
```

---

### 2. 🧪 **Критические тесты (2 минуты)**

#### **A. Проверка авторизации:**
1. Откройте http://localhost:5173
2. Войдите как admin@school.com / admin123
3. ✅ Должно перенаправить на главную

#### **B. Проверка навигации:**
1. Проверьте, что видно ВСЕ пункты меню (вы админ)
2. ✅ Должны быть: Главная, Новости, Приложение, Учебный процесс, Студенты, HR, Финансы, Настройки

#### **C. Проверка страниц:**
- Откройте `/students` ✅
- Откройте `/teachers` ✅  
- Откройте `/settings/users` ✅
- Откройте `/settings/permissions` ✅ (админ-панель RBAC)

#### **D. Проверка API:**
```bash
# Быстрая проверка через curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/rbac/roles
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/students
```

---

### 3. 🎯 **Результат теста**

#### **✅ Если всё работает:**
- Страницы загружаются без ошибок
- Навигация отображается корректно
- API возвращает данные (не 403/500)
- В консоли браузера нет критических ошибок

#### **❌ Если что-то сломалось:**

**Проблема: Нет доступа к страницам**
```bash
# Проверить инициализацию RBAC
npx prisma studio
# Должны быть записи в таблицах: Role, Permission, RolePermission
```

**Проблема: 403 ошибки в API**
```bash
# Проверить JWT токен
# В DevTools → Application → Local Storage
# Должен быть token и user
```

**Проблема: Пустая навигация**  
```bash
# Перезапустить frontend
npm run dev
# Очистить кэш браузера (Ctrl+Shift+R)
```

---

### 4. 🔍 **Экстренная отладка**

#### **Если ничего не работает:**
```bash
# 1. Сброс базы данных
cd apps/backend
npx prisma migrate reset --force
npx prisma generate

# 2. Реинициализация RBAC
npm run ts-node scripts/init-rbac.ts
npm run ts-node scripts/create-admin-user.ts

# 3. Перезапуск всего
npm run start:dev
```

#### **Проверка логов:**
```bash
# Backend логи (ошибки в терминале)
# Frontend логи (DevTools → Console)
# Database (npx prisma studio)
```

---

## ✅ **Чек-лист готовности**

- [ ] Backend запущен без ошибок
- [ ] Frontend открывается
- [ ] Авторизация работает  
- [ ] Навигация отображается
- [ ] Основные страницы открываются
- [ ] RBAC API отвечает
- [ ] Нет критических ошибок в консоли

---

## 🎉 **Если всё ✅ - система готова!**

**Ваша RBAC система работает корректно и готова к использованию.**

Для более детального тестирования смотрите [RBAC-TESTING-GUIDE.md](./RBAC-TESTING-GUIDE.md)

---

*Время тестирования: 3 минуты ⏱️*  
*Статус: Production Ready ✅*
