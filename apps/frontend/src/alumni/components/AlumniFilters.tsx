import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { AlumniFilters, AlumniStatus } from '../types/alumni';
import { useAlumniOptions } from '../hooks/useAlumni';

interface AlumniFiltersProps {
  filters: AlumniFilters;
  onFiltersChange: (filters: Partial<AlumniFilters>) => void;
  onClearFilters: () => void;
}

const AlumniFiltersComponent: React.FC<AlumniFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const { graduationYears, industries, loading } = useAlumniOptions();

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Поиск */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Поиск по имени, группе или компании..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Фильтр по году выпуска */}
        <div className="w-full lg:w-48">
          <select
            value={filters.graduationYear || ''}
            onChange={(e) => onFiltersChange({ 
              graduationYear: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Все годы</option>
            {graduationYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Фильтр по статусу */}
        <div className="w-full lg:w-48">
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ 
              status: e.target.value as AlumniStatus || undefined 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все статусы</option>
            <option value={AlumniStatus.ACTIVE}>Активный</option>
            <option value={AlumniStatus.INACTIVE}>Неактивный</option>
          </select>
        </div>

        {/* Фильтр по индустрии */}
        <div className="w-full lg:w-48">
          <select
            value={filters.industry || ''}
            onChange={(e) => onFiltersChange({ 
              industry: e.target.value || undefined 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Все индустрии</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>

        {/* Сортировка */}
        <div className="w-full lg:w-48">
          <select
            value={`${filters.sortBy || 'name'}-${filters.sortOrder || 'asc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              onFiltersChange({ 
                sortBy: sortBy as any,
                sortOrder: sortOrder as 'asc' | 'desc'
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name-asc">Имя (А-Я)</option>
            <option value="name-desc">Имя (Я-А)</option>
            <option value="graduationDate-desc">Новые выпускники</option>
            <option value="graduationDate-asc">Старые выпускники</option>
            <option value="company-asc">Компания (А-Я)</option>
            <option value="company-desc">Компания (Я-А)</option>
          </select>
        </div>

        {/* Кнопка очистки фильтров */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Очистить фильтры"
          >
            <X className="h-5 w-5 mr-1" />
            <span className="hidden lg:inline">Очистить</span>
          </button>
        )}
      </div>

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Поиск: {filters.search}
              <button
                onClick={() => onFiltersChange({ search: undefined })}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.graduationYear && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Год: {filters.graduationYear}
              <button
                onClick={() => onFiltersChange({ graduationYear: undefined })}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Статус: {filters.status === AlumniStatus.ACTIVE ? 'Активный' : 'Неактивный'}
              <button
                onClick={() => onFiltersChange({ status: undefined })}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.industry && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Индустрия: {filters.industry}
              <button
                onClick={() => onFiltersChange({ industry: undefined })}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AlumniFiltersComponent;
