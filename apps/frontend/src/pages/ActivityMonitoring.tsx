import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock, BarChart3, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useActivity } from '../contexts/ActivityContext';
import { ActivityFilters } from '../components/activity-monitoring/ActivityFilters';
import { ActivityStatistics } from '../components/activity-monitoring/ActivityStatistics';
import { ActivityTestPanel } from '../components/ActivityTestPanel';

export const ActivityMonitoring: React.FC = () => {
  const {
    connected,
    onlineUsers,
    activities,
    stats,
    loading,
    error,
    isAdmin,
    refreshOnlineUsers,
    refreshActivities,
    refreshStats,
    exportActivities,
  } = useActivity();

  const [activeTab, setActiveTab] = useState('online');
  const [filters, setFilters] = useState<{
    userId?: number;
    days: number;
    activityType?: string;
  }>({
    userId: undefined,
    days: 7,
    activityType: undefined,
  });

  useEffect(() => {
    if (connected) {
      refreshActivities(filters);
      refreshStats(filters.days);
    }
  }, [filters, connected, refreshActivities, refreshStats]);

  // Показываем ошибку, если есть
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Ошибка подключения</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Мониторинг активности</h1>
            <div className="flex items-center space-x-2">
              {connected ? (
                <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              )}
              <span className={`text-xs sm:text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
                {connected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Отслеживание активности пользователей в системе
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <button
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
            onClick={exportActivities}
            disabled={!connected}
          >
            <span className="sm:hidden">Экспорт</span>
            <span className="hidden sm:inline">Экспорт данных</span>
          </button>
          <button
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 text-sm"
            onClick={refreshOnlineUsers}
            disabled={!connected}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Всего пользователей</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.totalUsers || 0}</p>
            </div>
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Онлайн сейчас</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats?.summary?.activeUsers || 0}</p>
            </div>
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Активных сессий</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.totalSessions || 0}</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Всего действий</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.totalActivities || 0}</p>
            </div>
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-3 sm:px-6">
            <button
              onClick={() => setActiveTab('online')}
              className={`flex-shrink-0 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'online'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <span className="sm:hidden">Онлайн ({onlineUsers.length})</span>
              <span className="hidden sm:inline">Онлайн пользователи ({onlineUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-shrink-0 py-3 sm:py-4 px-2 sm:px-1 ml-4 sm:ml-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <span className="sm:hidden">История</span>
              <span className="hidden sm:inline">История активности</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-shrink-0 py-3 sm:py-4 px-2 sm:px-1 ml-4 sm:ml-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Статистика
            </button>
          </nav>
        </div>

        <div className="p-3 sm:p-6">
          {activeTab === 'online' && (
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Пользователи онлайн</h3>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : onlineUsers.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{user.name} {user.surname}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">Роль: {user.role}</p>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm text-green-600 font-medium">Онлайн</p>
                        {user.currentPage && (
                          <p className="text-xs text-gray-500 truncate max-w-32 sm:max-w-none">{user.currentPage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm sm:text-base">Нет пользователей онлайн</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-medium">История активности</h3>

              {/* Фильтры */}
              <ActivityFilters filters={filters} onFiltersChange={setFilters} />

              {/* Список активности */}
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                          <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {activity.user.name} {activity.user.surname}
                          </p>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full self-start sm:self-auto">
                            {activity.type}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">{activity.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500">
                          <span className="truncate">{activity.user.email}</span>
                          <span className="flex-shrink-0">{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-base sm:text-lg">Нет данных об активности</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">Попробуйте изменить фильтры или подождите новых событий</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <ActivityStatistics
              stats={stats}
              activities={activities}
              loading={loading}
            />
          )}
        </div>
      </div>

    </div>
  );
};
