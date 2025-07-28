# RBAC Implementation - Гибкая система управления ролями и разрешениями

## Обзор

Реализована продвинутая RBAC (Role-Based Access Control) система, которая заменяет простую проверку ролей на гибкую систему разрешений с поддержкой:

- **Динамические роли**: Создание и управление ролями через админ-панель
- **Гранулярные разрешения**: Контроль доступа на уровне модуль + действие + ресурс
- **Области видимости**: Контроль того, какие данные пользователь может видеть/редактировать
- **Контекстные роли**: Роли с привязкой к группам, отделам и т.д.
- **Временные роли**: Роли с истечением срока действия
- **Кэширование**: Производительная система с кэшем разрешений
- **Аудит**: Полное логирование всех проверок доступа

## Архитектура

### Модели базы данных

```prisma
enum PermissionScope {
  ALL        // Все записи
  OWN        // Только свои записи
  GROUP      // Записи своей группы
  DEPARTMENT // Записи своего отдела
  ASSIGNED   // Назначенные записи
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  isActive    Boolean  @default(true)
  
  userRoles       UserRoleAssignment[]
  rolePermissions RolePermission[]
}

model Permission {
  id          String   @id @default(uuid())
  module      String   // students, teachers, lessons, etc.
  action      String   // create, read, update, delete
  resource    String?  // конкретный ресурс (опционально)
  scope       PermissionScope @default(ALL)
  description String?
  isSystem    Boolean  @default(false)
  
  rolePermissions RolePermission[]
}

model UserRoleAssignment {
  id         String    @id @default(uuid())
  userId     Int
  roleId     String
  assignedBy Int?      // Кто назначил роль
  assignedAt DateTime  @default(now())
  expiresAt  DateTime? // Срок действия роли
  isActive   Boolean   @default(true)
  context    Json?     // Контекст роли (группа, отдел)
}
```

### Области видимости (Scopes)

- **ALL**: Доступ ко всем записям без ограничений
- **OWN**: Доступ только к записям, созданным пользователем
- **GROUP**: Доступ к записям в рамках группы пользователя
- **DEPARTMENT**: Доступ к записям в рамках отдела пользователя
- **ASSIGNED**: Доступ к записям, назначенным пользователю

## API Endpoints

### Роли

```typescript
GET    /rbac/roles                     // Получить все роли
GET    /rbac/roles/:id                 // Получить роль по ID
POST   /rbac/roles                     // Создать роль
PUT    /rbac/roles/:id                 // Обновить роль
DELETE /rbac/roles/:id                 // Удалить роль
PUT    /rbac/roles/:id/toggle-status   // Активировать/деактивировать роль
GET    /rbac/roles/:id/users           // Пользователи с ролью

// Управление разрешениями роли
POST   /rbac/roles/:roleId/permissions/:permissionId
DELETE /rbac/roles/:roleId/permissions/:permissionId
```

### Разрешения

```typescript
GET    /rbac/permissions                    // Все разрешения
GET    /rbac/permissions/by-module          // Разрешения по модулям
GET    /rbac/permissions/:id               // Разрешение по ID
POST   /rbac/permissions                   // Создать разрешение
PUT    /rbac/permissions/:id               // Обновить разрешение
DELETE /rbac/permissions/:id               // Удалить разрешение
POST   /rbac/permissions/create-standard/:module // Создать стандартные разрешения

// Метаданные
GET    /rbac/meta/modules                  // Доступные модули
GET    /rbac/meta/actions                  // Доступные действия
GET    /rbac/meta/scopes                   // Области видимости
```

### Назначение ролей

```typescript
POST   /rbac/users/:userId/roles/:roleId   // Назначить роль
DELETE /rbac/users/:userId/roles/:roleId   // Отозвать роль
GET    /rbac/users/:userId/roles           // Роли пользователя
DELETE /rbac/users/:userId/permissions-cache // Очистить кэш
```

### Проверка разрешений

```typescript
POST   /rbac/check-permission              // Проверить разрешение
GET    /rbac/my-permissions                // Мои разрешения
```

## Использование в коде

### 1. Новые Guard'ы и декораторы

```typescript
import { RequirePermission, RequirePermissions, PermissionGuard } from './common/guards/permission.guard';

@Controller('students')
@UseGuards(AuthGuard, PermissionGuard)
export class StudentsController {

  // Простая проверка разрешения
  @Get()
  @RequirePermission('students', 'read')
  async getStudents() {
    // Пользователь должен иметь разрешение "students:read"
  }

  // Проверка с областью видимости
  @Get(':id')
  @RequirePermission('students', 'read', { scope: 'OWN' })
  async getStudent(@Param('id') id: string) {
    // Пользователь может видеть только своих студентов
  }

  // Множественные разрешения (любое из них)
  @Post()
  @RequirePermissions('students:create', 'admin:all')
  async createStudent() {
    // Нужно разрешение на создание студентов ИЛИ админские права
  }
}
```

### 2. Программная проверка разрешений

