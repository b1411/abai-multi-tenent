import React from 'react';
import { motion } from 'framer-motion';
import type { Language } from '../locales/translations';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'kz', flag: '🇰🇿', name: 'Қазақша' },
    { code: 'en', flag: '🇺🇸', name: 'English' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {languages.map((lang) => (
        <motion.button
          key={lang.code}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onLanguageChange(lang.code)}
          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
            currentLanguage === lang.code
              ? 'bg-corporate-primary text-white'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <span className="text-xl mr-2">{lang.flag}</span>
          <span className="text-sm font-medium">{lang.name}</span>
        </motion.button>
      ))}
    </div>
  );
}; 