import { useState, useCallback, useEffect } from 'react';
import type { Language } from '../locales/translations';
import { translations } from '../locales/translations';

type TranslationKey = keyof typeof translations.ru;

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language;
    return savedLang || 'ru';
  });

  const changeLanguage = useCallback((lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[currentLanguage][key] || key;
  }, [currentLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    t
  };
}; 