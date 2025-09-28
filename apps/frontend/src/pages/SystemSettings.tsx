import React, { useState, useEffect } from 'react';
import { FaCog, FaSave, FaEnvelope, FaBell, FaLock, FaServer, FaDownload, FaClock, FaPaperPlane, FaUsers, FaUser } from 'react-icons/fa';
import { useSystemSettings } from '../hooks/useSystem';
import { SystemSettings } from '../types/system';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { systemService } from '../services/systemService';
import { notificationService } from '../services/notificationService';
import { useToast } from '../hooks/useToast';

type TabType = 'general' | 'email' | 'notifications' | 'security' | 'maintenance' | 'academic';

// Типы уведомлений
const NOTIFICATION_TYPES = [
  { value: 'GENERAL', label: 'Общее уведомление' },
  { value: 'NEW_HOMEWORK', label: 'Новое домашнее задание' },
  { value: 'NEW_QUIZ', label: 'Новый тест' },
  { value: 'QUIZ_RESULT', label: 'Результат теста' },
  { value: 'PAYMENT_DUE', label: 'Оплата просрочена' },
  { value: 'LESSON_CANCELLED', label: 'Урок отменен' },
  { value: 'NEW_MESSAGE', label: 'Новое сообщение' },
  { value: 'VACATION_REQUEST_CREATED', label: 'Заявка на отпуск создана' },
  { value: 'VACATION_SUBSTITUTE_ASSIGNED', label: 'Замещающий назначен' },
  { value: 'CLASSROOM_BOOKING_CREATED', label: 'Бронирование аудитории создано' },
];

