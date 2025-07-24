import React, { useState } from 'react';
import { FaCog, FaSave, FaEnvelope, FaBell, FaLock, FaServer, FaDownload } from 'react-icons/fa';
import { useSystemSettings } from '../hooks/useSystem';
import { SystemSettings } from '../types/system';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

type TabType = 'general' | 'email' | 'notifications' | 'security' | 'maintenance';

const SystemSettingsPage: React.FC = () => {
  const { settings, loading, error, updateSettings, downloadBackup } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings(formData);
      setSaveMessage('Настройки успешно сохранены');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('Ошибка сохранения настроек');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await downloadBackup();
    } catch (err) {
      console.error('Ошибка скачивания резервной копии:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

      if (error) {
        return (
          <div className="p-6">
            <Alert variant="error" message={error} />
          </div>
        );
      }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Системные настройки</h1>
        <div className="flex gap-2">
          {saveMessage && (
            <Alert 
              variant={saveMessage.includes('Ошибка') ? 'error' : 'success'} 
              message={saveMessage}
              className="mr-4"
            />
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isSaving ? <Spinner size="sm" /> : <FaSave />}
            Сохранить изменения
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow">
            <button
              className={`w-full p-4 flex items-center gap-3 text-left ${
                activeTab === 'general' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('general')}
            >
              <FaCog />
              <span>Общие</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 text-left ${
                activeTab === 'email' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('email')}
            >
              <FaEnvelope />
              <span>Почта</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 text-left ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell />
              <span>Уведомления</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 text-left ${
                activeTab === 'security' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock />
              <span>Безопасность</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 text-left ${
                activeTab === 'maintenance' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'hover:bg-gray-50'
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
                      className="w-full p-2 border rounded-lg"
                      value={formData.timezone || ''}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    >
                      <option value="Asia/Almaty">Алматы (UTC+6)</option>
                      <option value="Asia/Nur-Sultan">Нур-Султан (UTC+6)</option>
                      <option value="Europe/Moscow">Москва (UTC+3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Формат даты
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={formData.dateFormat || ''}
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
                      className="w-full p-2 border rounded-lg"
                      value={formData.defaultLanguage || ''}
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
                      className="w-full p-2 border rounded-lg"
                      value={formData.maxUploadSize || ''}
                      onChange={(e) => handleSettingChange('maxUploadSize', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
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
                      className="w-full p-2 border rounded-lg"
                      value={formData.emailServer || ''}
                      onChange={(e) => handleSettingChange('emailServer', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP порт
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={formData.emailPort || ''}
                      onChange={(e) => handleSettingChange('emailPort', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Шифрование
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={formData.emailEncryption || ''}
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
                      checked={formData.notificationsEnabled || false}
                      onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                    />
                    <span>Включить уведомления</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.pushNotifications || false}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                    <span>Push-уведомления</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.emailNotifications || false}
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
                      className="w-full p-2 border rounded-lg"
                      value={formData.sessionTimeout || ''}
                      onChange={(e) => handleSettingChange('sessionTimeout', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
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
                      checked={formData.maintenance || false}
                      onChange={(e) => handleSettingChange('maintenance', e.target.checked)}
                    />
                    <span>Режим обслуживания</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.debugMode || false}
                      onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                    />
                    <span>Режим отладки</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.backupEnabled || false}
                      onChange={(e) => handleSettingChange('backupEnabled', e.target.checked)}
                    />
                    <span>Автоматическое резервное копирование</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Частота резервного копирования
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={formData.backupFrequency || ''}
                      onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    >
                      <option value="hourly">Каждый час</option>
                      <option value="daily">Ежедневно</option>
                      <option value="weekly">Еженедельно</option>
                      <option value="monthly">Ежемесячно</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleDownloadBackup}
                    className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2"
                  >
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

export default SystemSettingsPage;
