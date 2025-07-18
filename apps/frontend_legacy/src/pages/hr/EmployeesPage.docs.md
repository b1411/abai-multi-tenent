# Документация API для EmployeesPage (Управление сотрудниками)

## Общее описание
API для управления кадровым составом образовательного учреждения, включая учет преподавателей, управление документами, отслеживание статусов и достижений сотрудников.

## Модели данных

### Employee (Сотрудник)
```typescript
interface Employee {
  id: number;              // Уникальный идентификатор
  name: string;            // ФИО сотрудника
  iin: string;            // ИИН
  email: string;          // Email
  position: string;       // Должность
  category: string;       // Категория
  subject: string;        // Предмет
  experience: string;     // Стаж
  status: 'active' | 'vacation' | 'sick' | 'business_trip';  // Статус
  employmentType: 'fulltime' | 'parttime';  // Тип занятости
  phone?: string;         // Телефон
  education?: string;     // Образование
  specialization?: string; // Специализация
  address?: string;       // Адрес
  hireDate?: string;      // Дата приема
  subjects?: {            // Преподаваемые предметы
    general: string[];    // Общепрофессиональные дисциплины
    special: string[];    // Специальные дисциплины
  };
  achievements?: string[];  // Достижения
  documents?: Array<{      // Документы
    id: string;
    type: string;
    number: string;
    date: string;
    name: string;
    status: 'active' | 'expired';
  }>;
}
```

### EmployeeSummary (Сводка по сотрудникам)
```typescript
interface EmployeeSummary {
  total: number;           // Общее количество
  byStatus: {             // Распределение по статусам
    active: number;
    vacation: number;
    sick: number;
    business_trip: number;
  };
  byEmploymentType: {     // Распределение по типу занятости
    fulltime: number;
    parttime: number;
  };
  bySubject: {           // Распределение по предметам
    [subject: string]: number;
  };
  byCategory: {          // Распределение по категориям
    [category: string]: number;
  };
}
```

## API Endpoints

### 1. Управление сотрудниками

#### 1.1. Получение списка сотрудников
```
GET /api/employees
```
**Query параметры:**
- `search` (string, опционально) - поиск по ФИО или должности
- `subject` (string, опционально) - фильтр по предмету
- `status` (string, опционально) - фильтр по статусу
- `employmentType` (string, опционально) - тип занятости
- `page` (number) - номер страницы
- `limit` (number) - количество записей на странице

**Ответ:**
```typescript
{
  employees: Employee[];
  total: number;
  summary: EmployeeSummary;
}
```

#### 1.2. Создание сотрудника
```
POST /api/employees
```
**Тело запроса:** `Omit<Employee, 'id'>`

#### 1.3. Обновление данных сотрудника
```
PUT /api/employees/:id
```
**Тело запроса:** Частичный `Employee`

#### 1.4. Изменение статуса сотрудника
```
PATCH /api/employees/:id/status
```
**Тело запроса:**
```typescript
{
  status: 'active' | 'vacation' | 'sick' | 'business_trip';
  reason?: string;
  startDate?: string;
  endDate?: string;
}
```

#### 1.5. Изменение типа занятости
```
PATCH /api/employees/:id/employment-type
```
**Тело запроса:**
```typescript
{
  employmentType: 'fulltime' | 'parttime';
  effectiveDate: string;
  reason: string;
}
```

### 2. Управление документами

#### 2.1. Добавление документа
```
POST /api/employees/:id/documents
```
**Тело запроса:**
```typescript
{
  type: string;
  number: string;
  date: string;
  name: string;
  file: File;
  expiryDate?: string;
}
```

#### 2.2. Обновление статуса документа
```
PATCH /api/employees/:id/documents/:documentId
```
**Тело запроса:**
```typescript
{
  status: 'active' | 'expired';
  comment?: string;
}
```

### 3. Управление достижениями

#### 3.1. Добавление достижения
```
POST /api/employees/:id/achievements
```
**Тело запроса:**
```typescript
{
  title: string;
  date: string;
  description: string;
  attachments?: File[];
  category?: string;
}
```

### 4. Аналитика и отчетность

#### 4.1. Получение статистики по кадрам
```
GET /api/employees/analytics
```
**Query параметры:**
- `period` (string) - период анализа
- `groupBy` ('department' | 'subject' | 'category')
- `includeHistory` (boolean) - включить историю изменений

**Ответ:**
```typescript
{
  current: {
    totalEmployees: number;
    distribution: {
      byStatus: Record<string, number>;
      byEmploymentType: Record<string, number>;
      bySubject: Record<string, number>;
      byCategory: Record<string, number>;
    };
    averageExperience: number;
  };
  history: Array<{
    period: string;
    metrics: Record<string, number>;
  }>;
}
```

#### 4.2. Экспорт данных сотрудников
```
POST /api/employees/export
```
**Тело запроса:**
```typescript
{
  format: 'pdf' | 'xlsx';
  filters?: {
    status?: string[];
    employmentType?: string[];
    subjects?: string[];
    categories?: string[];
  };
  fields?: string[];
  includeDocuments?: boolean;
  includeAchievements?: boolean;
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

### Создание сотрудника
```bash
curl -X POST http://api.example.com/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Сатпаев Арман Болатович",
    "iin": "880501300999",
    "email": "satpayev@school.edu.kz",
    "position": "Учитель математики",
    "category": "Высшая категория",
    "subject": "Математика",
    "experience": "12 лет",
    "status": "active",
    "employmentType": "fulltime",
    "subjects": {
      "general": ["Алгебра", "Геометрия"],
      "special": ["Математический анализ"]
    }
  }'
```

### Изменение статуса
```bash
curl -X PATCH http://api.example.com/api/employees/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "status": "vacation",
    "startDate": "2024-07-01",
    "endDate": "2024-07-30",
    "reason": "Ежегодный отпуск"
  }'
```

## Примечания по безопасности
1. Все запросы должны содержать валидный JWT токен в заголовке Authorization
2. Права доступа:
   - Просмотр списка сотрудников: HR, руководители подразделений
   - Создание/редактирование: только HR
   - Управление документами: HR и администрация
   - Доступ к аналитике: руководство и HR
3. Все операции с данными сотрудников логируются
4. Персональные данные шифруются при хранении
5. Двухфакторная аутентификация для критических операций

## Интеграции
1. Интеграция с системой управления доступом
2. Интеграция с системой кадрового учета
3. Интеграция с системой расчета зарплаты
4. Интеграция с системой электронного документооборота
5. Интеграция с системой учета рабочего времени
6. Экспорт данных в различные форматы отчетности 