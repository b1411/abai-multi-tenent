import React, { useEffect, useState, useCallback, useContext } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext, NotificationContextType } from '../contexts/NotificationContext';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Загрузка уведомлений
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [notificationsData, unreadData] = await Promise.all([
        notificationService.getMyNotifications(1, 20),
        notificationService.getUnreadCount()
      ]);

      setNotifications(notificationsData.data);
      setUnreadCount(unreadData.count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Установка SSE соединения
  const setupSSEConnection = useCallback(() => {
    if (!user || eventSource) return;

    try {
      const token = localStorage.getItem('token');
      const es = notificationService.createNotificationStream(user.id, token || undefined);

      es.onopen = () => {
        console.log('Notification stream connected');
        setConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('New notification received:', notification);

          // Добавляем новое уведомление в начало списка
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Можно добавить звуковое уведомление или системное уведомление
          showBrowserNotification(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      es.onerror = (error) => {
        console.error('SSE error:', error);
        setConnected(false);

        // Переподключение через 5 секунд
        setTimeout(() => {
          if (es.readyState === EventSource.CLOSED) {
            setupSSEConnection();
          }
        }, 5000);
      };

      setEventSource(es);
    } catch (error) {
      console.error('Error setting up SSE connection:', error);
    }
  }, [user, eventSource]);

  // Показать системное уведомление браузера
  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Новое уведомление', {
        body: notification.message,
        icon: '/logo rfm.png',
        tag: notification.id.toString(),
      });
    }
  };

  // Запрос разрешения на показ уведомлений
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Отметить уведомление как прочитанное
  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id);

      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Отметить все уведомления как прочитанные
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Обновить уведомления
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Эффект для инициализации
  useEffect(() => {
    if (user) {
      loadNotifications();
      requestNotificationPermission();
      setupSSEConnection();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
        setConnected(false);
      }
    };
  }, [user]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    connected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
