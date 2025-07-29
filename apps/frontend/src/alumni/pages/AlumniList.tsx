import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlumni } from '../hooks/useAlumni';
import { Alumni } from '../types/alumni';
import AlumniStats from '../components/AlumniStats';
import AlumniFilters from '../components/AlumniFilters';
import AlumniCard from '../components/AlumniCard';
import { Grid, List, Download, Users, Loader2 } from 'lucide-react';

const AlumniList: React.FC = () => {
  const navigate = useNavigate();
  const { alumni, loading, error, filters, updateFilters, clearFilters } = useAlumni();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleAlumniClick = (alumniItem: Alumni) => {
    navigate(`/alumni/${alumniItem.id}`);
  };

  const handleExport = () => {
    // В будущем можно реализовать экспорт в CSV/Excel
    console.log('Экспорт данных выпускников');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-blue-600" />
                Выпускники
              </h1>
              <p className="text-gray-600 mt-2">
                Управление данными выпускников и анализ их карьерного роста
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Переключатель вида */}
              <div className="flex rounded-lg border border-gray-300 bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Сетка"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Список"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              {/* Кнопка экспорта */}
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Экспорт</span>
              </button>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <AlumniStats />

        {/* Фильтры */}
        <AlumniFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />

        {/* Результаты */}
        <div className="bg-white rounded-lg shadow">
          {/* Заголовок результатов */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Загрузка...
                  </span>
                ) : (
                  `Найдено выпускников: ${alumni.length}`
                )}
              </h2>
              
              {!loading && alumni.length > 0 && (
                <div className="text-sm text-gray-600">
                  {Object.keys(filters).length > 0 && 'Результаты фильтрации'}
                </div>
              )}
            </div>
          </div>

          {/* Контент */}
          <div className="p-6">
            {loading ? (
              /* Скелетон загрузки */
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : alumni.length === 0 ? (
              /* Пустое состояние */
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выпускники не найдены
                </h3>
                <p className="text-gray-600 mb-4">
                  {Object.keys(filters).length > 0 
                    ? 'Попробуйте изменить критерии фильтрации'
                    : 'В системе пока нет данных о выпускниках'
                  }
                </p>
                {Object.keys(filters).length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            ) : (
              /* Список выпускников */
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {alumni.map((alumniItem) => (
                  <AlumniCard
                    key={alumniItem.id}
                    alumni={alumniItem}
                    onClick={handleAlumniClick}
                    className={viewMode === 'list' ? 'sm:flex sm:items-center sm:space-x-6' : ''}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Пагинация (если будет нужна в будущем) */}
          {!loading && alumni.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Показано {alumni.length} выпускников
                </div>
                {/* Здесь можно добавить кнопки пагинации в будущем */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniList;
