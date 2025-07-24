import React from 'react';
import { X, Calendar, Clock, MapPin, Users, Tag, Repeat } from 'lucide-react';
import { CalendarEvent } from '../services/calendarService';
import { formatDate } from '../utils/formatters';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: number) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !event) return null;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Встреча';
      case 'task':
        return 'Задача';
      case 'reminder':
        return 'Напоминание';
      case 'deadline':
        return 'Дедлайн';
      default:
        return 'Событие';
    }
  };

  const getRecurrenceText = (recurrence: any) => {
    if (!recurrence) return null;
    
    switch (recurrence.type) {
      case 'daily':
        return 'Каждый день';
      case 'weekly':
        return 'Каждую неделю';
      case 'monthly':
        return 'Каждый месяц';
      case 'yearly':
        return 'Каждый год';
      default:
        return 'Повторяется';
    }
  };

  const handleEdit = () => {
    onEdit(event);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить это событие?')) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Подробности события</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Color */}
          <div className="flex items-start gap-3">
            <div 
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: event.color || '#3B82F6' }}
            />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
          </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Описание</h4>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">
                  {formatDateTime(startDate)}
                  {startDate.toDateString() !== endDate.toDateString() && (
                    <span> - {formatDateTime(endDate)}</span>
                  )}
                </div>
              </div>
            </div>

            {!event.isAllDay && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div className="text-gray-600">
                  {formatTime(startDate)} - {formatTime(endDate)}
                </div>
              </div>
            )}

            {event.isAllDay && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div className="text-gray-600">Весь день</div>
              </div>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="text-gray-600">{event.location}</div>
            </div>
          )}

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-700">
                  Участники ({event.participants.length})
                </h4>
              </div>
              <div className="space-y-2 ml-8">
                {event.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {participant.user.name[0]}
                        </span>
                      </div>
                      <span className="text-gray-700">
                        {participant.user.name} {participant.user.surname}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      participant.status === 'ACCEPTED' 
                        ? 'bg-green-100 text-green-800'
                        : participant.status === 'DECLINED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {participant.status === 'ACCEPTED' ? 'Принял' :
                       participant.status === 'DECLINED' ? 'Отклонил' :
                       'Ожидает'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {event.isRecurring && (
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-gray-400" />
              <div className="text-gray-600">Повторяющееся событие</div>
            </div>
          )}

          {/* Created info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Создатель: {event.createdBy.name} {event.createdBy.surname}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Закрыть
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
          >
            Удалить
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Редактировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
