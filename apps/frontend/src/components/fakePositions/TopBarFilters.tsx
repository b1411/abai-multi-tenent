import React from 'react';
import { FaSearch, FaFilter, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import { FakePositionsFilters } from '../../types/fakePositions';
import { useFakePositionsActions } from '../../hooks/useFakePositionsActions';

interface TopBarFiltersProps {
  filters: FakePositionsFilters;
  onFiltersChange: (filters: FakePositionsFilters) => void;
  teacherOptions: { id: number; name: string }[];
  subjectOptions: string[];
  totalRecords: number;
}

const TopBarFilters: React.FC<TopBarFiltersProps> = ({
  filters,
  onFiltersChange,
  teacherOptions,
  subjectOptions,
  totalRecords
}) => {
  const { exportReport, loading: exportLoading } = useFakePositionsActions();

  const handleFilterChange = (key: keyof FakePositionsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const handleExport = async () => {
    await exportReport('xlsx');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Контроль фиктивных ставок (AI)
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Система автоматического контроля посещаемости преподавателей
          </p>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">
              {exportLoading ? 'Экспорт...' : 'Выгрузить Excel'}
            </span>
            <span className="xs:hidden">
              {exportLoading ? 'Экспорт...' : 'Excel'}
            </span>
          </button>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-2 rounded-lg">
            <FaFilter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Всего: {totalRecords}</span>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Дата от */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата от
          </label>
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filters.dateFrom || getTodayDate()}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Дата до */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата до
          </label>
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filters.dateTo || getTodayDate()}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Преподаватель */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Преподаватель
          </label>
          <select
            value={filters.teacherId || ''}
            onChange={(e) => handleFilterChange('teacherId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="">Все преподаватели</option>
            {teacherOptions.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        {/* Предмет */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Предмет
          </label>
          <select
            value={filters.subject || ''}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="">Все предметы</option>
            {subjectOptions.map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Статус */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Статус
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="all">Все статусы</option>
            <option value="confirmed">Подтверждено</option>
            <option value="mismatch">Несовпадение</option>
            <option value="absent">Неявка</option>
          </select>
        </div>
      </div>

      {/* Поиск по имени (дополнительно) */}
      <div className="mt-4">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск по имени преподавателя..."
            value={filters.teacherName || ''}
            onChange={(e) => handleFilterChange('teacherName', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default TopBarFilters;
