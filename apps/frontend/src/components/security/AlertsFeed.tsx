import React from 'react';
import { SecurityAlert } from '../../types/security';
import { AlertTriangle, Eye, Flame, Users, Zap, Clock, MapPin } from 'lucide-react';

interface AlertsFeedProps {
  alerts: SecurityAlert[];
  onAlertClick: (alert: SecurityAlert) => void;
  onResolveAlert: (alertId: string) => void;
}

const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts, onAlertClick, onResolveAlert }) => {
  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'fight':
        return <Users className="h-5 w-5" />;
      case 'fire':
        return <Flame className="h-5 w-5" />;
      case 'weapon':
        return <AlertTriangle className="h-5 w-5" />;
      case 'unknown_face':
        return <Eye className="h-5 w-5" />;
      case 'crowd':
        return <Users className="h-5 w-5" />;
      case 'suspicious_behavior':
        return <Zap className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertTypeText = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'fight':
        return 'Обнаружена драка';
      case 'fire':
        return 'Обнаружен огонь';
      case 'weapon':
        return 'Обнаружено оружие';
      case 'unknown_face':
        return 'Неизвестное лицо';
      case 'crowd':
        return 'Скопление людей';
      case 'suspicious_behavior':
        return 'Подозрительное поведение';
      default:
        return 'Неизвестная тревога';
    }
  };

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'Критический';
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return 'Неизвестно';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Лента тревог и событий
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          События в реальном времени
        </p>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет активных тревог</h3>
            <p className="mt-1 text-sm text-gray-500">
              Система мониторинга работает в штатном режиме
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  alert.resolved ? 'opacity-60' : ''
                }`}
                onClick={() => onAlertClick(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getAlertTypeText(alert.type)}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                          {getSeverityText(alert.severity)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(alert.timestamp)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alert.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {alert.camera}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAlertClick(alert);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Подробнее
                  </button>
                  {!alert.resolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveAlert(alert.id);
                      }}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      Решено
                    </button>
                  )}
                  {alert.resolved && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Решено
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Статистика внизу */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-red-600">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <div className="text-xs text-gray-600">Активные</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">
              {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
            </div>
            <div className="text-xs text-gray-600">Приоритетные</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {alerts.filter(a => a.resolved).length}
            </div>
            <div className="text-xs text-gray-600">Решенные</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsFeed;
