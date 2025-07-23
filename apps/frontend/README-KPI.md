# KPI и эффективность

Система управления ключевыми показателями эффективности (KPI) преподавателей.

## Возможности

### Общий обзор KPI
- **Общие метрики**: Средний KPI по организации, достижение целей, активные цели
- **Детальные показатели**: Качество преподавания, удовлетворенность студентов, посещаемость, выполнение нагрузки, профессиональное развитие
- **Визуализация**: Динамика KPI, графики по отделам

### Рейтинг преподавателей
- **Таблица рейтинга**: Сортировка по общему KPI с трендами
- **Фильтрация**: По отделам/кафедрам, периодам
- **Поиск**: По имени преподавателя
- **Детальная информация**: Модальное окно с радар-диаграммой компетенций

### Аналитика
- **Статистика**: Средний KPI, топ исполнители, преподаватели в норме, требующие внимания
- **Тренды**: Графики динамики показателей за периоды
- **Сравнение**: KPI по отделам и кафедрам

## Структура файлов

```
src/
├── pages/
│   └── KPI.tsx                 # Основная страница KPI
├── services/
│   └── kpiService.ts           # API сервис для работы с KPI
├── types/
│   └── kpi.ts                  # TypeScript типы для KPI
└── README-KPI.md              # Документация
```

## API Endpoints

### `/kpi/overview`
Получение общих показателей KPI
- Параметры: department, period, startDate, endDate
- Возвращает: общие метрики, средний KPI, достижение целей

### `/kpi/teachers`
Получение KPI преподавателей
- Параметры: department, period, teacherId, startDate, endDate
- Возвращает: список преподавателей с детальными показателями

### `/kpi/departments`
Получение KPI по отделам
- Параметры: period, startDate, endDate
- Возвращает: средний KPI по отделам, количество преподавателей

### `/kpi/trends`
Получение трендов KPI
- Параметры: department, period, startDate, endDate
- Возвращает: данные динамики за периоды

### `/kpi/goals`
Получение целей KPI
- Параметры: department, period, startDate, endDate
- Возвращает: активные цели, прогресс достижения

### `/kpi/comparison`
Получение сравнения KPI
- Параметры: department, period, startDate, endDate
- Возвращает: сравнение текущего и предыдущего периодов

## Компоненты

### KPI (основной компонент)
- Загрузка данных из API
- Фильтрация по отделам и периодам
- Поиск преподавателей
- Отображение графиков и таблиц
- Модальное окно с детальной информацией

## Типы данных

### KpiMetric
```typescript
interface KpiMetric {
  name: string;
  value: number;
  target: number;
  change: number;
  unit: string;
  status: 'success' | 'warning' | 'danger';
}
```

### TeacherKpi
```typescript
interface TeacherKpi {
  id: number;
  name: string;
  overallScore: number;
  teachingQuality: number;
  studentSatisfaction: number;
  classAttendance: number;
  workloadCompliance: number;
  professionalDevelopment: number;
  trend: number;
  rank: number;
}
```

## Использование

### Основное использование
```typescript
import KPIPage from './pages/KPI';

// В роутинге
<Route path="hr/kpi" element={<KPIPage />} />
```

### Работа с API
```typescript
import { kpiService } from './services/kpiService';

// Получение данных
const overview = await kpiService.getOverview({ period: 'current' });
const teachers = await kpiService.getTeacherKpi({ department: 'Математика' });
```

## Возможности для развития

1. **Настройка KPI**: Возможность изменения весов показателей
2. **Цели**: Управление целями KPI для отделов и преподавателей
3. **Уведомления**: Автоматические уведомления о достижении целей
4. **Экспорт**: Выгрузка отчетов в различных форматах
5. **Планы развития**: Индивидуальные планы улучшения KPI
6. **Интеграция**: Связь с системой HR и расчета зарплаты

## Технические особенности

- Использует React hooks для управления состоянием
- Интегрируется с recharts для визуализации данных
- Поддерживает фильтрацию и поиск в реальном времени
- Адаптивный дизайн для различных экранов
- TypeScript типизация для безопасности типов
