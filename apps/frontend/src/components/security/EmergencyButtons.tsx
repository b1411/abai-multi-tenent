import React, { useState } from 'react';
import { EmergencyCall } from '../../types/security';
import { Phone, Users2, AlertTriangle, X, Check } from 'lucide-react';

interface EmergencyButtonsProps {
  onEmergencyCall: (type: EmergencyCall['type']) => void;
  recentCalls: EmergencyCall[];
}

const EmergencyButtons: React.FC<EmergencyButtonsProps> = ({ onEmergencyCall, recentCalls }) => {
  const [showConfirmation, setShowConfirmation] = useState<EmergencyCall['type'] | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const emergencyServices = [
    {
      type: 'police' as const,
      name: 'Полиция',
      number: '102',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Вызвать службу охраны порядка'
    },
    {
      type: 'ambulance' as const,
      name: 'Скорая помощь',
      number: '103',
      icon: Users2,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Вызвать медицинскую службу'
    }
  ];

  const handleEmergencyClick = (type: EmergencyCall['type']) => {
    setShowConfirmation(type);
  };

  const handleConfirm = async () => {
    if (!showConfirmation) return;
    
    setIsConfirming(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация вызова
      onEmergencyCall(showConfirmation);
      setShowConfirmation(null);
    } catch (error) {
      console.error('Ошибка при вызове экстренной службы:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(null);
    setIsConfirming(false);
  };

  const getCallStatusColor = (status: EmergencyCall['status']) => {
    switch (status) {
      case 'initiated':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCallStatusText = (status: EmergencyCall['status']) => {
    switch (status) {
      case 'initiated':
        return 'Инициирован';
      case 'confirmed':
        return 'Подтвержден';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return 'Неизвестно';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="h-5 w-5 text-red-600" />
          Экстренная связь
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Кнопки вызова экстренных служб
        </p>
      </div>

      <div className="p-4">
        {/* Кнопки экстренных служб */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {emergencyServices.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.type}
                onClick={() => handleEmergencyClick(service.type)}
                className={`${service.color} text-white p-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
                disabled={isConfirming}
              >
                <div className="flex items-center justify-center gap-4">
                  <Icon className="h-8 w-8" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">{service.number}</div>
                    <div className="text-lg font-medium">{service.name}</div>
                    <div className="text-sm opacity-90">{service.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* История вызовов */}
        {recentCalls.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Последние вызовы</h3>
            <div className="space-y-2">
              {recentCalls.slice(0, 3).map((call) => {
                const service = emergencyServices.find(s => s.type === call.type);
                return (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {service && <service.icon className="h-4 w-4 text-gray-600" />}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {service?.name || call.type} - {service?.number}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(call.timestamp)} • {call.initiatedBy}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${getCallStatusColor(call.status)}`}>
                      {getCallStatusText(call.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Подтвердите вызов экстренной службы
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                Вы действительно хотите вызвать{' '}
                <strong>
                  {emergencyServices.find(s => s.type === showConfirmation)?.name}
                </strong>
                ?
                <br />
                <span className="text-xs text-gray-500 mt-2 block">
                  Ложный вызов может повлечь за собой административную ответственность
                </span>
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  disabled={isConfirming}
                >
                  <X className="h-4 w-4" />
                  Отмена
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isConfirming ? 'Вызов...' : 'Подтвердить вызов'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Предупреждение */}
      <div className="p-4 border-t border-gray-200 bg-yellow-50">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-medium">
            Используйте только в случае реальной экстренной ситуации
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyButtons;
