import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopPanel from './TopPanel';
import { ActivityTestButton } from './ActivityTestButton';
import RealtimeChatWidget from './realtime-assistant-widget/RealtimeChatWidget';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { collapsed: boolean };
      if (typeof detail?.collapsed === 'boolean') setSidebarCollapsed(detail.collapsed);
    };
    window.addEventListener('sidebar:collapse', handler);
    return () => window.removeEventListener('sidebar:collapse', handler);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 w-full overflow-hidden">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div
        className={`flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}
      >
        <TopPanel onToggleSidebar={toggleSidebar} />
        <main className="flex-1 bg-gray-50 p-0 sm:p-4 lg:p-6 overflow-x-hidden min-w-0 transition-all duration-300 ease-in-out">
          <Outlet />
          <RealtimeChatWidget />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
