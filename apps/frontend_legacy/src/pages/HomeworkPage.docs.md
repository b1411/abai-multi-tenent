# Документация API для HomeworkPage (Управление домашними заданиями)

## Общее описание
API для системы управления домашними заданиями в образовательном учреждении. Система обеспечивает создание, распределение и проверку домашних заданий, отслеживание их выполнения и оценивание работ учащихся.

## Модели данных

### Homework (Домашнее задание)
```typescript
interface Homework {
  id: string;              // Уникальный идентификатор
  subjectId: string;       // ID предмета
  subject: string;         // Название предмета
  title: string;          // Заголовок задания
  description: string;    // Описание задания
  dueDate: string;       // Срок сдачи
  attachments: {         // Прикрепленные файлы
    id: string;
    name: string;
    type: string;
    size: number;
  }[];
  status: 'pending' | 'submitted' | 'graded' | 'overdue';  // Статус
  grade?: number;        // Оценка
  feedback?: string;     // Отзыв преподавателя
  submissionDate?: string;  // Дата сдачи
  submission?: {         // Информация о сданной работе
    files: {
      id: string;
      name: string;
      type: string;
      size: number;
    }[];
    comment?: string;    // Комментарий студента
    submittedAt?: string;  // Время сдачи
  };
  teacherId: string;     // ID преподавателя
  teacherName: string;   // ФИО преподавателя
  classId: string;       // ID класса
  createdAt: string;     // Дата создания
  priority: 'high' | 'medium' | 'low';  // Приоритет
  estimatedTime: string;  // Оценочное время выполнения
  maxScore: number;      // Максимальный балл
}
```

## API Endpoints

### 1. Управление заданиями

#### 1.1. Получение списка заданий
```
GET /api/homework
```
**Query параметры:**
- `subjectId` (string, опционально) - ID предмета
- `status` (string, опционально) - статус задания
- `classId` (string, опционально) - ID класса
- `teacherId` (string, опционально) - ID преподавателя
- `startDate` (string, опционально) - начальная дата
- `endDate` (string, опционально) - конечная дата
- `search` (string, опционально) - поисковый запрос
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  homeworks: Homework[];
  total: number;
  summary: {
    pending: number;
    submitted: number;
    graded: number;
    overdue: number;
    averageGrade: number;
  };
}
```

#### 1.2. Создание задания
```
POST /api/homework
```
**Тело запроса:**
```typescript
{
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  maxScore: number;
  attachments?: File[];
}
```

#### 1.3. Сдача задания
```
POST /api/homework/{id}/submit
```
**Тело запроса:**
Multipart form data:
- `files`: File[]
- `comment`: string

#### 1.4. Оценивание задания
```
POST /api/homework/{id}/grade
```
**Тело запроса:**
```typescript
{
  grade: number;
  feedback?: string;
}
```

### 2. Управление файлами

#### 2.1. Загрузка файлов
```
POST /api/homework/files
```
**Тело запроса:**
Multipart form data:
- `files`: File[]
- `homeworkId`: string

#### 2.2. Скачивание файла
```
GET /api/homework/files/{fileId}
```

### 3. Аналитика

#### 3.1. Получение статистики
```
GET /api/homework/statistics
```
**Query параметры:**
- `subjectId` (string, опционально)
- `classId` (string, опционально)
- `period` (string, опционально)

**Ответ:**
```typescript
{
  statistics: {
    totalAssignments: number;
    completionRate: number;
    averageGrade: number;
    onTimeSubmissions: number;
    lateSubmissions: number;
  };
  bySubject: Record<string, {
    assignments: number;
    averageGrade: number;
  }>;
  byStudent: Array<{
    studentId: string;
    completed: number;
    averageGrade: number;
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
- 413: Превышен размер файла
- 500: Внутренняя ошибка сервера

## Примеры запросов

### Создание нового задания
```bash
curl -X POST http://api.example.com/api/homework \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer {token}" \
  -F "title=Квадратные уравнения" \
  -F "description=Решить задачи 1-5 из учебника" \
  -F "subjectId=math" \
  -F "classId=10A" \
  -F "dueDate=2024-03-15T23:59:59" \
  -F "priority=high" \
  -F "maxScore=10" \
  -F "file=@examples.pdf"
```

### Сдача задания
```bash
curl -X POST http://api.example.com/api/homework/123/submit \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer {token}" \
  -F "files=@solution.pdf" \
  -F "comment=Выполнил все задания"
```

## Примечания по безопасности
1. Права доступа:
   - Просмотр: студенты (свои задания), родители (задания детей)
   - Создание: преподаватели
   - Оценивание: преподаватели
   - Полный доступ: администраторы
2. Валидация файлов
3. Ограничение размера файлов
4. Проверка сроков сдачи
5. Защита от массовых изменений

## Требования к валидации
1. Проверка сроков выполнения
2. Валидация оценок (0-maxScore)
3. Проверка форматов файлов
4. Валидация размера файлов
5. Проверка обязательных полей

## Дополнительные требования
1. Уведомления о новых заданиях
2. Напоминания о сроках сдачи
3. Автоматическая проверка на плагиат
4. История изменений заданий
5. Экспорт оценок

## Интеграции
1. Система управления классами
2. Система оценивания
3. Система уведомлений
4. Система хранения файлов
5. Система проверки на плагиат
6. Система аналитики и отчетности 