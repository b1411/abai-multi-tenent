# 🛡️ Как PermissionGuard проверяет разрешения - пошаговый алгоритм

## 🔍 **Общий алгоритм работы PermissionGuard:**

### **Шаг 1: Извлечение метаданных декоратора**
```typescript
const requiredPermissions = this.reflector.getAllAndOverride<any[]>(PERMISSIONS_KEY, [
  context.getHandler(),
  context.getClass(),
]);
```

**Что происходит:**
- Ищет декораторы `@RequirePermission('students', 'read')` на методе контроллера
- Если не найдены на методе, ищет на классе контроллера
- Возвращает массив требуемых разрешений

**Пример:**
```typescript
@RequirePermission('students', 'read')
findAll() { ... }
// → requiredPermissions = [{ module: 'students', action: 'read' }]
```

### **Шаг 2: Проверка наличия требований**
```typescript
if (!requiredPermissions || requiredPermissions.length === 0) {
  return true; // Доступ разрешен если нет требований
}
```

**Если нет декораторов** → **доступ открыт**

### **Шаг 3: Извлечение пользователя из запроса**
```typescript
const { user, params, query, body } = context.switchToHttp().getRequest();

if (!user) {
  return false; // Нет пользователя = нет доступа
}
```

**AuthGuard должен был установить user в request**

### **Шаг 4: Цикл проверки каждого разрешения**
```typescript
for (const permission of requiredPermissions) {
  // Для каждого требуемого разрешения
  let hasPermission = false;
  
  if (hasPermission) {
    return true; // Если хотя бы одно разрешение есть - доступ открыт
  }
}

return false; // Если ни одного разрешения нет - доступ закрыт
```

**Логика OR**: достаточно **одного** подходящего разрешения

## 🔄 **Детальный процесс проверки разрешения:**

### **Формирование параметров проверки:**
```typescript
const checkParams = {
  module: permission.module,        // 'students'
  action: permission.action,        // 'read'
  resource: permission.resource,    // может быть undefined
  resourceId: params?.id,           // ID из URL параметров
  ownerId: this.extractOwnerId(user, params, body),
  groupId: this.extractGroupId(user, params, body),
  departmentId: this.extractDepartmentId(user, params, body)
};
```

### **Вызов RbacService.hasPermission():**
```typescript
hasPermission = await this.rbacService.hasPermission(user.id, checkParams);
```

## 🎯 **Что происходит в RbacService.hasPermission():**

### **1. Проверка кэша разрешений:**
```typescript
const cached = await this.getPermissionsFromCache(userId);
if (cached && !this.isCacheExpired(cached)) {
  return this.checkPermissionInCache(cached.permissions, check, userId);
}
```

### **2. Загрузка разрешений пользователя:**
```typescript
const permissions = await this.loadUserPermissions(userId);
```

**Двухэтапная загрузка:**
```typescript
// Этап 1: Ищем назначенные роли (UserRoleAssignment)
const userRoles = await this.prisma.userRoleAssignment.findMany({
  where: { userId, isActive: true },
  include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
});

// Этап 2: Если нет назначений, ищем роль по имени User.role
if (permissions.length === 0 && user.role) {
  const roleData = await this.prisma.role.findUnique({
    where: { name: user.role }, // 'ADMIN', 'TEACHER', etc.
    include: { rolePermissions: { include: { permission: true } } }
  });
}
```

### **3. Проверка конкретного разрешения:**
```typescript
private checkPermissionInData(permissions, check, userId): boolean {
  for (const permission of permissions) {
    if (
      permission.module === check.module &&           // 'students' === 'students'
      permission.action === check.action &&           // 'read' === 'read'
      (!check.resource || permission.resource === check.resource || !permission.resource)
    ) {
      // Проверяем область видимости (scope)
      if (this.checkScope(permission.scope, check, userId, permission.context)) {
        return true;
      }
    }
  }
  return false;
}
```

### **4. Проверка области видимости (Scope):**
```typescript
private checkScope(scope: PermissionScope, check, userId, context): boolean {
  switch (scope) {
    case PermissionScope.ALL:
      return true; // Полный доступ

    case PermissionScope.OWN:
      return check.ownerId === userId; // Только свои ресурсы

    case PermissionScope.GROUP:
      return check.groupId === context?.groupId; // Только своя группа

    case PermissionScope.DEPARTMENT:
      return check.departmentId === context?.departmentId; // Только свой отдел

    case PermissionScope.ASSIGNED:
      return true; // Назначенные ресурсы (пока упрощенно)

    default:
      return false;
  }
}
```

