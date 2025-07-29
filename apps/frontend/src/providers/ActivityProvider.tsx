import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ActivityContext,
  ActivityContextType,
  OnlineUser,
  ActivityItem,
  ActivityStats
} from '../contexts/ActivityContext';

interface ActivityProviderProps {
  children: React.ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Получение информации о текущем пользователе
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    console.log('ActivityProvider: Checking auth data', {
      hasToken: !!token,
      hasUser: !!userStr
    });

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('ActivityProvider: User data parsed', {
          userId: user.id,
          role: user.role
        });
        setCurrentUser(user);
        setIsAdmin(user.role === 'ADMIN');
      } catch (e) {
        console.error('ActivityProvider: Error parsing user data:', e);
      }
    } else {
      console.log('ActivityProvider: No auth data found, will not connect to WebSocket');
    }
  }, []);

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (!currentUser) {
      console.log('ActivityProvider: Skipping WebSocket connection - no current user');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('ActivityProvider: Skipping WebSocket connection - no token found');
      return;
    }

    console.log('ActivityProvider: All checks passed, creating WebSocket connection');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    console.log('ActivityProvider: Attempting WebSocket connection', {
      url: apiUrl,
      userId: currentUser.id,
      userRole: currentUser.role,
      isAdmin: currentUser.role === 'ADMIN',
      envApiUrl: import.meta.env.VITE_API_URL,
      token: token.substring(0, 20) + '...'
    });

    const newSocket = io(apiUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    console.log('ActivityProvider: Socket created', newSocket);

    // Обработчики событий
    newSocket.on('connect', () => {
      console.log('🟢 Connected to activity monitoring WebSocket');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from activity monitoring:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
      setError(`Ошибка подключения: ${error.message}`);
      setConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('✅ Activity monitoring connection confirmed:', data);
      // Обновляем статус админа на основе ответа сервера
      if (data.isAdmin !== undefined) {
        setIsAdmin(data.isAdmin);
      }
    });

    newSocket.on('error', (errorData) => {
      console.error('❌ WebSocket error:', errorData);
      setError(errorData.message || 'Ошибка подключения');
      setConnected(false);
    });

    newSocket.on('online-users-update', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('activity-update', (activityData) => {
      setActivities(activityData.activities || []);
    });

    newSocket.on('stats-update', (statsData: ActivityStats) => {
      setStats(statsData);
    });

    newSocket.on('new-activity', (activity: ActivityItem) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]);
    });

    newSocket.on('user-online', (data) => {
      console.log('User came online:', data);
    });

    newSocket.on('user-offline', (data) => {
      console.log('User went offline:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser]);

  // Функции для управления данными
  const updateCurrentPage = useCallback((page: string) => {
    if (socket && connected) {
      console.log('ActivityProvider: Sending page update to server:', page);
      // Отправляем информацию о текущей странице для обновления активности
      socket.emit('update-current-page', { page });
    } else {
      console.log('ActivityProvider: Cannot send page update - socket not connected', {
        hasSocket: !!socket,
        connected
      });
    }
  }, [socket, connected]);

  const refreshOnlineUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl; // Удаляем слеш в конце

      console.log('🔄 Fetching online users from API...');
      const response = await fetch(`${apiUrl}activity-monitoring/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Online users received:', data);
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('❌ Error fetching online users:', error);
      setError(`Ошибка получения онлайн пользователей: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const refreshActivities = useCallback(async (filters?: any) => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl; // Удаляем слеш в конце

      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
        ...(filters?.userId && { userId: filters.userId.toString() }),
      });

      console.log('🔄 Fetching activities from API...', { filters });
      const response = await fetch(`${apiUrl}/activity-monitoring/user-activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Activities received:', data);
      setActivities(data.activities || []);
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      setError(`Ошибка получения активности: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const refreshStats = useCallback(async (days: number = 7) => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl; // Удаляем слеш в конце

      console.log('🔄 Fetching stats from API...', { days });
      const response = await fetch(`${apiUrl}/activity-monitoring/stats?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Stats received:', data);
      setStats(data || null);
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setError(`Ошибка получения статистики: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const exportActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен не найден');
      }

      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl; // Удаляем слеш в конце

      const response = await fetch(`${apiUrl}/activity-monitoring/user-activity?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка получения данных для экспорта');
      }

      const data = await response.json();

      // Создаем CSV
      const csv = convertToCSV(data.activities);
      downloadCSV(csv, 'activity-export.csv');
    } catch (error) {
      console.error('Export error:', error);
      setError('Ошибка экспорта данных');
    }
  }, []);

  // Автоматическое обновление текущей страницы
  useEffect(() => {
    if (connected && socket) {
      const currentPath = window.location.pathname;
      updateCurrentPage(currentPath);
    }
  }, [connected, socket, updateCurrentPage]);

  // Отслеживание изменений маршрута
  useEffect(() => {
    console.log('ActivityProvider: Setting up route change listeners', {
      connected,
      hasSocket: !!socket
    });

    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      console.log('ActivityProvider: Route changed to:', currentPath);

      if (connected && socket) {
        updateCurrentPage(currentPath);
      } else {
        console.log('ActivityProvider: Skipping route update - not connected', {
          connected,
          hasSocket: !!socket
        });
      }
    };

    // Слушаем изменения истории браузера
    window.addEventListener('popstate', handleRouteChange);

    // Отслеживаем программные изменения маршрута
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      console.log('ActivityProvider: history.pushState called with:', args[2]);
      originalPushState.apply(history, args);
      handleRouteChange();
    };

    history.replaceState = function (...args) {
      console.log('ActivityProvider: history.replaceState called with:', args[2]);
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    return () => {
      console.log('ActivityProvider: Cleaning up route change listeners');
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [connected, socket, updateCurrentPage]);

  // Автоматическое обновление данных для админов
  useEffect(() => {
    if (connected && socket && isAdmin) {
      refreshOnlineUsers();
      refreshStats();
      refreshActivities();
    }
  }, [connected, socket, isAdmin, refreshOnlineUsers, refreshStats, refreshActivities]);

  const contextValue: ActivityContextType = {
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
    updateCurrentPage,
  };

  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  );
};

// Вспомогательные функции
function convertToCSV(data: ActivityItem[]): string {
  if (!data || data.length === 0) return '';

  const headers = ['Пользователь', 'Email', 'Тип действия', 'Описание', 'Дата'];
  const rows = data.map(activity => [
    `${activity.user.name} ${activity.user.surname}`,
    activity.user.email,
    activity.type,
    activity.description,
    new Date(activity.createdAt).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
