# Система расчета зарплат преподавателей

## Обзор

Реализована комплексная система автоматического расчета зарплат преподавателей на основе отработанных часов, учитывающая замещения и гибкие ставки.

## Основные компоненты

### 1. Модели базы данных

#### TeacherSalaryRate - Ставки преподавателей
```prisma
model TeacherSalaryRate {
  id         Int      @id @default(autoincrement())
  teacherId  Int
  teacher    Teacher  @relation(fields: [teacherId], references: [id])
  baseRate   Int      // базовая ставка в тенге за час
  factors    Json     // [{name: "За опыт", amount: 2000}]
  totalRate  Int      // итоговая почасовая ставка
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?
}
```

#### TeacherWorkedHours - Отработанные часы
```prisma
model TeacherWorkedHours {
  id              Int      @id @default(autoincrement())
  teacherId       Int
  teacher         Teacher  @relation(fields: [teacherId], references: [id])
  month           Int      // 1-12
  year            Int
  scheduledHours  Int      // запланированные часы из расписания
  workedHours     Int      // фактически отработанные часы (с учетом замещений)
  substitutedHours Int     @default(0) // часы замещения других
  substitutedByOthers Int  @default(0) // часы, замещенные другими
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 2. API Эндпоинты

#### Управление ставками преподавателей
```
POST   /teachers/:id/salary-rate         - Создать/обновить ставку
GET    /teachers/:id/salary-rate         - Получить текущую ставку
GET    /teachers/:id/salary-rate/history - История изменения ставок
PATCH  /teachers/salary-rate/:rateId     - Редактировать ставку
```

#### Отработанные часы
```
GET    /teachers/:id/worked-hours/:year/:month - Часы за месяц
GET    /teachers/:id/worked-hours/:year        - Часы за год
GET    /teachers/:id/worked-hours-stats/:year  - Статистика по часам
POST   /teachers/:id/calculate-worked-hours/:year/:month - Пересчет часов
```

#### Расчет зарплат
```
POST   /payroll/recalculate               - Пересчет зарплат (основная кнопка)
GET    /payroll/summary/:year/:month      - Сводка по зарплатам
POST   /payroll/recalculate-worked-hours/:year/:month - Пересчет часов всех
GET    /payroll/worked-hours/:year/:month - Часы всех преподавателей
GET    /payroll/details/:teacherId/:year/:month - Детали зарплаты
```

#### Система замещений
```
POST   /substitutions                     - Назначить замещение
DELETE /substitutions/:scheduleId         - Убрать замещение
GET    /substitutions/available-teachers  - Доступные замещающие
GET    /substitutions/check-availability/:teacherId - Проверить доступность
GET    /substitutions                     - Список замещений
GET    /substitutions/stats               - Статистика замещений
```

### 3. Бизнес-логика

#### Расчет ставки
1. **Базовая ставка** - основная почасовая ставка
2. **Факторы** - дополнительные надбавки:
   - За опыт: 2000 тенге/час
   - За опыт в академии: 3000 тенге/час
   - Любые другие факторы с произвольными названиями
3. **Итоговая ставка** = Базовая + сумма всех факторов

#### Расчет отработанных часов
1. Берутся все записи из Schedule за указанный месяц
2. Учитываются только завершенные занятия (status: 'COMPLETED')
3. Для каждого преподавателя рассчитывается:
   - **scheduledHours** - запланированные часы (teacherId = преподаватель)
   - **workedHours** - фактически отработанные часы
   - **substitutedHours** - часы замещения других (substituteId = преподаватель)
   - **substitutedByOthers** - часы, замещенные другими (substituteId != null)

#### Расчет зарплаты
**Базовая зарплата** = workedHours × totalRate
**Итоговая зарплата** = Базовая + бонусы - удержания

#### Система замещений
1. При назначении замещения:
   - Проверяется доступность замещающего преподавателя
   - Schedule.substituteId устанавливается на замещающего
   - Schedule.type меняется на 'SUBSTITUTE'
2. При расчете часов:
   - Часы переходят от замещаемого к замещающему
   - Отслеживается статистика замещений

### 4. Пример использования

#### Создание ставки преподавателя
```json
POST /teachers/1/salary-rate
{
  "baseRate": 1500,
  "factors": [
    {"name": "За опыт", "amount": 2000},
    {"name": "За опыт в академии", "amount": 3000},
    {"name": "За категорию", "amount": 1000}
  ]
}
```

#### Назначение замещения
```json
POST /substitutions
{
  "scheduleId": "uuid-schedule-id",
  "substituteTeacherId": 2,
  "reason": "Болезнь основного преподавателя"
}
```

#### Пересчет зарплат
```json
POST /payroll/recalculate
{
  "month": 12,
  "year": 2024
}
```

### 5. Workflow расчета зарплат

1. **Настройка ставок** - для каждого преподавателя устанавливается ставка
2. **Ведение расписания** - занятия проводятся согласно расписанию
3. **Управление замещениями** - при необходимости назначаются замещающие
4. **Пересчет часов** - система автоматически рассчитывает отработанные часы
5. **Пересчет зарплат** - на основе часов и ставок рассчитывается зарплата
6. **Редактирование** - добавляются надбавки/удержания для конкретных выплат
7. **Подтверждение** - финансист/админ подтверждает выплату

### 6. Права доступа

- **ADMIN, HR** - полный доступ ко всем функциям
- **FINANCIST** - доступ к расчетам и подтверждению выплат
- **TEACHER** - просмотр своих данных, назначение замещений для своих занятий

### 7. Особенности реализации

1. **Автоматический пересчет** - при изменении расписания или ставок
2. **Версионность ставок** - история изменений ставок преподавателей
3. **Гибкие факторы** - возможность добавления любых надбавок к ставке
4. **Учет замещений** - корректный перенос часов между преподавателями
5. **Адаптивность** - система работает с существующими данными
6. **Безопасность** - все операции логируются и требуют подтверждения

### 8. Система уведомлений

Автоматические уведомления для всех участников процесса:

#### Уведомления преподавателям:
- ✅ Зарплата рассчитана
- ✅ Зарплата утверждена
- ✅ Зарплата выплачена
- ✅ Зарплата отклонена (с указанием причины)
- ✅ Назначено замещение

#### Уведомления финансистам/админам:
- ✅ Новые зарплаты ожидают подтверждения
- ✅ Массовый расчет завершен
- ✅ Просроченные подтверждения (более 7 дней)

### 9. Workflow подтверждения выплат

#### Новые API эндпоинты для workflow:
```
GET    /salaries/pending-approvals    - Зарплаты на подтверждение
GET    /salaries/approved             - Подтвержденные зарплаты
GET    /salaries/:id/workflow         - Детали workflow конкретной зарплаты
PATCH  /salaries/:id/adjustments      - Редактировать надбавки/удержания
POST   /salaries/:id/reject           - Отклонить зарплату
```

#### Процесс подтверждения:
1. **DRAFT** → **APPROVED** → **PAID**
2. Возможность отклонения с указанием причины
3. Редактирование надбавок и удержаний до подтверждения
4. Автоматические уведомления на каждом этапе

### 10. Дополнительные возможности

#### Редактирование надбавок и удержаний
```json
PATCH /salaries/123/adjustments
{
  "bonuses": [
    {"name": "Премия за качество", "amount": 50000, "comment": "За отличную работу"}
  ],
  "deductions": [
    {"name": "Аванс", "amount": 100000, "comment": "Выдан 15 числа"}
  ],
  "comment": "Скорректировано финансистом"
}
```

#### Система уведомлений
- Интеграция с существующей системой уведомлений
- Настройки уведомлений для каждого пользователя
- Автоматические напоминания о просроченных подтверждениях

## Статус реализации

✅ Модели базы данных
✅ Сервисы для работы со ставками
✅ Сервисы для расчета отработанных часов
✅ Сервисы для расчета зарплат
✅ Система замещений
✅ API эндпоинты
✅ Интеграция с существующей системой зарплат
✅ Система подтверждений выплат (workflow)
✅ Редактирование надбавок и удержаний
✅ Система уведомлений
🔄 Frontend интерфейсы (требуется реализация)

## Полный список API эндпоинтов

### Управление ставками
```
POST   /teachers/:id/salary-rate         - Создать/обновить ставку
GET    /teachers/:id/salary-rate         - Получить текущую ставку
GET    /teachers/:id/salary-rate/history - История изменения ставок
PATCH  /teachers/salary-rate/:rateId     - Редактировать ставку
```

### Отработанные часы
```
GET    /teachers/:id/worked-hours/:year/:month      - Часы за месяц
GET    /teachers/:id/worked-hours/:year             - Часы за год
GET    /teachers/:id/worked-hours-stats/:year       - Статистика по часам
POST   /teachers/:id/calculate-worked-hours/:year/:month - Пересчет часов
```

### Расчет зарплат
```
POST   /payroll/recalculate                         - Пересчет зарплат (главная кнопка)
GET    /payroll/summary/:year/:month                - Сводка по зарплатам
POST   /payroll/recalculate-worked-hours/:year/:month - Пересчет часов всех
GET    /payroll/worked-hours/:year/:month           - Часы всех преподавателей
GET    /payroll/details/:teacherId/:year/:month     - Детали зарплаты
```

### Система замещений
```
POST   /substitutions                               - Назначить замещение
DELETE /substitutions/:scheduleId                   - Убрать замещение
GET    /substitutions/available-teachers            - Доступные замещающие
GET    /substitutions/check-availability/:teacherId - Проверить доступность
GET    /substitutions                               - Список замещений
GET    /substitutions/stats                         - Статистика замещений
```

### Workflow зарплат
```
GET    /salaries/pending-approvals                  - Зарплаты на подтверждение
GET    /salaries/approved                           - Подтвержденные зарплаты
GET    /salaries/:id/workflow                       - Детали workflow
PATCH  /salaries/:id/adjustments                    - Редактировать надбавки/удержания
POST   /salaries/:id/approve                        - Подтвердить зарплату
POST   /salaries/:id/reject                         - Отклонить зарплату
POST   /salaries/:id/mark-paid                      - Отметить как выплаченную
```

## Готовность к использованию

Система полностью готова к использованию! Все backend компоненты реализованы и протестированы. Требуется только создание frontend интерфейсов для удобного управления.
