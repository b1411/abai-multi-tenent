import React, { useState } from 'react';
import {
  FaUser,
  FaBell,
  FaLock,
  FaPalette,
  FaLanguage,
  FaCog,
  FaQuestionCircle,
  FaChevronRight,
  FaMoon,
  FaSun,
  FaCheck
} from 'react-icons/fa';

interface Setting {
  id: string;
  category: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'input' | 'button';
  value?: any;
  options?: { label: string; value: any }[];
}

const SettingsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('profile');
  const [settings, setSettings] = useState<Setting[]>([
    {
      id: 'theme',
      category: 'appearance',
      title: 'Тема оформления',
      description: 'Выберите светлую или темную тему интерфейса',
      type: 'select',
      value: 'light',
      options: [
        { label: 'Светлая', value: 'light' },
        { label: 'Темная', value: 'dark' },
        { label: 'Системная', value: 'system' }
      ]
    },
    {
      id: 'language',
      category: 'appearance',
      title: 'Язык интерфейса',
      description: 'Выберите предпочитаемый язык',
      type: 'select',
      value: 'ru',
      options: [
        { label: 'Русский', value: 'ru' },
        { label: 'English', value: 'en' },
        { label: 'Қазақша', value: 'kk' }
      ]
    },
    {
      id: 'notifications',
      category: 'notifications',
      title: 'Push-уведомления',
      description: 'Получать уведомления о новых сообщениях и событиях',
      type: 'toggle',
      value: true
    },
    {
      id: 'emailNotifications',
      category: 'notifications',
      title: 'Email-уведомления',
      description: 'Получать уведомления на электронную почту',
      type: 'toggle',
      value: false
    },
    {
      id: 'twoFactor',
      category: 'security',
      title: 'Двухфакторная аутентификация',
      description: 'Дополнительный уровень защиты вашего аккаунта',
      type: 'toggle',
      value: false
    },
    {
      id: 'sessionTimeout',
      category: 'security',
      title: 'Тайм-аут сессии',
      description: 'Время до автоматического выхода из системы',
      type: 'select',
      value: '30',
      options: [
        { label: '15 минут', value: '15' },
        { label: '30 минут', value: '30' },
        { label: '1 час', value: '60' },
        { label: '4 часа', value: '240' }
      ]
    }
  ]);

  const categories = [
    {
      id: 'profile',
      icon: FaUser,
      label: 'Профиль'
    },
    {
      id: 'notifications',
      icon: FaBell,
      label: 'Уведомления'
    },
    {
      id: 'security',
      icon: FaLock,
      label: 'Безопасность'
    },
    {
      id: 'appearance',
      icon: FaPalette,
      label: 'Внешний вид'
    },
    {
      id: 'language',
      icon: FaLanguage,
      label: 'Язык'
    },
    {
      id: 'system',
      icon: FaCog,
      label: 'Система'
    },
    {
      id: 'help',
      icon: FaQuestionCircle,
      label: 'Помощь'
    }
  ];

  const handleSettingChange = (settingId: string, newValue: any) => {
    setSettings(
      settings.map((setting) =>
        setting.id === settingId ? { ...setting, value: newValue } : setting
      )
    );
  };

  const renderSettingControl = (setting: Setting) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <button
            onClick={() => handleSettingChange(setting.id, !setting.value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              setting.value ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                setting.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="block w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'input':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="block w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        );
      case 'button':
        return (
          <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            {setting.title}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Боковая панель */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800">Настройки</h2>
        </div>
        <nav className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex w-full items-center px-4 py-3 text-sm transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-50 text-blue-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{category.label}</span>
                <FaChevronRight
                  className={`ml-auto h-4 w-4 transform transition-transform ${
                    activeCategory === category.id ? 'rotate-90' : ''
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Профиль */}
          {activeCategory === 'profile' && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Профиль пользователя
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gray-200" />
                  <div>
                    <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                      Изменить фото
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Имя
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Введите имя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Введите фамилию"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Введите email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Введите телефон"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                    Сохранить изменения
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Настройки */}
          {activeCategory !== 'profile' && (
            <div className="space-y-6">
              {settings
                .filter((setting) => setting.category === activeCategory)
                .map((setting) => (
                  <div
                    key={setting.id}
                    className="rounded-lg bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {setting.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {setting.description}
                        </p>
                      </div>
                      {renderSettingControl(setting)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 