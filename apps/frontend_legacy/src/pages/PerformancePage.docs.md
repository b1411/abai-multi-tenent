# Документация API для PerformancePage (Анализ успеваемости)

## Общее описание
API для системы анализа успеваемости в образовательном учреждении. Система обеспечивает мониторинг и визуализацию показателей успеваемости, посещаемости и прогресса учащихся по различным предметам и группам.

## Модели данных

### Subject (Предмет)
```typescript
interface Subject {
  name: string;           // Название предмета
  grade: number;          // Средний балл
  attendance: number;     // Посещаемость (%)
  assignments: number;    // Выполнение заданий (%)
  participation: number;  // Активность на занятиях (%)
}
```

### Student (Студент)
```typescript
interface Student {
  name: string;          // ФИО студента
  grade: number;         // Средний балл
  trend?: number;        // Тренд успеваемости
}
```

### ClassData (Данные по группе)
```typescript
interface ClassData {
  id: string;            // Идентификатор группы
  name: string;          // Название группы
  averageGrade: number;  // Средний балл
  attendance: number;    // Посещаемость (%)
  assignments: number;   // Выполнение заданий (%)
  studentsCount: number; // Количество студентов
}
```

## API Endpoints

### 1. Получение данных успеваемости

#### 1.1. Общая статистика
```
GET /api/performance/statistics
```
**Query параметры:**
- `classId` (string, опционально) - ID группы
- `period` (string, опционально) - период анализа
- `subjectId` (string, опционально) - ID предмета

**Ответ:**
```typescript
{
  overview: {
    averageGrade: number;
    performanceRate: number;
    attendanceRate: number;
    assignmentCompletionRate: number;
    trends: {
      grade: number;
      performance: number;
      attendance: number;
      assignments: number;
    };
  };
}
```

#### 1.2. Статистика по предметам
```
GET /api/performance/subjects
```
**Query параметры:**
- `classId` (string, опционально)
- `period` (string, опционально)

**Ответ:**
```typescript
{
  subjects: Subject[];
  summary: {
    bestPerforming: string[];
    needsImprovement: string[];
  };
}
```

#### 1.3. Анализ успеваемости по группам
```
GET /api/performance/classes
```
**Ответ:**
```typescript
{
  classes: ClassData[];
  statistics: {
    averagePerformance: number;
    topClasses: string[];
    totalStudents: number;
  };
}
```

### 2. Анализ студентов

#### 2.1. Студенты с низкой успеваемостью
```
GET /api/performance/students/low-performing
```
**Query параметры:**
- `classId` (string, опционально)
- `threshold` (number, опционально) - пороговый балл

**Ответ:**
```typescript
{
  students: Array<{
    student: Student;
    subjects: Array<{
      name: string;
      grade: number;
      recommendations: string[];
    }>;
  }>;
}
```

#### 2.2. Студенты с высоким прогрессом
```
GET /api/performance/students/high-progress
```
**Query параметры:**
- `classId` (string, опционально)
- `period` (string, опционально)

**Ответ:**
```typescript
{
  students: Array<{
    student: Student;
    improvements: Array<{
      subject: string;
      improvement: number;
    }>;
  }>;
}
```

### 3. Аналитика и отчеты

#### 3.1. Динамика успеваемости
```
GET /api/performance/trends
```
**Query параметры:**
- `classId` (string, опционально)
- `period` (string, опционально)
- `metric` ('grade' | 'attendance' | 'assignments')

**Ответ:**
```typescript
{
  trends: Array<{
    period: string;
    value: number;
    change: number;
  }>;
  analysis: {
    trend: 'positive' | 'negative' | 'stable';
    factors: string[];
  };
}
```

## Коды ответов
- 200: Успешное выполнение
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Нет прав доступа
- 404: Ресурс не найден
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Получение статистики по группе
```bash
curl -X GET http://api.example.com/api/performance/statistics \
  -H "Authorization: Bearer {token}" \
  -d '{
    "classId": "10a",
    "period": "current_semester"
  }'
```

### Получение списка отстающих студентов
```bash
curl -X GET http://api.example.com/api/performance/students/low-performing \
  -H "Authorization: Bearer {token}" \
  -d '{
    "classId": "10a",
    "threshold": 3.0
  }'
```

## Примечания по безопасности
1. Права доступа:
   - Просмотр общей статистики: все преподаватели
   - Детальный анализ: кураторы групп, администрация
   - Доступ к личным данным: только авторизованные пользователи
2. Логирование доступа к данным
3. Защита персональных данных
4. Валидация параметров запросов
5. Ограничение частоты запросов

## Требования к данным
1. Актуальность данных (не старше 24 часов)
2. Валидация метрик и показателей
3. Согласованность данных между разными отчетами
4. Корректная обработка пропущенных значений
5. Нормализация оценок

## Дополнительные требования
1. Кэширование часто запрашиваемых данных
2. Автоматическое обновление статистики
3. Уведомления о критических показателях
4. Экспорт данных в различных форматах
5. Настраиваемые пороговые значения

## Интеграции
1. Система управления учебным процессом
2. Система электронного журнала
3. Система учета посещаемости
4. Система тестирования
5. Система уведомлений
6. Система отчетности 