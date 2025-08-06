import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { Notification } from '../types/notification';
import { Bell, BellOff, Check, CheckCheck, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface NotificationPanelProps {
  className?: string;
}

export function NotificationPanel({ className = '' }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    connected
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.url) {
      // Навигация по ссылке
      window.location.href = notification.url;
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LESSON_GRADE':
      case 'HOMEWORK_GRADE':
      case 'CHILD_LESSON_GRADE':
      case 'CHILD_HOMEWORK_GRADE':
        return '📝';
      case 'NEW_HOMEWORK':
        return '📚';
      case 'NEW_QUIZ':
        return '📊';
      case 'QUIZ_RESULT':
        return '🎯';
      case 'PAYMENT_DUE':
        return '💰';
      case 'LESSON_CANCELLED':
        return '❌';
      default:
        return '📢';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'LESSON_GRADE':
        return 'Оценка за урок';
      case 'HOMEWORK_GRADE':
        return 'Оценка за ДЗ';
      case 'CHILD_LESSON_GRADE':
        return 'Оценка ребенка';
      case 'CHILD_HOMEWORK_GRADE':
        return 'Оценка за ДЗ ребенка';
      case 'NEW_HOMEWORK':
        return 'Новое ДЗ';
      case 'NEW_QUIZ':
        return 'Новый тест';
      case 'QUIZ_RESULT':
        return 'Результат теста';
      case 'PAYMENT_DUE':
        return 'Оплата';
      case 'LESSON_CANCELLED':
        return 'Отмена урока';
      default:
        return 'Уведомление';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Кнопка уведомлений */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="w-6 h-6" />

        {/* Индикатор непрочитанных */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Индикатор подключения */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'
          }`} />
      </button>

      {/* Панель уведомлений */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Панель */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
                {connected ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                    Подключено
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500 text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                    Не подключено
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    title="Отметить все как прочитанные"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => refreshNotifications()}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={loading}
                  title="Обновить"
                >
                  <Clock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Список уведомлений */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Загрузка...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <BellOff className="w-8 h-8 mx-auto mb-2" />
                  Нет уведомлений
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Иконка типа уведомления */}
                        <div className="flex-shrink-0 text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Тип уведомления */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {getNotificationTypeLabel(notification.type)}
                            </p>

                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Отметить как прочитанное"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Сообщение */}
                          <p className="text-sm text-gray-900 mt-1 leading-5">
                            {notification.message}
                          </p>

                          {/* Время */}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ru
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Футер */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    // Переход на страницу всех уведомлений
                    window.location.href = '/notifications';
                    setIsOpen(false);
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Показать все уведомления
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
