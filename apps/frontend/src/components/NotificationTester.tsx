import React, { useState } from 'react';
import { notificationService } from '../services/notificationService';

export function NotificationTester() {
  const [userId, setUserId] = useState('1');
  const [message, setMessage] = useState('Тестовое уведомление');
  const [type, setType] = useState('TEST_NOTIFICATION');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('❌ Токен не найден. Авторизуйтесь сначала.');
        return;
      }

      // Отправляем запрос на создание уведомления
      const response = await fetch(`${import.meta.env.VITE_API_URL}notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          type,
          message,
          url: '/notifications'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Уведомление отправлено! ID: ${data.id}`);
      } else {
        const error = await response.text();
        setResult(`❌ Ошибка: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const testBulkNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('❌ Токен не найден. Авторизуйтесь сначала.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}notifications/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: [1, 2, 3], // Отправляем нескольким пользователям
          type: 'BULK_TEST',
          message: 'Тестовое массовое уведомление',
          url: '/dashboard'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Массовая отправка успешна! Отправлено: ${data.length} уведомлений`);
      } else {
        const error = await response.text();
        setResult(`❌ Ошибка: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">🧪 Тестирование уведомлений</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID пользователя
          </label>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип уведомления
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TEST_NOTIFICATION">Тестовое уведомление</option>
            <option value="NEW_HOMEWORK">Новое ДЗ</option>
            <option value="NEW_QUIZ">Новый тест</option>
            <option value="QUIZ_RESULT">Результат теста</option>
            <option value="NEW_MESSAGE">Новое сообщение</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сообщение
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={sendTestNotification}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить уведомление'}
          </button>

          <button
            onClick={testBulkNotifications}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Массовая отправка'}
          </button>
        </div>

        {result && (
          <div className={`p-3 rounded-md ${result.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium mb-2">📋 Инструкция:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Убедитесь, что вы авторизованы</li>
          <li>2. Введите ID пользователя (1, 2, 3...)</li>
          <li>3. Выберите тип уведомления</li>
          <li>4. Нажмите "Отправить уведомление"</li>
          <li>5. Проверьте панель уведомлений в шапке</li>
          <li>6. Или перейдите на страницу /notifications</li>
        </ol>
      </div>
    </div>
  );
}