import React, { useState } from 'react';
import { SecurityGuard } from '../../types/security';
import { Shield, Clock, MapPin, MessageSquare, CheckCircle, XCircle, Coffee } from 'lucide-react';

interface SecurityShiftProps {
  guards: SecurityGuard[];
  onUpdateGuardStatus: (guardId: string, status: SecurityGuard['status'], comments?: string) => void;
}

const SecurityShift: React.FC<SecurityShiftProps> = ({ guards, onUpdateGuardStatus }) => {
  const [selectedGuard, setSelectedGuard] = useState<SecurityGuard | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');

  const getStatusColor = (status: SecurityGuard['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SecurityGuard['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'on_break':
        return <Coffee className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: SecurityGuard['status']) => {
    switch (status) {
      case 'present':
        return 'На месте';
      case 'absent':
        return 'Отсутствует';
      case 'on_break':
        return 'На перерыве';
      default:
        return 'Неизвестно';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Только что';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const handleStatusChange = (guard: SecurityGuard, newStatus: SecurityGuard['status']) => {
    if (newStatus === 'absent' || (newStatus === 'on_break' && guard.status === 'present')) {
      setSelectedGuard(guard);
      setShowCommentModal(true);
    } else {
      onUpdateGuardStatus(guard.id, newStatus);
    }
  };

  const handleCommentSubmit = () => {
    if (selectedGuard) {
      const newStatus = selectedGuard.status === 'present' ? 'on_break' : 'absent';
      onUpdateGuardStatus(selectedGuard.id, newStatus, comment);
      setShowCommentModal(false);
      setSelectedGuard(null);
      setComment('');
    }
  };

  const getShiftStats = () => {
    return {
      total: guards.length,
      present: guards.filter(g => g.status === 'present').length,
      absent: guards.filter(g => g.status === 'absent').length,
      onBreak: guards.filter(g => g.status === 'on_break').length
    };
  };

  const stats = getShiftStats();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Состав смены охраны
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Управление сменой и контроль присутствия
        </p>
      </div>

      {/* Статистика смены */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Всего</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{stats.present}</div>
            <div className="text-xs text-gray-600">На месте</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">{stats.onBreak}</div>
            <div className="text-xs text-gray-600">На перерыве</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{stats.absent}</div>
            <div className="text-xs text-gray-600">Отсутствуют</div>
          </div>
        </div>
      </div>

      {/* Список охранников */}
      <div className="p-4">
        {guards.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет активной смены</h3>
            <p className="mt-1 text-sm text-gray-500">
              Охранники не назначены на текущую смену
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {guards.map((guard) => (
              <div
                key={guard.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  {/* Информация об охраннике */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {guard.photo ? (
                        <img
                          src={guard.photo}
                          alt={`${guard.name} ${guard.surname}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium text-sm">
                          {guard.name[0]}{guard.surname[0]}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {guard.name} {guard.surname}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(guard.shiftStart)} - {formatTime(guard.shiftEnd)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {guard.post}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Последняя активность: {formatLastSeen(guard.lastSeen)}
                      </div>
                      {guard.comments && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          "{guard.comments}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Статус и управление */}
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(guard.status)}`}>
                      {getStatusIcon(guard.status)}
                      {getStatusText(guard.status)}
                    </div>
                    
                    {/* Кнопки управления статусом */}
                    <div className="flex gap-1">
                      {guard.status !== 'present' && (
                        <button
                          onClick={() => handleStatusChange(guard, 'present')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Отметить присутствие"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {guard.status === 'present' && (
                        <button
                          onClick={() => handleStatusChange(guard, 'on_break')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Отправить на перерыв"
                        >
                          <Coffee className="h-4 w-4" />
                        </button>
                      )}
                      
                      {guard.status !== 'absent' && (
                        <button
                          onClick={() => handleStatusChange(guard, 'absent')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Отметить отсутствие"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно для комментария */}
      {showCommentModal && selectedGuard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Изменение статуса охранника
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedGuard.name} {selectedGuard.surname}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите причину изменения статуса..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setSelectedGuard(null);
                  setComment('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCommentSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="p-4 border-t border-gray-200 bg-blue-50">
        <div className="flex items-center gap-2 text-blue-800">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-medium">
            Автоматическая отметка прибытия через Face ID включена
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecurityShift;
