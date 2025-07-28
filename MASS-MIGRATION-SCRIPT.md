# 🔄 Массовая миграция контроллеров на RBAC

## ✅ **УЖЕ МИГРИРОВАНЫ:**
1. ✅ StudentsController
2. ✅ UsersController 
3. ✅ TeachersController
4. ✅ LessonsController
5. ✅ HomeworkController
6. ✅ PaymentsController
7. ✅ GroupsController
8. ✅ MaterialsController

## 🔄 **Шаблон для быстрой миграции:**

### **1. Замена импортов:**
```typescript
// ЗАМЕНИТЬ:
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
@UseGuards(AuthGuard, RolesGuard)

// НА:
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
@UseGuards(AuthGuard, PermissionGuard)
```

### **2. Замена декораторов методов:**
```typescript
// CRUD операции:
@Roles('ADMIN', 'TEACHER') → @RequirePermission('MODULE_NAME', 'create')
@Roles('ADMIN', 'TEACHER', 'STUDENT') → @RequirePermission('MODULE_NAME', 'read')
@Roles('ADMIN') → @RequirePermission('MODULE_NAME', 'update')
@Roles('ADMIN') → @RequirePermission('MODULE_NAME', 'delete')

// Специальные случаи:
statistics → @RequirePermission('reports', 'read')
export → @RequirePermission('reports', 'read')
schedule → @RequirePermission('schedule', 'read')
```

### **3. Области видимости:**
```typescript
// Для студентов - только свои данные:
@RequirePermission('MODULE', 'read', { scope: 'OWN' })

// Для родителей - данные детей:
@RequirePermission('MODULE', 'read', { scope: 'ASSIGNED' })

// Для учителей - данные своих групп:
@RequirePermission('MODULE', 'read', { scope: 'GROUP' })

// Для админов - все данные:
@RequirePermission('MODULE', 'read', { scope: 'ALL' })
```

## 🎯 **ПРИОРИТЕТНЫЙ СПИСОК для миграции:**

### **ПРИОРИТЕТ 1 - КРИТИЧНЫЕ (сейчас):**
9. ❌ **ParentsController** 
10. ❌ **ReportsController**
11. ❌ **StudyPlansController**
12. ❌ **NotificationsController**

### **ПРИОРИТЕТ 2 - ВАЖНЫЕ:**
13. ❌ **DashboardController**
14. ❌ **QuizController** 
15. ❌ **LessonResultsController**
16. ❌ **ClassroomsController**

### **ПРИОРИТЕТ 3 - ДОПОЛНИТЕЛЬНЫЕ:**
17. ❌ **FilesController**
18. ❌ **CalendarController**
19. ❌ **ChatController**
20. ❌ **FeedbackController**
21. ❌ **PerformanceController**

## 📋 **Быстрый чек-лист миграции контроллера:**

### **Для каждого контроллера:**
1. [ ] ✅ Добавить импорт PermissionGuard
2. [ ] ✅ Заменить @UseGuards(AuthGuard, RolesGuard) на @UseGuards(AuthGuard, PermissionGuard)
3. [ ] ✅ Заменить все @Roles на @RequirePermission
4. [ ] ✅ Убрать @Roles с класса контроллера
5. [ ] ✅ Проверить области видимости
6. [ ] ✅ Убрать неиспользуемые импорты

### **Примеры замен по модулям:**
```typescript
// Parents:
@RequirePermission('parents', 'create|read|update|delete')

// Reports:
@RequirePermission('reports', 'read')

// Study Plans:
@RequirePermission('study-plans', 'create|read|update|delete')

// Notifications:
@RequirePermission('notifications', 'create|read|update|delete')

// Dashboard:
@RequirePermission('dashboard', 'read')

// Quiz:
@RequirePermission('quiz', 'create|read|update|delete')

// Lesson Results:
@RequirePermission('lesson-results', 'create|read|update|delete')

// Classrooms:
@RequirePermission('classrooms', 'create|read|update|delete')
```

## 🚀 **Статус:**

**Backend: 8/36 = 22% ✅**

**Следующие 4 контроллера = 33% готовности!**

Каждый контроллер занимает ~5-10 минут миграции.
