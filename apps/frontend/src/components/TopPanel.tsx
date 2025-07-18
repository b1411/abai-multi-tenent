import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, Search } from 'lucide-react';

const TopPanel: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center flex-1">
          <div className="relative max-w-lg w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
              3
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right">
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
