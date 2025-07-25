import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Типы данных
interface OnlineUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  lastSeen: string;
  currentPage?: string;
}

interface ActivityItem {
  id: string;
  user: {
    name: string;
    surname: string;
    email: string;
  };
  type: string;
  action: string;
  description: string;
  createdAt: string;
}

interface ActivityStats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    totalActivities: number;
  };
  dailyStats?: any[];
}

interface ActivityFilters {
  userId?: number;
  days: number;
  activityType?: string;
}

export const useActivityMonitoring = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация WebSocket соединения
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Токен аутентификации не найден');
      return;
    }

    let apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/');
    apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl; // Удаляем слеш в конце

    const newSocket = io(`${apiUrl}/activity-monitoring`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    // Обработчики событий
    newSocket.on('connect', () => {
      console.log('Connected to activity monitoring');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from activity monitoring');
      setConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Activity monitoring connection confirmed:', data);
    });

    newSocket.on('error', (errorData) => {
      console.error('WebSocket error:', errorData);
      setError(errorData.message || 'Ошибка подключения');
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
      setActivities(prev => [activity, ...prev.slice(0, 49)]); // Добавляем новую активность в начало
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
  }, []);

  // Запрос онлайн пользователей
  const refreshOnlineUsers = useCallback(() => {
    if (socket && connected) {
      socket.emit('get-online-users');
    }
  }, [socket, connected]);

  // Запрос истории активности
  const refreshActivities = useCallback((filters: ActivityFilters) => {
    if (socket && connected) {
      setLoading(true);
      socket.emit('get-activity', {
        userId: filters.userId,
        limit: 50,
        offset: 0,
      });
      // loading будет сброшен при получении ответа
      setTimeout(() => setLoading(false), 5000); // timeout через 5 секунд
    }
  }, [socket, connected]);

  // Запрос статистики
  const refreshStats = useCallback((days: number = 7) => {
    if (socket && connected) {
      setLoading(true);
      socket.emit('get-stats', { days });
      // loading будет сброшен при получении ответа
      setTimeout(() => setLoading(false), 5000); // timeout через 5 секунд
    }
  }, [socket, connected]);

  // Экспорт данных активности
  const exportActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен не найден');
      }

      // Получаем данные через REST API для экспорта
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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

  // Автоматическое обновление при подключении
  useEffect(() => {
    if (connected && socket) {
      refreshOnlineUsers();
      refreshStats();
      refreshActivities({ days: 7 });
    }
  }, [connected, socket, refreshOnlineUsers, refreshStats, refreshActivities]);

  return {
    connected,
    onlineUsers,
    activities,
    stats,
    loading,
    error,
    refreshOnlineUsers,
    refreshActivities,
    refreshStats,
    exportActivities,
  };
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
