# Документация API для AcademicJournalPage (Академический журнал)

## Общее описание
API для системы управления академическим журналом в образовательном учреждении. Система обеспечивает учет успеваемости, посещаемости, выставление оценок и формирование отчетности по успеваемости учащихся.

## Модели данных

### JournalEntry (Запись в журнале)
```typescript
interface JournalEntry {
  id: string;               // Уникальный идентификатор
  studentId: string;        // ID студента
  studentName: string;      // ФИО студента
  grades: Array<{
    id: string;            // ID оценки
    lessonId: string;      // ID урока
    value: number;         // Значение оценки (0-100)
    type: 'regular' | 'exam' | 'homework';  // Тип оценки
    date: string;          // Дата выставления
    comment?: string;      // Комментарий
  }>;
  attendance: Array<{
    id: string;           // ID записи посещаемости
    lessonId: string;     // ID урока
    date: string;         // Дата
    status: 'present' | 'absent' | 'late';  // Статус присутствия
    reason?: string;      // Причина отсутствия
  }>;
  averageGrade: number;    // Средний балл
  attendancePercentage: number;  // Процент посещаемости
}

interface Lesson {
  id: string;             // ID урока
  date: string;           // Дата проведения
  topic: string;          // Тема урока
  type: 'lecture' | 'practice' | 'exam';  // Тип занятия
  homework?: string;      // Домашнее задание
}

interface Statistics {
  classAverageGrade: number;  // Средний балл по классу
  attendanceRate: number;     // Общий процент посещаемости
  gradeDistribution: {        // Распределение оценок
    excellent: number;        // Отлично (85-100)
    good: number;            // Хорошо (70-84)
    satisfactory: number;    // Удовлетворительно (50-69)
    unsatisfactory: number;  // Неудовлетворительно (0-49)
  };
  topStudents: Array<{       // Лучшие студенты
    studentId: string;
    studentName: string;
    averageGrade: number;
  }>;
}
```

## API Endpoints

### 1. Управление журналом

#### 1.1. Получение данных журнала
```
GET /api/v1/academic-journal
```
**Query параметры:**
- `classId` (string) - ID класса
- `subjectId` (string) - ID предмета
- `startDate` (string, опционально) - начальная дата (YYYY-MM-DD)
- `endDate` (string, опционально) - конечная дата (YYYY-MM-DD)
- `page` (number, опционально) - номер страницы
- `limit` (number, опционально) - количество записей на странице

**Ответ:**
```typescript
{
  entries: JournalEntry[];
  total: number;
  currentPage: number;
  totalPages: number;
  summary: {
    averageGrade: number;
    attendanceRate: number;
  };
}
```

#### 1.2. Получение списка студентов
```
GET /api/v1/academic-journal/students
```
**Query параметры:**
- `classId` (string) - ID класса
- `subjectId` (string) - ID предмета

**Ответ:**
```typescript
{
  students: Array<{
    id: string;
    name: string;
    averageGrade?: number;
    attendanceRate?: number;
  }>;
}
```

#### 1.3. Добавление/обновление оценок
```
POST /api/v1/academic-journal/grades
```
**Тело запроса:**
```typescript
{
  studentId: string;
  lessonId: string;
  grade: number | null;  // null для отметки отсутствия
  type: 'regular' | 'exam' | 'homework';
  comment?: string;
}
```

#### 1.4. Отметка посещаемости
```
POST /api/v1/academic-journal/attendance
```
**Тело запроса:**
```typescript
{
  studentId: string;
  lessonId: string;
  status: 'present' | 'absent' | 'late';
  reason?: string;
}
```

### 2. Аналитика и статистика

#### 2.1. Получение статистики успеваемости
```
GET /api/v1/academic-journal/statistics
```
**Query параметры:**
- `classId` (string) - ID класса
- `subjectId` (string) - ID предмета
- `period` ('quarter' | 'year') - период

**Ответ:**
```typescript
{
  statistics: Statistics;
  trends: Array<{
    period: string;
    averageGrade: number;
    attendanceRate: number;
  }>;
}
```

## Коды ответов
- 200: Успешное выполнение
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Добавление оценки
```bash
curl -X POST http://api.example.com/api/v1/academic-journal/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "studentId": "123",
    "lessonId": "456",
    "grade": 85,
    "type": "regular",
    "comment": "Отличная работа на уроке"
  }'
```

### Отметка посещаемости
```bash
curl -X POST http://api.example.com/api/v1/academic-journal/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "studentId": "123",
    "lessonId": "456",
    "status": "absent",
    "reason": "Болезнь"
  }'
```

## Примечания по безопасности
1. Доступ только для учителей и администраторов
2. Запрет на изменение оценок задним числом (более 3 дней)
3. Логирование всех изменений оценок
4. Защита от массового изменения данных
5. Двухфакторная аутентификация для критических операций

## Требования к кэшированию
1. Кэширование списка студентов на 1 час
2. Кэширование статистики на 30 минут

## Дополнительные требования
1. Автоматический расчет итоговых оценок
2. Экспорт журнала в Excel
3. Уведомления родителям об оценках и пропусках
4. История изменений оценок
5. Комментарии к оценкам
6. Поддержка различных систем оценивания (100-балльная)

## Интеграции
1. Система управления классами
2. Система расписания
3. Система уведомлений для родителей
4. Система экспорта данных
5. Система аналитики и отчетности
6. Система управления пользователями 