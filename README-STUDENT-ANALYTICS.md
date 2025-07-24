# Система аналитики студентов

Этот документ описывает новые функции для анализа посещаемости, финансов и эмоционального состояния студентов.

## 📊 Обзор функций

### 1. Посещаемость студентов
- Автоматическое отслеживание через модель `LessonResult`
- Статистика по предметам и периодам
- Анализ причин отсутствия

### 2. Финансовая информация
- Детальная информация о платежах
- Статистика по типам услуг
- Контроль задолженностей

### 3. Эмоциональный анализ
- Интеграция с системой feedback
- Обязательные формы для студентов и учителей
- Тренды и рекомендации

## 🔐 Контроль доступа

### Посещаемость
- **Доступно всем ролям:** ADMIN, HR, TEACHER, STUDENT, PARENT

### Финансы
- **Ограниченный доступ:** ADMIN, TEACHER, PARENT, FINANCIST
- **Родители:** только для своих детей
- **Учителя:** для всех студентов
- **Админы и финансисты:** для всех студентов

### Эмоциональное состояние
- **Ограниченный доступ:** ADMIN, TEACHER, PARENT
- **Родители:** только для своих детей
- **Учителя:** для всех студентов
- **Админы:** для всех студентов

## 🛠 API Endpoints

### Базовые endpoints студентов
```
GET /students/{id}/attendance
GET /students/{id}/finances
GET /students/{id}/emotional-state
GET /students/{id}/complete-report
```

### Параметры запросов

#### Посещаемость
```
GET /students/{id}/attendance?dateFrom=2025-01-01&dateTo=2025-01-31
```

#### Комплексный отчет
```
GET /students/{id}/complete-report
```
Возвращает:
- Базовую информацию (всегда)
- Посещаемость (всегда)
- Оценки (всегда)
- Финансы (если есть доступ)
- Эмоциональное состояние (если есть доступ)

## 📝 Система feedback для эмоционального анализа

### Шаблоны форм

#### Для студентов: `student_emotional_assessment`
- **Частота:** ежемесячно
- **Приоритет:** обязательная форма
- **Разделы:**
  - Настроение и самочувствие
  - Учебная деятельность
  - Социальные отношения
  - Дополнительные вопросы

#### Для учителей: `teacher_student_observation`
- **Частота:** ежеквартально
- **Приоритет:** обязательная форма
- **Разделы:**
  - Общие наблюдения
  - Социальное взаимодействие
  - Поведенческие наблюдения

### Автоматическая интеграция
Данные из feedback форм автоматически обновляют таблицу `EmotionalState`:
- `mood_today` → `mood`
- `concentration_level` → `concentration`
- `socialization_level` → `socialization`
- `motivation_level` → `motivation`

## 🎯 Примеры использования

### 1. Получение посещаемости студента
```typescript
// Все данные
const attendance = await studentsService.getStudentAttendance(studentId);

// За период
const attendance = await studentsService.getStudentAttendance(
  studentId, 
  '2025-01-01', 
  '2025-01-31'
);
```

### 2. Получение финансов (с проверкой прав)
```typescript
const finances = await studentsService.getStudentFinances(
  studentId,
  currentUserRole,
  currentUserId
);
```

### 3. Получение эмоционального состояния
```typescript
const emotionalState = await studentsService.getStudentEmotionalState(
  studentId,
  currentUserRole,
  currentUserId
);
```

### 4. Комплексный отчет
```typescript
const report = await studentsService.getStudentCompleteReport(
  studentId,
  currentUserRole,
  currentUserId
);

// Проверка доступных секций
if (report.accessLevel.canViewFinances) {
  console.log('Финансы:', report.finances);
}

if (report.accessLevel.canViewEmotionalState) {
  console.log('Эмоциональное состояние:', report.emotionalState);
}
```

## 📊 Структура данных

### Посещаемость
```typescript
{
  summary: {
    totalLessons: number,
    attendedLessons: number,
    missedLessons: number,
    attendanceRate: number
  },
  absenceReasons: { [reason: string]: number },
  subjectAttendance: { [subject: string]: AttendanceStats },
  details: LessonResultDetail[]
}
```

### Финансы
```typescript
{
  student: StudentInfo,
  summary: {
    totalAmount: number,
    paidAmount: number,
    pendingAmount: number,
    overdueAmount: number,
    paymentCount: number
  },
  paymentsByType: { [type: string]: PaymentTypeStats },
  recentPayments: Payment[]
}
```

### Эмоциональное состояние
```typescript
{
  student: StudentInfo,
  currentState: {
    mood: { value: number, description: string, trend: string },
    concentration: { value: number, description: string, trend: string },
    socialization: { value: number, description: string, trend: string },
    motivation: { value: number, description: string, trend: string },
    lastUpdated: Date
  },
  feedbackHistory: FeedbackData[],
  trends: EmotionalTrends,
  recommendations: Recommendation[]
}
```

## 🚀 Развертывание

### 1. Создание шаблонов форм
```bash
npx lerna run db:create-emotional-templates --scope=backend
```

### 2. Проверка существующих endpoints
- Посещаемость уже отслеживается через `LessonResult`
- Финансы доступны через `Payment` модель
- Эмоциональные данные собираются через feedback формы

### 3. Настройка периодических форм
Формы автоматически появляются у пользователей согласно расписанию:
- Студенты: ежемесячно
- Учителя: ежеквартально

## ⚡ Дополнительные возможности

### Анализ трендов
Система автоматически анализирует тренды эмоционального состояния и выдает рекомендации:
- Снижение настроения → рекомендация к психологу
- Низкая концентрация → пересмотр режима
- Проблемы с социализацией → групповые активности

### Уведомления
При критических показателях система может отправлять уведомления:
- Родителям о проблемах ребенка
- Учителям о необходимости внимания к студенту
- Администрации о системных проблемах

### Интеграция с другими модулями
- **KPI:** эмоциональные показатели влияют на общий KPI
- **Loyalty:** связь с отзывами и лояльностью
- **Reports:** включение в общие отчеты

## 📈 Метрики и аналитика

### Ключевые показатели
1. **Посещаемость:** процент посещенных занятий
2. **Финансовая дисциплина:** своевременность платежей
3. **Эмоциональное здоровье:** средние показатели по всем аспектам
4. **Тренды:** динамика изменений

### Агрегированная статистика
- По группам
- По преподавателям  
- По предметам
- По периодам

## 🔧 Техническая информация

### Использованные модели Prisma
- `Student` - основная информация
- `LessonResult` - данные посещаемости
- `Payment` - финансовая информация
- `EmotionalState` - эмоциональное состояние
- `FeedbackTemplate` - шаблоны форм
- `FeedbackResponse` - ответы на формы

### Новые методы сервиса
- `getStudentAttendance()`
- `getStudentFinances()`
- `getStudentEmotionalState()`
- `getStudentCompleteReport()`

### Безопасность
- Роле-базированный контроль доступа
- Проверка родительских связей
- Логирование всех обращений к чувствительным данным
