import React from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaSearch, FaUser } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../locales/translations';

export const TopPanel: React.FC = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();

  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'kz', flag: '🇰🇿', name: 'Қазақша' },
    { code: 'en', flag: '🇺🇸', name: 'English' },
  ];

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200">
      {/* Левая часть с поиском */}
      <div className="flex items-center flex-1">
        <div className="relative max-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 text-sm border border-transparent rounded bg-gray-100 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-200"
            placeholder={t('search')}
          />
        </div>
      </div>

      {/* Правая часть */}
      <div className="flex items-center space-x-2">
        {/* Переключатель языков */}
        <div className="flex items-center mr-4">
          {languages.map((lang) => (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              }`}
              title={lang.name}
            >
              <span className="text-lg">{lang.flag}</span>
            </motion.button>
          ))}
        </div>

        {/* Уведомления */}
        <button 
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50"
          title={t('notifications')}
        >
          <FaBell className="h-4 w-4 text-gray-600" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        </button>

        {/* Профиль */}
        <button 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50"
          title={t('profile')}
        >
          <FaUser className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}; 