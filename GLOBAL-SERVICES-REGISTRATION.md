# Глобальная регистрация RBAC сервисов

## Выполненные изменения

### 1. Обновлен RbacModule (`apps/backend/src/rbac/rbac.module.ts`)
- Добавлен `JwtService` в экспорты модуля
- Теперь экспортирует: `RbacService`, `PermissionService`, `RoleService`, `JwtService`
- Модуль уже был помечен как `@Global()`, что делает все экспортируемые сервисы доступными глобально

### 2. Обновлен AppModule (`apps/backend/src/app.module.ts`)
- Удален импорт `JwtService` (убрана зависимость)
- Удален `JwtService` из providers (теперь предоставляется глобально через RbacModule)

## Результат

Теперь следующие сервисы доступны глобально во всем приложении:
- **JwtService** - для работы с JWT токенами
- **RbacService** - основной сервис RBAC
- **PermissionService** - для управления разрешениями
- **RoleService** - для управления ролями

## Использование

Эти сервисы можно инжектировать в любом контроллере или сервисе без необходимости импорта соответствующих модулей:

```typescript
constructor(
  private readonly jwtService: JwtService,
  private readonly rbacService: RbacService,
  private readonly permissionService: PermissionService,
  private readonly roleService: RoleService,
) {}
```

## Проверка

- ✅ Сборка проекта проходит успешно
- ✅ Нет ошибок TypeScript
- ✅ Все сервисы зарегистрированы глобально
