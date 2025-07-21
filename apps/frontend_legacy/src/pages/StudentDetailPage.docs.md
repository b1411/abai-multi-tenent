# Документация API для StudentDetailPage (Профиль студента)

## Общее описание
API для системы управления профилем студента в образовательном учреждении. Система обеспечивает комплексный мониторинг успеваемости, посещаемости, финансов и других аспектов обучения студента.

## Модели данных

### Student (Студент)
```typescript
interface Student {
  id: string;              // Уникальный идентификатор
  fullName: string;        // ФИО студента
  class: string;          // Группа
  birthDate: string;      // Дата рождения
  phone: string;          // Телефон
  email: string;          // Email
  address: string;        // Адрес
  iin: string;           // ИИН
  photo: string;         // URL фотографии
  enrollmentDate: string; // Дата зачисления
  nationality: string;    // Национальность
  bloodGroup: string;     // Группа крови
  medicalInfo: string;    // Медицинская информация
}
```

### EmotionalState (Психоэмоциональное состояние)
```typescript
interface EmotionalState {
  category: string;       // Категория оценки
  score: number;         // Балл (0-100)
  description: string;   // Описание
  trend: 'up' | 'down' | 'stable';  // Тренд
  lastUpdate: string;    // Дата обновления
}
```

### GradeData (Данные успеваемости)
```typescript
interface GradeData {
  subject: string;           // Предмет
  currentGrade: number;      // Текущая оценка
  previousGrade: number;     // Предыдущая оценка
  averageGrade: number;      // Средний балл
  trend: 'up' | 'down' | 'stable';  // Тренд
  teacherName: string;       // Преподаватель
  lastUpdate: string;        // Дата обновления
  assignments: Assignment[]; // Задания
}
```

### Attendance (Посещаемость)
```typescript
interface Attendance {
  date: string;
  type: 'presence' | 'absence' | 'late' | 'medical' | 'excused';
  subject?: string;
  time?: string;
  reason?: string;
  status?: string;
  approvedBy?: string;
  duration?: string;
  comment?: string;
}
```

### Payment (Оплата)
```typescript
interface Payment {
  id: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'оплачено' | 'не оплачено' | 'просрочено';
  type: string;
  description: string;
  discount?: number;
  penalty?: number;
  paymentMethod?: string;
}
```

### ExamResult (Результаты экзаменов)
```typescript
interface ExamResult {
  subject: string;
  code: string;
  maxScore: number;
  minScore: number;
  score: number;
  result: 'Сдано' | 'Не сдано';
  examType: string;
  date: string;
  classAverageScore?: number;
  details?: ExamDetails;
}
```

### ExtracurricularActivity (Дополнительное образование)
```typescript
interface ExtracurricularActivity {
  id: string;
  type: 'club' | 'organization' | 'course' | 'olympiad';
  name: string;
  description: string;
  schedule: string;
  teacher: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'planned';
  achievements?: Achievement[];
  skills: string[];
  members?: number;
}
```

## API Endpoints

### 1. Профиль студента

#### 1.1. Получение данных студента
```
GET /api/students/{id}
```
**Ответ:**
```typescript
{
  student: Student;
  emotionalStates: EmotionalState[];
  contacts: Contact[];
}
```

### 2. Успеваемость

#### 2.1. Получение оценок
```
GET /api/students/{id}/grades
```
**Query параметры:**
- `period` (string, опционально) - период
- `subject` (string, опционально) - предмет

**Ответ:**
```typescript
{
  grades: GradeData[];
  summary: {
    averageGrade: number;
    trend: string;
  };
}
```

### 3. Посещаемость

#### 3.1. История посещаемости
```
GET /api/students/{id}/attendance
```
**Query параметры:**
- `startDate` (string) - начальная дата
- `endDate` (string) - конечная дата
- `type` (string, опционально) - тип посещаемости

**Ответ:**
```typescript
{
  attendance: Attendance[];
  statistics: {
    totalPresence: number;
    totalAbsence: number;
    totalLate: number;
  };
}
```

### 4. Финансы

#### 4.1. История платежей
```
GET /api/students/{id}/payments
```
**Ответ:**
```typescript
{
  payments: Payment[];
  summary: {
    totalPaid: number;
    pendingPayments: number;
    totalDiscount: number;
    totalPenalty: number;
  };
}
```

#### 4.2. Создание платежа
```
POST /api/students/{id}/payments
```
**Тело запроса:**
```typescript
{
  type: string;
  amount: number;
  dueDate: string;
  description: string;
  discount?: number;
}
```

### 5. Экзамены

#### 5.1. Результаты экзаменов
```
GET /api/students/{id}/exams
```
**Query параметры:**
- `year` (string) - учебный год
- `quarter` (string, опционально) - четверть
- `examType` (string, опционально) - тип экзамена

**Ответ:**
```typescript
{
  exams: ExamResult[];
  summary: {
    totalExams: number;
    passed: number;
    failed: number;
    averageScore: number;
    ranking: number;
  };
}
```

### 6. Дополнительное образование

#### 6.1. Получение активностей
```
GET /api/students/{id}/extracurricular
```
**Ответ:**
```typescript
{
  activities: ExtracurricularActivity[];
  statistics: {
    totalActivities: number;
    activeActivities: number;
    achievements: number;
  };
}
```

## Права доступа

### Роли пользователей:
1. Администратор:
   - Полный доступ ко всем данным
   - Управление финансами
   - Редактирование всех разделов

2. Преподаватель:
   - Просмотр успеваемости
   - Управление оценками
   - Отметка посещаемости

3. Студент:
   - Просмотр своего профиля
   - Просмотр успеваемости
   - Просмотр расписания

4. Родитель:
   - Просмотр профиля ребенка
   - Просмотр успеваемости
   - Просмотр финансов

## Примеры запросов

### Получение данных профиля
```bash
curl -X GET http://api.example.com/api/students/123 \
  -H "Authorization: Bearer {token}"
```

### Добавление платежа
```bash
curl -X POST http://api.example.com/api/students/123/payments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "monthly_fee",
    "amount": 25000,
    "dueDate": "2024-04-10",
    "description": "Оплата за Апрель"
  }'
```

## Коды ответов
- 200: Успешное выполнение
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Требования к данным
1. Валидация всех входных данных
2. Проверка прав доступа
3. Логирование изменений
4. Сохранение истории изменений
5. Защита персональных данных

## Дополнительные функции
1. Экспорт данных в PDF/Excel
2. Уведомления об изменениях
3. Чат с преподавателями/родителями
4. Аналитика успеваемости
5. Психологический мониторинг

## Интеграции
1. Система управления обучением
2. Система электронного журнала
3. Платежная система
4. Система уведомлений
5. Система психологического мониторинга 