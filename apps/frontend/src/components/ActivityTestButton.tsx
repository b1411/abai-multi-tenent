import React from 'react';
import { useActivity } from '../contexts/ActivityContext';

export const ActivityTestButton: React.FC = () => {
  const { connected, updateCurrentPage } = useActivity();

  const handleTestClick = () => {
    console.log('ActivityTestButton: Test button clicked');
    const testPage = `/test-page-${Date.now()}`;
    updateCurrentPage(testPage);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleTestClick}
        disabled={!connected}
        className={`px-4 py-2 rounded-lg text-white font-medium ${
          connected 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {connected ? 'Тест активности' : 'Не подключено'}
      </button>
      <div className="text-xs text-gray-500 mt-1 text-center">
        {connected ? 'Подключено' : 'Отключено'}
      </div>
    </div>
  );
};
