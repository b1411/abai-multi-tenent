import React, { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { Notification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { BellOff, Check, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

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
    case 'SCHEDULE_CANCEL':
      return '❌';
    case 'SCHEDULE_RESCHEDULE':
      return '🗓️';
    case 'SCHEDULE_SUBSTITUTE':
      return '👨‍🏫';
    case 'VACATION_REQUEST_CREATED':
      return '🏖️';
    case 'VACATION_SUBSTITUTE_ASSIGNED':
      return '🔁';
    case 'LOW_KPI_WARNING':
      return '⚠️';
    case 'NEW_MESSAGE':
      return '💬';
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
      return 'Оценка ребёнка (урок)';
    case 'CHILD_HOMEWORK_GRADE':
      return 'Оценка ребёнка (ДЗ)';
    case 'NEW_HOMEWORK':
      return 'Новое ДЗ';
    case 'NEW_QUIZ':
      return 'Новый тест';
    case 'QUIZ_RESULT':
      return 'Результат теста';
    case 'PAYMENT_DUE':
      return 'Оплата';
    case 'LESSON_CANCELLED':
    case 'SCHEDULE_CANCEL':
      return 'Отмена занятия';
    case 'SCHEDULE_RESCHEDULE':
      return 'Перенос занятия';
    case 'SCHEDULE_SUBSTITUTE':
      return 'Замена преподавателя';
    case 'VACATION_REQUEST_CREATED':
      return 'Заявка на отпуск';
    case 'VACATION_SUBSTITUTE_ASSIGNED':
      return 'Назначен замещающий';
    case 'LOW_KPI_WARNING':
      return 'Низкий KPI';
    case 'NEW_MESSAGE':
      return 'Новое сообщение';
    default:
      return 'Уведомление';
  }
};

const NotificationsPage: React.FC = () => {
  const { notifications: ctxList, unreadCount, loading, markAsRead, markAllAsRead, refreshNotifications, connected } = useNotifications();

  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Инициализация страницы: подгрузка первой страницы с метаданными
  const loadPage = useCallback(async (p: number, replace = false) => {
    const res = await notificationService.getMyNotifications(p, limit);
    setTotalPages(res.meta.totalPages);
    setPage(res.meta.currentPage);
    setItems((prev) => (replace ? res.data : [...prev, ...res.data.filter(n => !prev.some(pn => pn.id === n.id))]));
  }, [limit]);

  useEffect(() => {
    // Обновляем контекст (необязательно, но актуализирует счётчики)
    refreshNotifications();
    loadPage(1, true);
  }, []);

  // Реактивные добавления из контекста (SSE): prepend, если ещё нет в списке
  useEffect(() => {
    if (!ctxList || ctxList.length === 0) return;
    setItems((prev) => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnTop = ctxList.filter(n => !existingIds.has(n.id));
      return newOnTop.length > 0 ? [...newOnTop, ...prev] : prev;
    });
  }, [ctxList]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRowClick = async (n: Notification) => {
    if (!n.read) await markAsRead(n.id);
    if (n.url) window.location.href = n.url;
  };

  return (
    <div className="px-3 py-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Уведомления</h1>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{connected ? 'В реальном времени' : 'Оффлайн'}</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              aria-label="Отметить все как прочитанные"
              title="Отметить все как прочитанные"
            >
              <CheckCheck className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Отметить все как прочитанные</span>
            </button>
          )}
          <button
            onClick={() => loadPage(1, true)}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-60"
            disabled={loading}
            aria-label="Обновить"
            title="Обновить"
          >
            <Clock className={`w-5 h-5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Обновить</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading && items.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
            Загрузка...
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <BellOff className="w-8 h-8 mx-auto mb-2" />
            Нет уведомлений
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="text-lg sm:text-xl">{getNotificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide">{getNotificationTypeLabel(n.type)}</p>
                      {!n.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Отметить как прочитанное"
                        >
                          <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mt-1 leading-5">{n.message}</p>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && page < totalPages && (
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md disabled:opacity-50"
            >
              {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
