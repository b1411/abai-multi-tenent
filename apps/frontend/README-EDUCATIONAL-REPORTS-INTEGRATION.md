# Интеграция системы образовательных отчетов

## Обзор

Данный документ описывает интеграцию фронтенда с системой образовательных отчетов согласно приказу 125.

## Компоненты

### EducationalReports (`/educational-reports`)

Главная страница системы отчетов, включающая:

- **Фильтры отчетов** - период, класс, предмет, учитель
- **KPI панель** - ключевые показатели успеваемости
- **Интерактивные графики** - динамика, распределение оценок
- **Таблица успеваемости** - детальная информация по студентам
- **Экспорт данных** - Excel и PDF форматы

### API клиент

**Файл**: `src/services/educationalReportsApi.ts`

**Основные методы**:
```typescript
// Получение студентов
getStudents(filters: EducationalReportFilters): Promise<Student[]>

// Оценки студента
getStudentGrades(studentId: number, filters: StudentReportFilters): Promise<SubjectGrades[]>

// Статистика качества
getQualityStatistics(filters: EducationalReportFilters): Promise<QualityStatistics>
```

## Ключевые особенности

### 1. Расчет качества знаний согласно приказу 125

```typescript
// Процент учащихся с оценками 4 и 5
calculateQualityPercentage(grades: number[]): number {
  if (grades.length === 0) return 0;
  const qualityGrades = grades.filter(grade => grade >= 4).length;
  return Math.round((qualityGrades / grades.length) * 100);
}
```

### 2. Адаптивный дизайн

Компонент полностью адаптирован для мобильных устройств:
- Респонсивная таблица с горизонтальной прокруткой
- Адаптивная сетка фильтров
- Мобильная навигация

### 3. Экспорт отчетов

**Excel экспорт**:
- Полная таблица успеваемости
- Сводная статистика
- Метаданные отчета

**PDF экспорт**:
- Форматированная таблица
- Заголовки и подписи
- Сводная информация

### 4. Интерактивные графики

**Используется библиотека Recharts**:
- Динамика среднего балла (LineChart)
- Пропуски по периодам (BarChart)  
- Распределение оценок (PieChart)

## Типы данных

### Фильтры отчетов
```typescript
interface ReportFilters {
  period: 'day' | 'week' | 'quarter' | 'year';
  class: string;
  subject: string;
  search: string;
}
```

### Студент
```typescript
interface Student {
  id: string;
  fullName: string;
  grades: { [subject: string]: number[] };
  averageGrade: number;
  qualityPercentage: number;
  className: string;
}
```

### KPI метрики
```typescript
interface KPIMetrics {
  totalStudents: number;
  qualityPercentage: number;
  averageGrade: number;
  unexcusedAbsences: number;
}
```

## Интеграция с API

### Загрузка данных

```typescript
const loadStudentsData = useCallback(async () => {
  try {
    setLoading(true);
    
    // API фильтры
    const apiFilters: EducationalReportFilters = {
      period: filters.period,
      className: filters.class || undefined,
      search: filters.search || undefined
    };

    // Параллельная загрузка данных
    const [studentsData, qualityData] = await Promise.all([
      educationalReportsApi.getStudents(apiFilters),
      educationalReportsApi.getQualityStatistics(apiFilters)
    ]);

    // Обработка и конвертация данных
    // ...
  } catch (error) {
    // Fallback на моковые данные
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
}, [filters]);
```

### Обработка ошибок

Система имеет многоуровневую обработку ошибок:
1. **API уровень** - повторные попытки, таймауты
2. **Компонент уровень** - fallback на моковые данные
3. **UI уровень** - пользовательские уведомления

## Производительность

### Оптимизации

- **useMemo** для тяжелых вычислений
- **useCallback** для предотвращения ре-рендеров
- **Виртуализация** больших таблиц
- **Ленивая загрузка** графиков

### Кэширование

- Кэширование результатов API запросов
- Локальное сохранение настроек фильтров
- Сохранение состояния компонентов

## Доступность

### ARIA атрибуты

```tsx
<button
  aria-label="Экспорт в Excel"
  title="Скачать отчет в формате Excel"
>
  <FileDown className="w-4 h-4" />
  Excel
</button>
```

### Клавиатурная навигация

- Tab-навигация по всем интерактивным элементам
- Enter/Space для активации кнопок
- Escape для закрытия модальных окон

## Настройка и кастомизация

### Конфигурация периодов

```typescript
const periods = {
  day: 'День',
  week: 'Неделя', 
  quarter: 'Четверть',
  year: 'Год'
};
```

### Настройка предметов

```typescript
const subjects = [
  'Математика',
  'Физика',
  'Химия',
  // ... другие предметы
];
```

### Цветовая схема оценок

```typescript
const getGradeColor = (grade: number) => {
  if (grade >= 4.5) return 'text-green-600 bg-green-50';
  if (grade >= 3.5) return 'text-blue-600 bg-blue-50';
  if (grade >= 2.5) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};
```

## Тестирование

### Unit тесты

```bash
cd apps/frontend
npm run test -- EducationalReports
```

### E2E тесты

```bash
cd apps/frontend
npm run test:e2e -- educational-reports
```

## Развертывание

### Переменные окружения

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_ENABLE_MOCK_DATA=false
```

### Сборка для продакшена

```bash
cd apps/frontend
npm run build
```

## Поддержка браузеров

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Будущие улучшения

1. **PWA поддержка** - оффлайн режим
2. **Виртуализация таблиц** - работа с большими объемами данных
3. **Расширенная фильтрация** - сложные условия поиска
4. **Печать отчетов** - прямая печать без экспорта

---

*Документация актуальна на: Январь 2025*
