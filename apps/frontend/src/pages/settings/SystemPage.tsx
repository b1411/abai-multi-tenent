import React, { useState } from 'react';
import {
  FaCog,
  FaSave,
  FaDatabase,
  FaEnvelope,
  FaBell,
  FaGlobe,
  FaLock,
  FaServer,
  FaDownload
} from 'react-icons/fa';

interface SystemSettings {
  maintenance: boolean;
  debugMode: boolean;
  timezone: string;
  dateFormat: string;
  backupEnabled: boolean;
  backupFrequency: string;
  emailServer: string;
  emailPort: string;
  emailEncryption: 'none' | 'tls' | 'ssl';
  notificationsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  sessionTimeout: number;
  maxUploadSize: number;
  defaultLanguage: string;
}

const initialSettings: SystemSettings = {
  maintenance: false,
  debugMode: false,
  timezone: 'Asia/Almaty',
  dateFormat: 'DD.MM.YYYY',
  backupEnabled: true,
  backupFrequency: 'daily',
  emailServer: 'smtp.school.edu',
  emailPort: '587',
  emailEncryption: 'tls',
  notificationsEnabled: true,
  pushNotifications: true,
  emailNotifications: true,
  sessionTimeout: 30,
  maxUploadSize: 10,
  defaultLanguage: 'ru'
};

const SystemPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'notifications' | 'security' | 'maintenance'>('general');

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Системные настройки</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FaSave /> Сохранить изменения
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow">
            <button
              className={`w-full p-4 flex items-center gap-3 ${
                activeTab === 'general' ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={() => setActiveTab('general')}
            >
              <FaCog />
              <span>Общие</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 ${
                activeTab === 'email' ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={() => setActiveTab('email')}
            >
              <FaEnvelope />
              <span>Почта</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell />
              <span>Уведомления</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 ${
                activeTab === 'security' ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock />
              <span>Безопасность</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 ${
                activeTab === 'maintenance' ? 'bg-blue-50 text-blue-600' : ''
              }`}
              onClick={() => setActiveTab('maintenance')}
            >
              <FaServer />
              <span>Обслуживание</span>
            </button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Общие настройки</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Часовой пояс
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    >
                      <option value="Asia/Almaty">Алматы (UTC+6)</option>
                      <option value="Asia/Nur-Sultan">Нур-Султан (UTC+6)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Формат даты
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={settings.dateFormat}
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                    >
                      <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Язык по умолчанию
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={settings.defaultLanguage}
                      onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                    >
                      <option value="ru">Русский</option>
                      <option value="kk">Қазақша</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Максимальный размер загрузки (МБ)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={settings.maxUploadSize}
                      onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Настройки почты</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP сервер
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={settings.emailServer}
                      onChange={(e) => handleSettingChange('emailServer', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP порт
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={settings.emailPort}
                      onChange={(e) => handleSettingChange('emailPort', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Шифрование
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={settings.emailEncryption}
                      onChange={(e) => handleSettingChange('emailEncryption', e.target.value)}
                    >
                      <option value="none">Нет</option>
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Настройки уведомлений</h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={settings.notificationsEnabled}
                      onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                    />
                    <span>Включить уведомления</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                    <span>Push-уведомления</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                    <span>Email-уведомления</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Настройки безопасности</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тайм-аут сессии (минуты)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Обслуживание системы</h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={settings.maintenance}
                      onChange={(e) => handleSettingChange('maintenance', e.target.checked)}
                    />
                    <span>Режим обслуживания</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={settings.debugMode}
                      onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                    />
                    <span>Режим отладки</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Частота резервного копирования
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={settings.backupFrequency}
                      onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    >
                      <option value="hourly">Каждый час</option>
                      <option value="daily">Ежедневно</option>
                      <option value="weekly">Еженедельно</option>
                      <option value="monthly">Ежемесячно</option>
                    </select>
                  </div>
                  <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded flex items-center gap-2">
                    <FaDownload /> Скачать резервную копию
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPage; 