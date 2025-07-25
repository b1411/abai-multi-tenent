import React, { useEffect, useState } from 'react';
import { useActivity } from '../contexts/ActivityContext';

export const ActivityTestPanel: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const {
    connected,
    onlineUsers,
    activities,
    stats,
    loading,
    error,
    isAdmin,
  } = useActivity();

  // Логирование состояния
  useEffect(() => {
    const log = `[${new Date().toLocaleTimeString()}] State update: connected=${connected}, isAdmin=${isAdmin}, error=${error}`;
    setLogs(prev => [log, ...prev.slice(0, 9)]);
  }, [connected, isAdmin, error]);

  // Проверка localStorage
  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Auth check:`,
      `  Token: ${token ? 'Present' : 'Missing'}`,
      `  User: ${userStr ? 'Present' : 'Missing'}`,
      ...prev.slice(0, 7)
    ]);

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setLogs(prev => [
          `  User ID: ${user.id}`,
          `  User Role: ${user.role}`,
          ...prev
        ]);
      } catch (e) {
        setLogs(prev => [`  Error parsing user: ${e}`, ...prev]);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border rounded-lg shadow-lg p-4 max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Activity Monitor Debug</h3>
        <button 
          onClick={() => setLogs([])}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2 rounded ${connected ? 'bg-green-100' : 'bg-red-100'}`}>
            Connected: {connected ? '✅' : '❌'}
          </div>
          <div className={`p-2 rounded ${isAdmin ? 'bg-blue-100' : 'bg-gray-100'}`}>
            Is Admin: {isAdmin ? '✅' : '❌'}
          </div>
        </div>

        <div className="p-2 bg-gray-50 rounded">
          Online Users: {onlineUsers.length} | Activities: {activities.length}
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <button 
          onClick={checkAuth}
          className="w-full p-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-700"
        >
          Check Auth Data
        </button>

        <div className="border-t pt-2">
          <div className="font-medium">Recent Logs:</div>
          <div className="space-y-1 mt-1 max-h-32 overflow-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-xs text-gray-600 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
