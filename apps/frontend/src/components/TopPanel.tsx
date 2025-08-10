import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Menu } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { ActivityIndicator, ActivityStatusBadge } from './activity-monitoring/ActivityIndicator';
import StudentProfileWidget from './StudentProfileWidget';

interface TopPanelProps {
  onToggleSidebar: () => void;
}

const TopPanel: React.FC<TopPanelProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center flex-1 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-3 text-gray-400 hover:text-gray-600 mr-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* <div className="relative max-w-lg w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Поиск..."
              className="block w-full pl-10 pr-3 py-3 text-base min-h-[48px] border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:py-2 sm:text-sm sm:min-h-[40px]"
            />
          </div> */}
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4 ml-2 lg:ml-4">
          <NotificationPanel />

          {/* Виджет профиля студента */}
          {user?.role === 'STUDENT' && (
            <StudentProfileWidget variant="header" className="hidden lg:flex" />
          )}

          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                {user?.name} {user?.surname}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 touch-manipulation">
              <span className="text-white text-base sm:text-sm font-medium">
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
