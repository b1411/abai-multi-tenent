# 🚨 Решение проблемы 403 ошибок в RBAC системе

## 🔍 **Диагностика проблемы**

### 1. **Основные причины 403 ошибок:**
- ❌ Не инициализированы RBAC данные
- ❌ Пользователь не имеет назначенных ролей  
- ❌ Роли существуют, но нет разрешений
- ❌ Проблема с JWT токеном
- ❌ Неправильная логика проверки разрешений

## ✅ **Что было исправлено в RbacService:**

### **Улучшена функция loadUserPermissions():**

```typescript
// СТАРАЯ ВЕРСИЯ (проблема):
// Загружала только UserRoleAssignment, игнорируя прямые роли пользователей

// НОВАЯ ВЕРСИЯ (исправлена):
private async loadUserPermissions(userId: number) {
  // 1. Загружаем пользователя с его ролью
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // 2. Сначала проверяем назначенные роли (UserRoleAssignment)
  const userRoles = await this.prisma.userRoleAssignment.findMany({...});

  // 3. ВАЖНО: Если нет назначений, ищем роль по имени
  if (permissions.length === 0 && user.role) {
    const roleData = await this.prisma.role.findUnique({
      where: { name: user.role }, // Ищем по имени роли (ADMIN, TEACHER, etc.)
      include: { rolePermissions: { include: { permission: true } } }
    });

    // Добавляем разрешения из найденной роли
    if (roleData) {
      for (const rolePermission of roleData.rolePermissions) {
        permissions.push({...});
      }
    }
  }

  return permissions;
}
```

### **Добавлено детальное логирование:**
```typescript
console.log('Loading permissions for user:', userId, 'with role:', user.role);
console.log('Found role data:', roleData.name, 'with', roleData.rolePermissions.length, 'permissions');
console.log('Total permissions loaded:', permissions.length);
```

## 🧪 **Пошаговая диагностика:**

### **Шаг 1: Проверить инициализацию RBAC**
```bash
cd apps/backend
npm run ts-node scripts/init-rbac.ts
```

**Что должно быть создано:**
- ✅ Роли: ADMIN, TEACHER, STUDENT, PARENT, HR, FINANCIST
- ✅ Разрешения: 168+ permissions для всех модулей
- ✅ RolePermissions: связи ролей с разрешениями

### **Шаг 2: Проверить пользователя**
```sql
-- Через Prisma Studio или SQL
SELECT id, email, role FROM User WHERE email = 'admin@school.com';
```

**Убедитесь что:**
- ✅ Пользователь существует
- ✅ У него есть роль (ADMIN, TEACHER, etc.)

### **Шаг 3: Проверить JWT токен**

**В браузере (DevTools → Application → Local Storage):**
```javascript
// Должен быть токен
localStorage.getItem('token')

// Декодировать токен (без проверки подписи)
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
```

**JWT должен содержать:**
```json
{
  "id": 1,
  "email": "admin@school.com", 
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Шаг 4: Проверить логи backend**

**Запустите backend с логированием:**
```bash
cd apps/backend
npm run start:dev
```

**В логах должно быть:**
```
Loading permissions for user: 1 with role: ADMIN
Found role data: ADMIN with 168 permissions
Total permissions loaded: 168
```

**Если видите:**
```
No role assignments found, trying to find role by name: ADMIN
Role not found in database: ADMIN
Total permissions loaded: 0
```
→ **Нужно выполнить init-rbac.ts**

### **Шаг 5: Тест конкретного API**

**Через curl/Postman:**
```bash
# 1. Получить токен
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'

# 2. Проверить защищенный эндпоинт
curl -X GET http://localhost:3000/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемые результаты:**
- ✅ 200 - доступ разрешен
- ❌ 401 - проблема с токеном
- ❌ 403 - проблема с разрешениями

## 🛠️ **Быстрое исправление:**

### **Если проблема с разрешениями:**
```bash
# 1. Пересоздать RBAC данные
cd apps/backend
npm run ts-node scripts/init-rbac.ts

# 2. Создать тестового админа
npm run ts-node scripts/create-admin-user.ts

# 3. Перезапустить backend
npm run start:dev
```

### **Если проблема с токеном:**
```javascript
// В браузере очистить все
localStorage.clear();
sessionStorage.clear();
// Перезайти в систему
```

## 🔧 **Дополнительная отладка:**

### **Добавить временный debug в PermissionGuard:**
```typescript
// В apps/backend/src/common/guards/permission.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const { user } = context.switchToHttp().getRequest();
  
  console.log('PermissionGuard - User:', user);
  console.log('PermissionGuard - Required permissions:', requiredPermissions);
  
  // ... остальной код
  
  const hasPermission = await this.rbacService.hasPermission(user.id, checkParams);
  console.log('PermissionGuard - Has permission:', hasPermission);
  
  return hasPermission;
}
```

### **Проверить через RBAC API:**
```bash
# Получить свои разрешения
curl -X GET http://localhost:3000/rbac/my-permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Получить роли
curl -X GET http://localhost:3000/rbac/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 **Алгоритм поиска проблемы:**

```
1. JWT токен валидный? 
   ❌ → Перезайти в систему
   ✅ → Далее

2. Пользователь найден в БД?
   ❌ → Создать пользователя  
   ✅ → Далее

3. У пользователя есть роль?
   ❌ → Назначить роль
   ✅ → Далее

4. Роль существует в таблице Role?
   ❌ → Выполнить init-rbac.ts
   ✅ → Далее

5. У роли есть разрешения?
   ❌ → Выполнить init-rbac.ts
   ✅ → Далее

6. Разрешение соответствует запросу?
   ❌ → Проверить декораторы @RequirePermission
   ✅ → Должно работать!
```

## ✅ **После исправления должно работать:**

- ✅ **Админ**: полный доступ ко всем эндпоинтам
- ✅ **Учитель**: доступ к урокам, студентам, расписанию
- ✅ **Студент**: доступ к своим данным
- ✅ **Навигация**: показывает только доступные разделы
- ✅ **Логи**: корректное логирование попыток доступа

## 🎉 **Результат:**

**После применения исправлений 403 ошибки должны исчезнуть, и RBAC система будет работать корректно с детальным логированием для отладки.**

---

*Руководство по исправлению 403 ошибок в RBAC системе*  
*Время исправления: 5-10 минут ⏱️*  
*Статус: ГОТОВО К ТЕСТИРОВАНИЮ ✅*
