import React from 'react';
import { Wifi, WifiOff, Users, Activity } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';

interface ActivityIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { connected, onlineUsers, isAdmin } = useActivity();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Индикатор подключения - показываем всем */}
      <div className="flex items-center space-x-1">
        {connected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-xs ${connected ? 'text-green-600' : 'text-red-600'}`}>
          {connected ? 'Система активна' : 'Система отключена'}
        </span>
      </div>

      {/* Детали (если включено и пользователь админ) */}
      {showDetails && connected && isAdmin && (
        <>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-blue-600">
              {onlineUsers.length} онлайн
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Компонент для показа в заголовке/навбаре
export const ActivityStatusBadge: React.FC = () => {
  const { connected, onlineUsers, isAdmin } = useActivity();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="relative">
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        connected 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {connected ? (
          <>
            <Wifi className="h-3 w-3 mr-1" />
            Мониторинг активен
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 mr-1" />
            Мониторинг отключен
          </>
        )}
      </div>
      
      {connected && onlineUsers.length > 0 && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {onlineUsers.length}
        </div>
      )}
    </div>
  );
};

// Всплывающее уведомление о новой активности
export const ActivityNotification: React.FC<{ 
  activity: any; 
  onClose: () => void;
}> = ({ activity, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Автоматически закрыть через 5 секунд
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Activity className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Новая активность
          </p>
          <p className="text-sm text-gray-600">
            {activity.user.name} {activity.user.surname}: {activity.description}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};
