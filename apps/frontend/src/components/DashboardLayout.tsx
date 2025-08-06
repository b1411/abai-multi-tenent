import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopPanel from './TopPanel';
import { ActivityTestButton } from './ActivityTestButton';
import RealtimeChatWidget from './realtime-assistant-widget/RealtimeChatWidget';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        <TopPanel onToggleSidebar={toggleSidebar} />
        <main className="flex-1 bg-gray-50 p-0 sm:p-4 lg:p-6 overflow-x-auto">
          <Outlet />
          <RealtimeChatWidget />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