```typescript
@Injectable()
export class StudentsService {
  constructor(private rbacService: RbacService) {}

  async getStudents(userId: number, groupId?: number) {
    // Проверяем разрешение программно
    const canViewAll = await this.rbacService.hasPermission(userId, {
      module: 'students',
      action: 'read',
      scope: PermissionScope.ALL
    });

    if (canViewAll) {
      return this.getAllStudents();
    }

    // Проверяем разрешение на группу
    const canViewGroup = await this.rbacService.hasPermission(userId, {
      module: 'students',
      action: 'read',
      scope: PermissionScope.GROUP,
      groupId
    });

    if (canViewGroup) {
      return this.getStudentsByGroup(groupId);
    }

    // Только свои записи
    return this.getStudentsByOwner(userId);
  }

  async updateStudent(userId: number, studentId: string, data: any) {
    // Требуем разрешение на обновление
    await this.rbacService.requirePermission(userId, 'students', 'update', {
      resourceId: studentId,
      ownerId: await this.getStudentOwnerId(studentId)
    });

    return this.doUpdate(studentId, data);
  }
}
```

### 3. Создание ролей и разрешений

```typescript
// Создание стандартных разрешений для модуля
await permissionService.createStandardPermissions('lessons');

// Создание роли с разрешениями
const teacherRole = await roleService.createRole({
  name: 'Учитель математики',
  description: 'Преподаватель с доступом к урокам математики',
  permissions: [
    'lessons:read:ALL',
    'lessons:create:GROUP',
    'lessons:update:OWN',
    'students:read:GROUP'
  ]
});

// Назначение роли с контекстом
await rbacService.assignRole(
  teacherId, 
  teacherRole.id,
  adminId,
  { groupId: 5, subject: 'mathematics' }, // Контекст роли
  new Date('2025-12-31') // Срок действия
);
```

## Миграция с существующей системы

### 1. Создание базовых разрешений

```typescript
// Скрипт миграции
const modules = ['students', 'teachers', 'lessons', 'homework', 'schedule'];

for (const module of modules) {
  await permissionService.createStandardPermissions(module);
}
```

### 2. Создание ролей на основе UserRole enum

```typescript
const roleMapping = {
  ADMIN: {
    name: 'Администратор',
    permissions: ['*:*:ALL'] // Все разрешения
  },
  TEACHER: {
    name: 'Учитель',
    permissions: [
      'lessons:*:GROUP',
      'students:read:GROUP',
      'homework:*:OWN',
      'schedule:read:ALL'
    ]
  },
  STUDENT: {
    name: 'Студент',
    permissions: [
      'lessons:read:GROUP',
      'homework:read:OWN',
      'homework:create:OWN',
      'schedule:read:GROUP'
    ]
  }
};
```

### 3. Назначение ролей существующим пользователям

```typescript
const users = await prisma.user.findMany();

for (const user of users) {
  const roleName = roleMapping[user.role]?.name;
  if (roleName) {
    const role = await roleService.findByName(roleName);
    await rbacService.assignRole(user.id, role.id, 1); // Назначено системой
  }
}
```

## Примеры использования

### Студент видит только свои данные

```typescript
@Get('my-grades')
@RequirePermission('grades', 'read', { scope: 'OWN' })
async getMyGrades(@Request() req) {
  // Студент видит только свои оценки
  return this.gradesService.getGradesByStudent(req.user.id);
}
```

### Учитель видит только свою группу

```typescript
@Get('group-students')
@RequirePermission('students', 'read', { scope: 'GROUP' })
async getGroupStudents(@Request() req) {
  // Учитель видит студентов только своих групп
  const teacherGroups = await this.getTeacherGroups(req.user.id);
  return this.studentsService.getStudentsByGroups(teacherGroups);
}
```

### Условный доступ с проверкой владельца

```typescript
@Put('homework/:id')
@RequirePermission('homework', 'update', { scope: 'OWN' })
async updateHomework(@Param('id') id: string, @Request() req) {
  // Автоматически проверяется, что пользователь - владелец домашки
  const homework = await this.homeworkService.findById(id);
  
  // PermissionGuard автоматически извлечет ownerId и проверит доступ
  return this.homeworkService.update(id, data);
}
```

## Производительность

- **Кэширование разрешений**: Разрешения кэшируются на 1 час
- **Индексы БД**: Оптимизированные индексы для быстрых запросов
- **Ленивая загрузка**: Разрешения загружаются только при необходимости
- **Батчевые операции**: Поддержка массовых операций с ролями

## Мониторинг и аудит

- **Логирование доступа**: Все проверки разрешений логируются
- **Аудит изменений**: История назначения/отзыва ролей
- **Метрики производительности**: Время проверки разрешений
- **Отчеты по безопасности**: Анализ попыток несанкционированного доступа

## Будущие улучшения

1. **Поддержка иерархических ролей**: Наследование разрешений
2. **Динамические разрешения**: Разрешения на основе времени/условий
3. **Интеграция с внешними системами**: LDAP, Active Directory
4. **UI для управления**: Графический интерфейс для администраторов
5. **API Gateway интеграция**: Проверка разрешений на уровне API Gateway

## Безопасность

- **Принцип минимальных привилегий**: По умолчанию запрещено всё
- **Защита от эскалации привилегий**: Нельзя назначить роль выше своей
- **Аудит безопасности**: Логирование всех операций с разрешениями
- **Временные роли**: Автоматическое истечение временных доступов