## 📊 **Примеры работы с логами:**

### **Пример 1: Админ запрашивает GET /students**

```
🛡️ PermissionGuard: GET /students
🔍 PermissionGuard: Required permissions: [{ module: 'students', action: 'read' }]
👤 PermissionGuard: User: { id: 1, email: 'admin@school.com', role: 'ADMIN' }
🔍 PermissionGuard: Checking object permission: { module: 'students', action: 'read' }

Loading permissions for user: 1 with role: ADMIN
Found role data: ADMIN with 168 permissions
Total permissions loaded: 168

📋 PermissionGuard: Permission check result: { 
  permission: { module: 'students', action: 'read' }, 
  hasPermission: true, 
  userId: 1 
}
✅ PermissionGuard: ACCESS GRANTED for GET /students
```

**Что происходило:**
1. ✅ Декоратор `@RequirePermission('students', 'read')` найден
2. ✅ Пользователь admin найден в request
3. ✅ RbacService загрузил 168 разрешений для роли ADMIN
4. ✅ Среди них найдено разрешение: `students:read` с scope `ALL`
5. ✅ Scope `ALL` = полный доступ → доступ разрешен

### **Пример 2: Студент запрашивает GET /students**

```
🛡️ PermissionGuard: GET /students
👤 PermissionGuard: User: { id: 2, email: 'student@school.com', role: 'STUDENT' }

Loading permissions for user: 2 with role: STUDENT
No role assignments found, trying to find role by name: STUDENT
Role not found in database: STUDENT
Total permissions loaded: 0

📋 PermissionGuard: Permission check result: { hasPermission: false, userId: 2 }
❌ PermissionGuard: ACCESS DENIED for GET /students
```

**Что происходило:**
1. ✅ Декоратор найден
2. ✅ Пользователь student найден
3. ❌ Роль STUDENT не найдена в таблице Role
4. ❌ Загружено 0 разрешений
5. ❌ Разрешение `students:read` не найдено → доступ запрещен

### **Пример 3: Студент запрашивает GET /students/2 (свою запись)**

```
🛡️ PermissionGuard: GET /students/2
🔍 PermissionGuard: Required permissions: [{ module: 'students', action: 'read', scope: 'OWN' }]
👤 PermissionGuard: User: { id: 2, email: 'student@school.com', role: 'STUDENT' }

Loading permissions for user: 2 with role: STUDENT
Found role data: STUDENT with 25 permissions
Total permissions loaded: 25

📋 PermissionGuard: Permission check result: { hasPermission: true, userId: 2 }
✅ PermissionGuard: ACCESS GRANTED for GET /students/2
```

**Что происходило:**
1. ✅ Декоратор `@RequirePermission('students', 'read', { scope: 'OWN' })` найден
2. ✅ Пользователь найден
3. ✅ Роль STUDENT найдена с 25 разрешениями
4. ✅ Найдено разрешение `students:read` с scope `OWN`
5. ✅ Проверка scope: `ownerId (2) === userId (2)` → доступ разрешен

## 🔑 **Ключевые моменты:**

### **1. Логика OR для разрешений:**
```typescript
// Если есть ЛЮБОЕ из требуемых разрешений - доступ открыт
@RequirePermissions('students:read', 'admin:all')
// Студент с правом students:read ИЛИ админ с admin:all - оба пройдут
```

### **2. Проверка scope:**
- `ALL` - полный доступ ко всем ресурсам
- `OWN` - только к своим ресурсам (ownerId === userId)
- `GROUP` - только к ресурсам своей группы
- `DEPARTMENT` - только к ресурсам своего отдела
- `ASSIGNED` - к назначенным ресурсам

### **3. Fallback на роли:**
```typescript
// Если нет UserRoleAssignment, ищем роль по User.role
if (permissions.length === 0 && user.role) {
  const roleData = await this.prisma.role.findUnique({
    where: { name: user.role }
  });
}
```

### **4. Кэширование:**
- Разрешения кэшируются на 1 час
- При изменении ролей кэш очищается
- Ускоряет повторные проверки

## 🚨 **Возможные проблемы:**

1. **Total permissions loaded: 0** → Роль не найдена в БД
2. **hasPermission: false** → Нет нужного разрешения
3. **Scope не прошел** → Пользователь пытается получить чужие данные
4. **Декоратор не найден** → Забыли добавить `@RequirePermission`

---

**🎯 Теперь понятно как работает PermissionGuard на каждом уровне!**
