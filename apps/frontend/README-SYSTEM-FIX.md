# Исправление проблемы множественных перерендеров в системном модуле

## 🐛 Проблема

Страница пользователей (`Users.tsx`) испытывала множественные перерендеры из-за неправильной оптимизации React хуков.

## 🔍 Причины

1. **В хуке `useUsers`**: Функция `fetchUsers` создавалась заново на каждом рендере
2. **В компоненте `Users.tsx`**: `useEffect` зависел от `refetch`, создавая бесконечный цикл перерендеров

## ✅ Решение

### 1. Оптимизация хука `useUsers`

**Было:**
```typescript
const fetchUsers = async (params?: { search?: string; role?: string; status?: string }) => {
  // функция создавалась заново на каждом рендере
};
```

**Стало:**
```typescript
const fetchUsers = useCallback(async (params?: { search?: string; role?: string; status?: string }) => {
  // функция мемоизирована с useCallback
}, []);
```

### 2. Исправление зависимостей useEffect

**Было:**
```typescript
React.useEffect(() => {
  refetch({ search: searchQuery, role: roleFilter, status: statusFilter });
}, [searchQuery, roleFilter, statusFilter, refetch]); // refetch меняется на каждом рендере
```

**Стало:**
```typescript
React.useEffect(() => {
  refetch({ search: searchQuery, role: roleFilter, status: statusFilter });
}, [searchQuery, roleFilter, statusFilter]); // убрали refetch из зависимостей
```

### 3. Добавление импорта

Добавлен импорт `useCallback`:
```typescript
import { useState, useEffect, useCallback } from 'react';
```

## 🎯 Результат

- ✅ Исчезли множественные перерендеры
- ✅ Улучшилась производительность страницы
- ✅ Уменьшилось количество API запросов
- ✅ Более стабильная работа фильтров и поиска

## 📚 Что изучили

1. **useCallback** - мемоизация функций для предотвращения их пересоздания
2. **useEffect dependencies** - важность правильного управления зависимостями
3. **React optimization** - как избежать бесконечных циклов рендеринга

## 🔧 Применимо к другим хукам

Этот же паттерн можно применить к другим хукам в системном модуле:
- `useSystemSettings`
- `useRoles` 
- `useBranding`
- `useIntegrations`

## ⚠️ Важно помнить

- Всегда мемоизируйте функции в хуках с `useCallback`
- Внимательно следите за зависимостями в `useEffect`
- Избегайте включения функций в массив зависимостей, если они могут меняться
- Используйте React DevTools для отслеживания перерендеров
