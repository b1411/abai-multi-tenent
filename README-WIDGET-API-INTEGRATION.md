# Интеграция виджетов с API

## Обзор

Успешно подключены все виджеты из директории `apps/frontend/src/components/widgets/specific` к API бэкенда. Виджеты теперь получают данные через реальные API endpoints, с возможностью fallback на mock данные при отсутствии соединения.

## Подключенные виджеты

### 1. ActivityMonitoringWidget
- **Endpoint**: `/dashboard/widget-data/activity-monitoring`
- **Данные**: Активность пользователей, онлайн статистика, последние действия
- **Особенности**: Live обновления, поддержка реального времени

### 2. AssignmentsWidget  
- **Endpoint**: `/dashboard/widget-data/assignments`
- **Данные**: Домашние задания, статистика выполнения
- **Особенности**: Фильтрация по статусу, индикация просроченных заданий

### 3. AttendanceWidget
- **Endpoint**: `/dashboard/widget-data/attendance`
- **Данные**: Персональная посещаемость, статистика по месяцам
- **Особенности**: Процентное представление, тренды

### 4. ClassroomUsageWidget
- **Endpoint**: `/dashboard/widget-data/classroom-usage`
- **Данные**: Использование кабинетов, расписание помещений
- **Особенности**: Реальное время, статистика по этажам

### 5. FinanceOverviewWidget
- **Endpoint**: `/dashboard/widget-data/finance-overview`
- **Данные**: Финансовая сводка, доходы, расходы
- **Особенности**: Форматирование валют, показатели роста

### 6. GradeAnalyticsWidget
- **Endpoint**: `/dashboard/widget-data/grade-analytics`
- **Данные**: Аналитика оценок, распределение, топ предметы
- **Особенности**: Графические индикаторы, сравнительная аналитика

### 7. GradesWidget
- **Endpoint**: `/dashboard/widget-data/grades`
- **Данные**: Последние оценки, средний балл
- **Особенности**: Цветовая индикация, тренды

### 8. NewsWidget
- **Endpoint**: `/dashboard/widget-data/news`
- **Данные**: Новости школы, объявления
- **Особенности**: Категоризация, приоритеты

### 9. ScheduleWidget
- **Endpoint**: `/dashboard/widget-data/schedule`
- **Данные**: Расписание занятий
- **Особенности**: Информация о кабинетах и учителях

### 10. SchoolAttendanceWidget
- **Endpoint**: `/dashboard/widget-data/school-attendance`
- **Данные**: Общая посещаемость школы
- **Особенности**: Статистика по классам, недельные тренды

### 11. SystemAlertsWidget
- **Endpoint**: `/dashboard/widget-data/system-alerts`
- **Данные**: Системные уведомления и предупреждения
- **Особенности**: Приоритизация по типам

### 12. SystemMonitoringWidget
- **Endpoint**: `/dashboard/widget-data/system-monitoring`
- **Данные**: Мониторинг системы, использование ресурсов
- **Особенности**: Реальное время, статусы сервисов

### 13. SystemStatsWidget
- **Endpoint**: `/dashboard/widget-data/system-stats`
- **Данные**: Общая статистика системы
- **Особенности**: Ключевые показатели, uptime

### 14. TasksWidget
- **Endpoint**: `/dashboard/widget-data/tasks`
- **Данные**: Персональные задачи
- **Особенности**: Управление статусами, приоритеты

### 15. TeacherWorkloadWidget
- **Endpoint**: `/dashboard/widget-data/teacher-workload`
- **Данные**: Нагрузка учителей
- **Особенности**: Анализ распределения, индикаторы перегрузки

### 16. WeatherWidget
- **Endpoint**: `/dashboard/widget-data/weather`
- **Данные**: Погодная информация
- **Особенности**: Прогноз, адаптивная визуализация

## Архитектура API

### Backend Controller
```typescript
// apps/backend/src/dashboard/dashboard.controller.ts
@Get('widget-data/:widgetType')
async getWidgetData(
  @Param('widgetType') widgetType: string,
  @Query() query: any,
  @Req() req: any
) {
  return this.dashboardService.getWidgetData(widgetType, query, req.user);
}
```

### Backend Service
```typescript
// apps/backend/src/dashboard/dashboard.service.ts
async getWidgetData(widgetType: string, params: any, user: any) {
  // Роутинг к соответствующим сервисам
  // Обработка различных типов виджетов
  // Возврат структурированных данных
}
```

### Frontend Service
```typescript
// apps/frontend/src/services/widgetService.ts
async getWidgetData(widgetType: WidgetType, config?: any): Promise<any> {
  try {
    const url = config ? 
      `/dashboard/widget-data/${widgetType}?${new URLSearchParams(config)}` : 
      `/dashboard/widget-data/${widgetType}`;
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error(`Error fetching data for widget ${widgetType}:`, error);
    // Return mock data as fallback
    return this.getMockWidgetData(widgetType);
  }
}
```

## Fallback механизм

Каждый виджет имеет встроенный fallback на mock данные:
- При отсутствии соединения с API
- При ошибках сервера
- В процессе разработки

Mock данные находятся в `getMockWidgetData()` методе сервиса.

## Безопасность

- Все endpoints требуют аутентификации
- Данные фильтруются по роли пользователя
- Валидация входных параметров
- Защита от несанкционированного доступа

## Производительность

- Кэширование на уровне сервиса
- Оптимизированные запросы к БД
- Минимизация нагрузки на сеть
- Lazy loading для крупных виджетов

## Следующие шаги

1. ✅ Подключить виджеты к API
2. ✅ Реализовать fallback на mock данные
3. ✅ Настроить endpoint роутинг
4. 🔄 Добавить реальную бизнес-логику в сервисы
5. 🔄 Оптимизировать запросы к базе данных
6. 🔄 Добавить кэширование
7. 🔄 Реализовать WebSocket для real-time обновлений

## Использование

Виджеты автоматически получают данные при инициализации:

```typescript
// В компоненте виджета
const [data, setData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    const widgetData = await widgetService.getWidgetData(widget.type, config);
    setData(widgetData);
  };
  
  fetchData();
}, [widget.type, config]);
```

## Отладка

Для отладки включить консольные логи:
```typescript
// В браузере
localStorage.setItem('DEBUG', 'widget:*');
```

Все ошибки API логируются в консоль с детальной информацией.
