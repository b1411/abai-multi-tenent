# 📋 Полный план миграции на RBAC систему

## ✅ **УЖЕ МИГРИРОВАНЫ (Backend):**
1. ✅ StudentsController
2. ✅ UsersController 
3. ✅ TeachersController
4. ✅ LessonsController
5. ✅ HomeworkController
6. ✅ PaymentsController

## ❌ **НУЖНО МИГРИРОВАТЬ (Backend) - 30+ контроллеров:**

### 🔥 **ПРИОРИТЕТ 1 - Критические (сейчас):**
7. ❌ **AuthController** - авторизация
8. ❌ **GroupsController** - управление группами
9. ❌ **ScheduleController** - расписание (в папке schedule/)
10. ❌ **ReportsController** - отчеты
11. ❌ **MaterialsController** - учебные материалы
12. ❌ **ParentsController** - родители

### 🔥 **ПРИОРИТЕТ 2 - Важные:**
13. ❌ **NotificationsController** - уведомления
14. ❌ **DashboardController** - главная страница
15. ❌ **QuizController** - тесты и опросы
16. ❌ **LessonResultsController** - результаты уроков
17. ❌ **StudyPlansController** - учебные планы
18. ❌ **ClassroomsController** - аудитории

### 🔥 **ПРИОРИТЕТ 3 - Дополнительные:**
19. ❌ **FilesController** - файлы
20. ❌ **CalendarController** - календарь
21. ❌ **ChatController** - чат
22. ❌ **FeedbackController** - обратная связь
23. ❌ **PerformanceController** - производительность
24. ❌ **BudgetController** - бюджет
25. ❌ **SalariesController** - зарплаты (в папке salaries/)
26. ❌ **InventoryController** - инвентарь
27. ❌ **VacationsController** - отпуска (в папке vacations/)
28. ❌ **WorkloadController** - нагрузка (в папке workload/)
29. ❌ **SystemController** - система (в папке system/)
30. ❌ **TasksController** - задачи (в папке tasks/)
31. ❌ **SupplyController** - поставки (в папке supply/)
32. ❌ **KpiController** - KPI
33. ❌ **LoyaltyController** - лояльность
34. ❌ **ActivityMonitoringController** - мониторинг активности
35. ❌ **AiAssistantController** - AI помощник
36. ❌ **EdoController** - электронный документооборот

---

## ❌ **НУЖНО МИГРИРОВАТЬ (Frontend) - страницы:**

### ✅ **УЖЕ МИГРИРОВАНЫ:**
- ✅ Sidebar (навигация)
- ✅ Students.tsx
- ✅ Teachers.tsx
- ✅ Lessons.tsx
- ✅ RoleManagement.tsx

### 🔥 **ПРИОРИТЕТ 1 - Критические:**
1. ❌ **Homework.tsx** - домашние задания
2. ❌ **Payments.tsx** - платежи
3. ❌ **Groups.tsx** - группы
4. ❌ **Schedule.tsx** - расписание
5. ❌ **Dashboard.tsx** - главная

### 🔥 **ПРИОРИТЕТ 2 - Важные:**
6. ❌ **Materials.tsx** - материалы
7. ❌ **Reports.tsx** - отчеты
8. ❌ **Quiz.tsx** - тесты
9. ❌ **Calendar.tsx** - календарь
10. ❌ **Notifications.tsx** - уведомления

### 🔥 **ПРИОРИТЕТ 3 - Дополнительные:**
11. ❌ **Files.tsx** - файлы
12. ❌ **Chat.tsx** - чат
13. ❌ **Performance.tsx** - производительность
14. ❌ **Budget.tsx** - бюджет
15. ❌ **SystemSettings.tsx** - настройки системы

---

## 🎯 **ПЛАН ДЕЙСТВИЙ:**

### ⚡ **ЭТАП 1: Критические контроллеры (1-2 часа)**
```bash
# Обновляем самые важные:
1. AuthController - базовая авторизация
2. GroupsController - группы студентов  
3. ScheduleController - расписание
4. ReportsController - отчеты
5. MaterialsController - учебные материалы
6. ParentsController - родители
```

### ⚡ **ЭТАП 2: Критические страницы фронтенда (30 минут)**
```bash
# Быстро обновляем:
1. Homework.tsx
2. Payments.tsx  
3. Groups.tsx
4. Schedule.tsx
5. Dashboard.tsx
```

### ⚡ **ЭТАП 3: Остальные контроллеры (2-3 часа)**
```bash
# Массовая миграция всех остальных контроллеров
# Шаблонная замена @Roles на @RequirePermission
```

### ⚡ **ЭТАП 4: Остальные страницы (1 час)**
```bash
# Обновляем оставшиеся страницы фронтенда
```

---

## 📊 **ТЕКУЩИЙ ПРОГРЕСС:**

### Backend: 6/36 = 17% ✅
### Frontend: 5/20 = 25% ✅ 
### **ОБЩИЙ: 20% готов**

---

## 🚀 **НАЧИНАЕМ С ЭТАПА 1:**

**Сейчас обновим 6 критических контроллеров:**
1. AuthController
2. GroupsController  
3. ScheduleController
4. ReportsController
5. MaterialsController
6. ParentsController

**Это даст нам базовую функциональность!**
