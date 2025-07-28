# 🔍 Руководство по отладке 403 ошибок с детальным логированием

## 📊 **Добавлено логирование в Guards:**

### **🔐 AuthGuard логи:**
```
🔐 AuthGuard: GET /students
❌ AuthGuard: No token found in request to GET /students
❌ AuthGuard: Authorization header: undefined

🔐 AuthGuard: GET /students  
🔍 AuthGuard: Token found, verifying...
✅ AuthGuard: Token valid for user: { id: 1, email: 'admin@school.com', role: 'ADMIN' }

🔐 AuthGuard: GET /students
❌ AuthGuard: Token verification failed for GET /students: jwt expired
```

### **🛡️ PermissionGuard логи:**
```
🛡️ PermissionGuard: GET /students
🔍 PermissionGuard: Required permissions: [{ module: 'students', action: 'read' }]
👤 PermissionGuard: User: { id: 1, email: 'admin@school.com', role: 'ADMIN' }
🔍 PermissionGuard: Checking object permission: { module: 'students', action: 'read' }
📋 PermissionGuard: Permission check result: { permission: {...}, hasPermission: true, userId: 1 }
✅ PermissionGuard: ACCESS GRANTED for GET /students

🛡️ PermissionGuard: GET /students
❌ PermissionGuard: No user found in request for GET /students

🛡️ PermissionGuard: GET /students  
❌ PermissionGuard: ACCESS DENIED for GET /students
❌ PermissionGuard: User student@school.com (STUDENT) lacks required permissions
```

## 🔍 **Как анализировать логи:**

### **1. Проверить последовательность guards:**
```
🔐 AuthGuard: GET /students        ← Сначала проверка токена
🛡️ PermissionGuard: GET /students  ← Потом проверка разрешений
```

### **2. Типичные ошибки и решения:**

#### **❌ Проблема: No token found**
```
❌ AuthGuard: No token found in request to GET /students
❌ AuthGuard: Authorization header: undefined
```
**Решение:** Проверить frontend - отправляется ли токен в заголовке

#### **❌ Проблема: Token expired**
```
❌ AuthGuard: Token verification failed: jwt expired
```
**Решение:** Перезайти в систему или обновить токен

#### **❌ Проблема: No user in PermissionGuard**
```
❌ PermissionGuard: No user found in request
```
**Решение:** AuthGuard не прошел или не установил user в request

#### **❌ Проблема: Access denied**
```
❌ PermissionGuard: ACCESS DENIED for GET /students
❌ PermissionGuard: User student@school.com (STUDENT) lacks required permissions
```
**Решение:** У пользователя нет нужных разрешений

## 🧪 **Пошаговая диагностика:**

### **Шаг 1: Запустить backend с логами**
```bash
cd apps/backend
npm run start:dev
```

### **Шаг 2: Сделать тестовый запрос**
```bash
curl -X GET http://localhost:3000/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Шаг 3: Анализировать логи в терминале**

#### **✅ Успешный запрос должен показать:**
```
🔐 AuthGuard: GET /students
🔍 AuthGuard: Token found, verifying...
✅ AuthGuard: Token valid for user: { id: 1, email: 'admin@school.com', role: 'ADMIN' }
🛡️ PermissionGuard: GET /students
🔍 PermissionGuard: Required permissions: [{ module: 'students', action: 'read' }]
👤 PermissionGuard: User: { id: 1, email: 'admin@school.com', role: 'ADMIN' }
🔍 PermissionGuard: Checking object permission: { module: 'students', action: 'read' }
Loading permissions for user: 1 with role: ADMIN
Found role data: ADMIN with 168 permissions
Total permissions loaded: 168
📋 PermissionGuard: Permission check result: { permission: {...}, hasPermission: true, userId: 1 }
✅ PermissionGuard: ACCESS GRANTED for GET /students
```

#### **❌ Проблемный запрос покажет где именно ошибка:**
```
🔐 AuthGuard: GET /students
❌ AuthGuard: No token found in request to GET /students
❌ AuthGuard: Authorization header: undefined
```
**→ Проблема в токене!**

```
🔐 AuthGuard: GET /students
✅ AuthGuard: Token valid for user: { id: 2, email: 'student@school.com', role: 'STUDENT' }
🛡️ PermissionGuard: GET /students
👤 PermissionGuard: User: { id: 2, email: 'student@school.com', role: 'STUDENT' }
Loading permissions for user: 2 with role: STUDENT
No role assignments found, trying to find role by name: STUDENT
Role not found in database: STUDENT
Total permissions loaded: 0
📋 PermissionGuard: Permission check result: { hasPermission: false, userId: 2 }
❌ PermissionGuard: ACCESS DENIED for GET /students
```
**→ Проблема в RBAC данных!**

## 🛠️ **Решения по типам ошибок:**

### **1. Если проблема в AuthGuard (нет токена):**
```javascript
// В браузере DevTools → Console
localStorage.getItem('token') // Должен быть токен
```

### **2. Если проблема в AuthGuard (невалидный токен):**
```javascript
// Очистить токен и перезайти
localStorage.clear();
// Или обновить токен через /auth/refresh
```

### **3. Если проблема в PermissionGuard (нет разрешений):**
```bash
# Переинициализировать RBAC
cd apps/backend
npm run ts-node scripts/init-rbac.ts
```

### **4. Если проблема в последовательности загрузки разрешений:**
```bash
# Проверить что роль существует в БД
npx prisma studio
# Таблица Role должна содержать ADMIN, TEACHER, STUDENT, etc.
```

## 📈 **Типичные паттерны в логах:**

### **✅ Рабочий сценарий:**
```
🔐 AuthGuard → ✅ Token valid
🛡️ PermissionGuard → ✅ ACCESS GRANTED
Loading permissions → Found role data with N permissions
```

### **❌ Проблема с токеном:**
```
🔐 AuthGuard → ❌ No token / Invalid token
🛡️ PermissionGuard → НЕ ЗАПУСКАЕТСЯ
```

### **❌ Проблема с RBAC:**
```
🔐 AuthGuard → ✅ Token valid  
🛡️ PermissionGuard → 👤 User found
Loading permissions → Total permissions loaded: 0
📋 Permission check → hasPermission: false
❌ ACCESS DENIED
```

## 🎯 **Быстрая диагностика через логи:**

1. **Ищите эмодзи в логах:**
   - ✅ = всё хорошо
   - ❌ = проблема здесь
   - 🔍 = процесс проверки
   - 👤 = информация о пользователе

2. **Проверьте последовательность:**
   - AuthGuard должен быть первым
   - PermissionGuard должен получить user от AuthGuard
   - RbacService должен загрузить разрешения

3. **Обратите внимание на счетчики:**
   - `Total permissions loaded: 0` = проблема с RBAC данными
   - `Total permissions loaded: 168` = всё в порядке

## 🎉 **После исправления логи должны быть:**
```
🔐 AuthGuard: GET /students
✅ AuthGuard: Token valid for user: { id: 1, email: 'admin@school.com', role: 'ADMIN' }
🛡️ PermissionGuard: GET /students  
✅ PermissionGuard: ACCESS GRANTED for GET /students
```

---

*С этим логированием вы точно найдете источник 403 ошибок! 🕵️‍♂️*
