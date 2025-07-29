import React from 'react';
import { Filter } from 'lucide-react';

interface ActivityFilters {
  userId?: number;
  days: number;
  activityType?: string;
}

interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleDaysChange = (days: number) => {
    onFiltersChange({ ...filters, days });
  };

  const handleActivityTypeChange = (activityType: string) => {
    onFiltersChange({ 
      ...filters, 
      activityType: activityType === 'all' ? undefined : activityType 
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-4 w-4 text-gray-500" />
        <h4 className="font-medium text-gray-900">Фильтры</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Период */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Период
          </label>
          <select
            value={filters.days}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>Последний день</option>
            <option value={7}>Последняя неделя</option>
            <option value={30}>Последний месяц</option>
            <option value={90}>Последние 3 месяца</option>
          </select>
        </div>

        {/* Тип активности */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип активности
          </label>
          <select
            value={filters.activityType || 'all'}
            onChange={(e) => handleActivityTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все типы</option>
            <option value="LOGIN">Вход в систему</option>
            <option value="LOGOUT">Выход из системы</option>
            <option value="PAGE_VIEW">Просмотр страниц</option>
            <option value="CREATE">Создание</option>
            <option value="UPDATE">Обновление</option>
            <option value="DELETE">Удаление</option>
            <option value="API_REQUEST">API запросы</option>
            <option value="FILE_UPLOAD">Загрузка файлов</option>
            <option value="FILE_DOWNLOAD">Скачивание файлов</option>
          </select>
        </div>

        {/* Кнопка сброса фильтров */}
        <div className="flex items-end">
          <button
            onClick={() => onFiltersChange({ days: 7, activityType: undefined })}
            className="w-full px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
  );
};
