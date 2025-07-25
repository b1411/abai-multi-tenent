import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Menu } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { ActivityIndicator, ActivityStatusBadge } from './activity-monitoring/ActivityIndicator';

interface TopPanelProps {
  onToggleSidebar: () => void;
}

const TopPanel: React.FC<TopPanelProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center flex-1">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="relative max-w-lg w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Поиск..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Индикатор активности для всех пользователей */}
          <ActivityIndicator showDetails={false} className="hidden sm:flex" />
          
          {/* Статус бейдж для админов */}
          <ActivityStatusBadge />
          
          <NotificationPanel />

          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.name} {user?.surname}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.[0]}{user?.surname?.[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopPanel;
