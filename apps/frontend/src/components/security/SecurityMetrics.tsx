import React from 'react';
import { SecurityMetrics } from '../../types/security';
import { 
  Users, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  Shield, 
  Camera, 
  Clock,
  TrendingUp 
} from 'lucide-react';

interface SecurityMetricsProps {
  metrics: SecurityMetrics;
}

const SecurityMetricsComponent: React.FC<SecurityMetricsProps> = ({ metrics }) => {
  const getThreatLevelColor = (level: SecurityMetrics['activeThreatLevel']) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getThreatLevelText = (level: SecurityMetrics['activeThreatLevel']) => {
    switch (level) {
      case 'low':
        return 'Низкий';
      case 'medium':
        return 'Средний';
      case 'high':
        return 'Высокий';
      case 'critical':
        return 'Критический';
      default:
        return 'Неизвестно';
    }
  };

  const getCameraStatusColor = () => {
    const percentage = (metrics.camerasOnline / metrics.camerasTotal) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGuardStatusColor = () => {
    const percentage = (metrics.guardsPresent / metrics.guardsTotal) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Метрики безопасности
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Основные показатели системы в реальном времени
        </p>
      </div>

      <div className="p-4">
        {/* Основные метрики */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Люди в здании */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">В здании</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalPeopleInBuilding}</p>
                <p className="text-xs text-blue-600 mt-1">человек</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Активные тревоги */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Активные тревоги</p>
                <p className="text-2xl font-bold text-red-900">{metrics.activeAlerts}</p>
                <p className="text-xs text-red-600 mt-1">событий</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Входы сегодня */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Входы сегодня</p>
                <p className="text-2xl font-bold text-green-900">{metrics.todayEntries}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600">проходов</p>
                </div>
              </div>
              <ArrowUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Выходы сегодня */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Выходы сегодня</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.todayExits}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDown className="h-3 w-3 text-orange-600" />
                  <p className="text-xs text-orange-600">проходов</p>
                </div>
              </div>
              <ArrowDown className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Уровень угрозы */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Текущий уровень угрозы</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getThreatLevelColor(metrics.activeThreatLevel)}`}>
              {getThreatLevelText(metrics.activeThreatLevel)}
            </div>
          </div>
          
          {/* Индикатор уровня угрозы */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                metrics.activeThreatLevel === 'low' ? 'bg-green-500 w-1/4' :
                metrics.activeThreatLevel === 'medium' ? 'bg-yellow-500 w-2/4' :
                metrics.activeThreatLevel === 'high' ? 'bg-orange-500 w-3/4' :
                'bg-red-500 w-full'
              }`}
            />
          </div>
        </div>

        {/* Статус систем */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Статус камер */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Камеры видеонаблюдения</span>
              </div>
              <span className={`text-sm font-medium ${getCameraStatusColor()}`}>
                {metrics.camerasOnline}/{metrics.camerasTotal}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getCameraStatusColor() === 'text-green-600' ? 'bg-green-500' :
                  getCameraStatusColor() === 'text-yellow-600' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(metrics.camerasOnline / metrics.camerasTotal) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((metrics.camerasOnline / metrics.camerasTotal) * 100)}% в сети
            </p>
          </div>

          {/* Статус охраны */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Служба охраны</span>
              </div>
              <span className={`text-sm font-medium ${getGuardStatusColor()}`}>
                {metrics.guardsPresent}/{metrics.guardsTotal}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getGuardStatusColor() === 'text-green-600' ? 'bg-green-500' :
                  getGuardStatusColor() === 'text-yellow-600' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(metrics.guardsPresent / metrics.guardsTotal) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((metrics.guardsPresent / metrics.guardsTotal) * 100)}% на месте
            </p>
          </div>
        </div>

        {/* Последний инцидент */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Последний инцидент</span>
          </div>
          <p className="text-sm text-gray-600">
            {metrics.lastIncident || 'Инциденты отсутствуют'}
          </p>
        </div>
      </div>

      {/* Статус обновления */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Обновлено в реальном времени</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Система активна
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecurityMetricsComponent;
