import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext, NotificationContextType } from '../contexts/NotificationContext';
import { useToast } from '../hooks/useToast';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  
  // Обновляем ref при изменении toast
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Обновляем ref при изменении eventSource
  useEffect(() => {
    eventSourceRef.current = eventSource;
  }, [eventSource]);

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
    if (!user || eventSourceRef.current) return;

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
          console.log('New notification received via SSE:', notification);

          // Добавляем новое уведомление в начало списка
          setNotifications(prev => {
            console.log('Current notifications before update:', prev.length);
            const newList = [notification, ...prev];
            console.log('Updated notifications list:', newList.length);
            return newList;
          });
          setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log('Updated unread count:', newCount);
            return newCount;
          });

          // Показать тост уведомление
          toastRef.current.info(`🔔 ${notification.message}`, 5000);

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
            setupSSEConnectionRef.current();
          }
        }, 5000);
      };

      setEventSource(es);
    } catch (error) {
      console.error('Error setting up SSE connection:', error);
    }
  }, [user]);

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

  const setupSSEConnectionRef = useRef(setupSSEConnection);
  
  // Обновляем ref при изменении setupSSEConnection
  useEffect(() => {
    setupSSEConnectionRef.current = setupSSEConnection;
  }, [setupSSEConnection]);
  
  // Эффект для инициализации
  useEffect(() => {
    if (user) {
      loadNotifications();
      requestNotificationPermission();
      setupSSEConnectionRef.current();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        setEventSource(null);
        setConnected(false);
      }
    };
  }, [user, loadNotifications, requestNotificationPermission]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

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
