import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock, BarChart3, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useActivity } from '../contexts/ActivityContext';
import { ActivityFilters } from '../components/activity-monitoring/ActivityFilters';
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold">Мониторинг активности</h1>
            <div className="flex items-center space-x-2">
              {connected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
                {connected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
          </div>
          <p className="text-gray-600">
            Отслеживание активности пользователей в системе
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            onClick={exportActivities}
            disabled={!connected}
          >
            Экспорт данных
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
            onClick={refreshOnlineUsers}
            disabled={!connected}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего пользователей</p>
              <p className="text-2xl font-bold">{stats?.summary?.totalUsers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Онлайн сейчас</p>
              <p className="text-2xl font-bold text-green-600">{stats?.summary?.activeUsers || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Активных сессий</p>
              <p className="text-2xl font-bold">{stats?.summary?.totalSessions || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего действий</p>
              <p className="text-2xl font-bold">{stats?.summary?.totalActivities || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('online')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'online'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Онлайн пользователи ({onlineUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              История активности
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Статистика
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'online' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Пользователи онлайн</h3>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : onlineUsers.length > 0 ? (
                <div className="space-y-3">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.name} {user.surname}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Роль: {user.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">Онлайн</p>
                        {user.currentPage && (
                          <p className="text-xs text-gray-500">{user.currentPage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Нет пользователей онлайн</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">История активности</h3>
              
              {/* Фильтры */}
              <ActivityFilters filters={filters} onFiltersChange={setFilters} />
              
              {/* Список активности */}
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">{activity.user.name} {activity.user.surname}</p>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {activity.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{activity.user.email}</span>
                          <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Нет данных об активности</p>
                  <p className="text-gray-400 text-sm">Попробуйте изменить фильтры или подождите новых событий</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Подробная статистика</h3>
              <p className="text-gray-500">Графики и детальная аналитика будут добавлены позже</p>
            </div>
          )}
        </div>
      </div>

      {/* Тестовая панель для отладки (только в development) */}
      {import.meta.env.DEV && <ActivityTestPanel />}
    </div>
  );
};