const SystemSettingsPage: React.FC = () => {
  const { settings, loading, error, updateSettings, downloadBackup } = useSystemSettings();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Состояние для академического часа
  const [academicHourDuration, setAcademicHourDuration] = useState<number>(45);
  const [academicHourLoading, setAcademicHourLoading] = useState<boolean>(false);

  // Состояние для редактора уведомлений
  const [notificationForm, setNotificationForm] = useState({
    type: 'GENERAL',
    recipientType: 'single', // 'single' или 'bulk'
    userIds: '',
    message: '',
    url: ''
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Загружаем продолжительность академического часа при переходе на вкладку
  useEffect(() => {
    if (activeTab === 'academic') {
      loadAcademicHourDuration();
    }
  }, [activeTab]);

  const loadAcademicHourDuration = async () => {
    try {
      setAcademicHourLoading(true);
      const result = await systemService.getAcademicHourDuration();
      setAcademicHourDuration(result.minutes);
    } catch (error) {
      console.error('Ошибка загрузки продолжительности академического часа:', error);
    } finally {
      setAcademicHourLoading(false);
    }
  };

  const handleSaveAcademicHour = async () => {
    if (academicHourDuration < 20 || academicHourDuration > 90) {
      setSaveMessage('Продолжительность академического часа должна быть от 20 до 90 минут');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      setAcademicHourLoading(true);
      await systemService.updateAcademicHourDuration(academicHourDuration);
      setSaveMessage('Продолжительность академического часа успешно обновлена');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaveMessage('Ошибка при сохранении настроек');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setAcademicHourLoading(false);
    }
  };

  // Функции для работы с уведомлениями
  const handleNotificationFormChange = (field: string, value: string) => {
    setNotificationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSendNotification = async () => {
    if (!notificationForm.message.trim()) {
      setNotificationMessage('Введите текст уведомления');
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    if (notificationForm.recipientType === 'single' && !notificationForm.userIds.trim()) {
      setNotificationMessage('Введите ID пользователя');
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    try {
      setSendingNotification(true);

      let userIds: number[] = [];
      if (notificationForm.recipientType === 'single') {
        userIds = notificationForm.userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else {
        // Для массовой рассылки можно добавить логику получения пользователей по роли
        // Пока оставим пустым массивом
        userIds = [];
      }

      if (userIds.length === 0) {
        setNotificationMessage('Не указаны получатели уведомления');
        setTimeout(() => setNotificationMessage(null), 3000);
        return;
      }

      // Отправляем уведомление через API
      await notificationService.createNotifications({
        userIds,
        type: notificationForm.type,
        message: notificationForm.message,
        url: notificationForm.url || undefined
      });

      // Показать тост об успешной отправке
      toast.success(`✅ Уведомление отправлено ${userIds.length} получателям`, 3000);

      setNotificationMessage('Уведомление успешно отправлено');
      setNotificationForm({
        type: 'GENERAL',
        recipientType: 'single',
        userIds: '',
        message: '',
        url: ''
      });
      setTimeout(() => setNotificationMessage(null), 3000);

    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
      setNotificationMessage('Ошибка при отправке уведомления');
      setTimeout(() => setNotificationMessage(null), 3000);
    } finally {
      setSendingNotification(false);
    }
  };

  const calculateExampleHours = (minutes: number) => {
    return systemService.convertMinutesToAcademicHours(minutes, academicHourDuration);
  };

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
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header - мобильная адаптация */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Системные настройки</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {saveMessage && (
            <Alert 
              variant={saveMessage.includes('Ошибка') ? 'error' : 'success'} 
              message={saveMessage}
              className="mb-2 sm:mb-0 sm:mr-4 text-xs sm:text-sm"
            />
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isSaving ? <Spinner size="sm" /> : <FaSave className="w-4 h-4" />}
            <span className="hidden sm:inline">Сохранить изменения</span>
            <span className="sm:hidden">Сохранить</span>
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden mb-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex overflow-x-auto">
            <button
              className={`flex-shrink-0 px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'general' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('general')}
            >
              <FaCog className="text-xs" />
              <span>Общие</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'email' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('email')}
            >
              <FaEnvelope className="text-xs" />
              <span>Почта</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell className="text-xs" />
              <span>Уведомления</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'security' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock className="text-xs" />
              <span>Безопасность</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'maintenance' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('maintenance')}
            >
              <FaServer className="text-xs" />
              <span>Обслуживание</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'academic' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('academic')}
            >
              <FaClock className="text-xs" />
              <span>Акад. часы</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-4 gap-6">
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
            <button
              className={`w-full p-4 flex items-center gap-3 text-left ${
                activeTab === 'academic' ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('academic')}
            >
              <FaClock />
              <span>Академические часы</span>
            </button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Общие настройки</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Часовой пояс
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg text-sm"
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
                      className="w-full p-2 border rounded-lg text-sm"
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
                      className="w-full p-2 border rounded-lg text-sm"
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
                      className="w-full p-2 border rounded-lg text-sm"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP сервер
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg text-sm"
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
                      className="w-full p-2 border rounded-lg text-sm"
                      value={formData.emailPort || ''}
                      onChange={(e) => handleSettingChange('emailPort', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Шифрование
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg text-sm"
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
                
                {/* Настройки уведомлений */}
                <div className="space-y-4">
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={formData.notificationsEnabled || false}
                      onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                    />
                    <span className="text-sm">Включить уведомления</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={formData.pushNotifications || false}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                    <span className="text-sm">Push-уведомления</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={formData.emailNotifications || false}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                    <span className="text-sm">Email-уведомления</span>
                  </label>
                </div>

                {/* Разделитель */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-semibold mb-4 flex items-center">
                    <FaPaperPlane className="mr-2 text-blue-600" />
                    Редактор уведомлений
                  </h3>
                  
                  {notificationMessage && (
                    <Alert 
                      variant={notificationMessage.includes('Ошибка') ? 'error' : 'success'} 
                      message={notificationMessage}
                      className="mb-4"
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип уведомления
                      </label>
                      <select
                        className="w-full p-2 border rounded-lg text-sm"
                        value={notificationForm.type}
                        onChange={(e) => handleNotificationFormChange('type', e.target.value)}
                      >
                        {NOTIFICATION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип получателей
                      </label>
                      <select
                        className="w-full p-2 border rounded-lg text-sm"
                        value={notificationForm.recipientType}
                        onChange={(e) => handleNotificationFormChange('recipientType', e.target.value)}
                      >
                        <option value="single">Один пользователь</option>
                        <option value="bulk">Массово (по роли)</option>
                      </select>
                    </div>

                    {notificationForm.recipientType === 'single' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID пользователей (через запятую)
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-lg text-sm"
                          placeholder="1, 2, 3"
                          value={notificationForm.userIds}
                          onChange={(e) => handleNotificationFormChange('userIds', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Текст уведомления *
                      </label>
                      <textarea
                        className="w-full p-2 border rounded-lg text-sm"
                        rows={3}
                        placeholder="Введите текст уведомления..."
                        value={notificationForm.message}
                        onChange={(e) => handleNotificationFormChange('message', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ссылка (опционально)
                      </label>
                      <input
                        type="url"
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="https://..."
                        value={notificationForm.url}
                        onChange={(e) => handleNotificationFormChange('url', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleSendNotification}
                      disabled={sendingNotification}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm"
                    >
                      {sendingNotification ? <Spinner size="sm" /> : <FaPaperPlane className="w-4 h-4" />}
                      <span>Отправить уведомление</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Настройки безопасности</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тайм-аут сессии (минуты)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg text-sm"
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
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={formData.maintenance || false}
                      onChange={(e) => handleSettingChange('maintenance', e.target.checked)}
                    />
                    <span className="text-sm">Режим обслуживания</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={formData.debugMode || false}
                      onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                    />
                    <span className="text-sm">Режим отладки</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4"
                      checked={formData.backupEnabled || false}
                      onChange={(e) => handleSettingChange('backupEnabled', e.target.checked)}
                    />
                    <span className="text-sm">Автоматическое резервное копирование</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Частота резервного копирования
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg text-sm"
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
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <FaDownload className="text-xs" /> 
                    <span>Скачать резервную копию</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Настройки академического часа</h2>
                {academicHourLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Продолжительность (минуты)
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          min="20"
                          max="90"
                          value={academicHourDuration}
                          onChange={(e) => setAcademicHourDuration(parseInt(e.target.value) || 45)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        />
                        <button
                          onClick={handleSaveAcademicHour}
                          disabled={academicHourLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {academicHourLoading ? (
                            <Spinner size="sm" />
                          ) : (
                            <FaSave className="mr-2" />
                          )}
                          Сохранить
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Допустимые значения: от 20 до 90 минут
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Примеры конвертации:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>40 минут:</span>
                          <span className="font-medium">{calculateExampleHours(40).toFixed(2)} акад. ч.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>50 минут:</span>
                          <span className="font-medium">{calculateExampleHours(50).toFixed(2)} акад. ч.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>60 минут:</span>
                          <span className="font-medium">{calculateExampleHours(60).toFixed(2)} акад. ч.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>90 минут:</span>
                          <span className="font-medium">{calculateExampleHours(90).toFixed(2)} акад. ч.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Важная информация</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Изменение продолжительности академического часа повлияет на все расчеты в системе</p>
                    <p>• Это касается зарплатных ведомостей, отчетов об отработанных часах и аналитики</p>
                    <p>• Рекомендуется вносить изменения в начале учебного периода</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg shadow p-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Общие настройки</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Часовой пояс
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg text-sm"
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
                    className="w-full p-3 border rounded-lg text-sm"
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
                    className="w-full p-3 border rounded-lg text-sm"
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
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.maxUploadSize || ''}
                    onChange={(e) => handleSettingChange('maxUploadSize', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Настройки почты</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP сервер
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg text-sm"
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
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.emailPort || ''}
                    onChange={(e) => handleSettingChange('emailPort', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Шифрование
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg text-sm"
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
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Настройки уведомлений</h2>
              
              {/* Настройки уведомлений */}
              <div className="space-y-3">
                <label className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mr-3 w-5 h-5"
                    checked={formData.notificationsEnabled || false}
                    onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Включить уведомления</span>
                </label>
                <label className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mr-3 w-5 h-5"
                    checked={formData.pushNotifications || false}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Push-уведомления</span>
                </label>
                <label className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mr-3 w-5 h-5"
                    checked={formData.emailNotifications || false}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Email-уведомления</span>
                </label>
              </div>

              {/* Разделитель */}
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold mb-4 flex items-center">
                  <FaPaperPlane className="mr-2 text-blue-600" />
                  Редактор уведомлений
                </h3>
                
                {notificationMessage && (
                  <Alert 
                    variant={notificationMessage.includes('Ошибка') ? 'error' : 'success'} 
                    message={notificationMessage}
                    className="mb-4"
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип уведомления
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg text-sm"
                      value={notificationForm.type}
                      onChange={(e) => handleNotificationFormChange('type', e.target.value)}
                    >
                      {NOTIFICATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип получателей
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg text-sm"
                      value={notificationForm.recipientType}
                      onChange={(e) => handleNotificationFormChange('recipientType', e.target.value)}
                    >
                      <option value="single">Один пользователь</option>
                      <option value="bulk">Массово (по роли)</option>
                    </select>
                  </div>

                  {notificationForm.recipientType === 'single' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID пользователей (через запятую)
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 border rounded-lg text-sm"
                        placeholder="1, 2, 3"
                        value={notificationForm.userIds}
                        onChange={(e) => handleNotificationFormChange('userIds', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Текст уведомления *
                    </label>
                    <textarea
                      className="w-full p-3 border rounded-lg text-sm"
                      rows={3}
                      placeholder="Введите текст уведомления..."
                      value={notificationForm.message}
                      onChange={(e) => handleNotificationFormChange('message', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ссылка (опционально)
                    </label>
                    <input
                      type="url"
                      className="w-full p-3 border rounded-lg text-sm"
                      placeholder="https://..."
                      value={notificationForm.url}
                      onChange={(e) => handleNotificationFormChange('url', e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSendNotification}
                    disabled={sendingNotification}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {sendingNotification ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <FaPaperPlane className="text-sm" />
                        Отправить уведомление
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Настройки безопасности</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тайм-аут сессии (минуты)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-lg text-sm"
                  value={formData.sessionTimeout || ''}
                  onChange={(e) => handleSettingChange('sessionTimeout', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                />
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Обслуживание системы</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mr-3 w-5 h-5"
                    checked={formData.maintenance || false}
                    onChange={(e) => handleSettingChange('maintenance', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Режим обслуживания</span>
                </label>
                <label className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mr-3 w-5 h-5"
                    checked={formData.debugMode || false}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Режим отладки</span>
                </label>
                <label className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mr-3 w-5 h-5"
                    checked={formData.backupEnabled || false}
                    onChange={(e) => handleSettingChange('backupEnabled', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Автоматическое резервное копирование</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Частота резервного копирования
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg text-sm"
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
                  className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <FaDownload className="text-sm" /> 
                  <span>Скачать резервную копию</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Настройки академического часа</h2>
              {academicHourLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Продолжительность (минуты)
                    </label>
                    <div className="space-y-3">
                      <input
                        type="number"
                        min="20"
                        max="90"
                        value={academicHourDuration}
                        onChange={(e) => setAcademicHourDuration(parseInt(e.target.value) || 45)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      />
                      <button
                        onClick={handleSaveAcademicHour}
                        disabled={academicHourLoading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {academicHourLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            Сохранить
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Допустимые значения: от 20 до 90 минут
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Примеры конвертации:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>40 минут:</span>
                        <span className="font-medium">{calculateExampleHours(40).toFixed(2)} акад. ч.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>50 минут:</span>
                        <span className="font-medium">{calculateExampleHours(50).toFixed(2)} акад. ч.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>60 минут:</span>
                        <span className="font-medium">{calculateExampleHours(60).toFixed(2)} акад. ч.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>90 минут:</span>
                        <span className="font-medium">{calculateExampleHours(90).toFixed(2)} акад. ч.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Важная информация</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Изменение продолжительности академического часа повлияет на все расчеты в системе</p>
                      <p>• Это касается зарплатных ведомостей, отчетов об отработанных часах и аналитики</p>
                      <p>• Рекомендуется вносить изменения в начале учебного периода</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
