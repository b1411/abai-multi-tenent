# Модуль управления задачами (Tasks)

## Описание
Модуль задач предоставляет функциональность для создания, управления и отслеживания задач в системе. Пользователи могут создавать личные задачи, назначать их другим пользователям, отслеживать статус выполнения и управлять приоритетами.

## Функциональность

### Основные возможности
- ✅ Создание и редактирование задач
- ✅ Назначение задач пользователям
- ✅ Управление статусами (В ожидании, В работе, Завершена, Отменена)
- ✅ Система приоритетов (Низкий, Средний, Высокий, Срочный)
- ✅ Категоризация задач
- ✅ Система тегов
- ✅ Прикрепление файлов
- ✅ Установка сроков выполнения
- ✅ Фильтрация и поиск
- ✅ Статистика и аналитика

### Статусы задач
- **PENDING** - В ожидании: задача создана, но работа не начата
- **IN_PROGRESS** - В работе: задача находится в процессе выполнения
- **COMPLETED** - Завершена: задача успешно выполнена
- **CANCELLED** - Отменена: задача отменена

### Приоритеты
- **LOW** - Низкий: несрочные задачи
- **MEDIUM** - Средний: обычные задачи
- **HIGH** - Высокий: важные задачи
- **URGENT** - Срочный: критически важные задачи

## Структура файлов

### Backend
```
apps/backend/src/tasks/
├── tasks.module.ts          # Модуль NestJS
├── tasks.controller.ts      # REST API контроллер
├── tasks.service.ts         # Бизнес-логика
└── dto/
    ├── create-task.dto.ts   # DTO для создания задачи
    ├── update-task.dto.ts   # DTO для обновления задачи
    └── task-filter.dto.ts   # DTO для фильтрации
```

### Frontend
```
apps/frontend/src/
├── types/task.ts            # TypeScript типы
├── services/taskService.ts  # API клиент
├── hooks/useTasks.ts        # React хуки
└── pages/Tasks.tsx          # Основная страница
```

## API Endpoints

### GET /tasks
Получить список задач с фильтрацией
- Параметры: page, limit, search, status, priority, assigneeId, dueDateFrom, dueDateTo
- Ответ: TaskResponse с пагинацией

### GET /tasks/:id
Получить задачу по ID
- Ответ: Task

### POST /tasks
Создать новую задачу
- Тело: CreateTaskDto
- Ответ: Task

### PATCH /tasks/:id
Обновить задачу
- Тело: UpdateTaskDto
- Ответ: Task

### DELETE /tasks/:id
Удалить задачу
- Ответ: void

### GET /tasks/stats
Получить статистику задач
- Ответ: TaskStats

### GET /tasks/categories
Получить категории задач
- Ответ: TaskCategory[]

### POST /tasks/categories
Создать категорию
- Тело: CreateCategoryDto
- Ответ: TaskCategory

## Модели данных

### Task
```typescript
interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  attachments: string[];
  assigneeId?: number;
  assignee?: User;
  createdById: number;
  createdBy: User;
  categoryId?: number;
  category?: TaskCategory;
  createdAt: string;
  updatedAt: string;
}
```

### TaskCategory
```typescript
interface TaskCategory {
  id: number;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

### TaskStats
```typescript
interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}
```

## Использование

### Хуки
```typescript
// Основной хук для работы с задачами
const {
  tasks,
  loading,
  error,
  pagination,
  createTask,
  updateTask,
  deleteTask,
  updateFilter,
  changePage,
} = useTasks();

// Статистика задач
const { stats } = useTaskStats();

// Категории задач
const { categories, createCategory } = useTaskCategories();

// Работа с конкретной задачей
const { task, updateTask } = useTask(taskId);
```

### Создание задачи
```typescript
const newTask: CreateTaskData = {
  title: "Новая задача",
  description: "Описание задачи",
  priority: TaskPriority.HIGH,
  assigneeId: 123,
  dueDate: "2025-01-30",
  categoryId: 1,
  tags: ["важная", "срочная"],
  attachments: []
};

const createdTask = await createTask(newTask);
```

### Фильтрация задач
```typescript
updateFilter({
  search: "поиск",
  status: TaskStatus.IN_PROGRESS,
  priority: TaskPriority.HIGH,
  assigneeId: 123,
  dueDateFrom: "2025-01-01",
  dueDateTo: "2025-01-31"
});
```

## Права доступа
- Пользователи могут создавать задачи
- Создатель задачи может редактировать и удалять её
- Исполнитель может изменять статус назначенной ему задачи
- Все пользователи видят только свои задачи (созданные или назначенные им)

## Интеграции
- Система уведомлений при изменении статуса задач
- Календарь для отображения задач с дедлайнами
- Файловая система для прикрепления документов

## Планируемые улучшения
- [ ] Подзадачи и иерархия задач
- [ ] Комментарии к задачам
- [ ] История изменений
- [ ] Шаблоны задач
- [ ] Повторяющиеся задачи
- [ ] Доски задач (Kanban)
- [ ] Временные метки работы
- [ ] Интеграция с внешними системами
