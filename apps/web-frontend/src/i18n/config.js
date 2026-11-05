import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import resourcesToBackend from 'i18next-resources-to-backend';

i18n
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language) => {
      if (language === 'uz') {
        return import('../locales/uz/index.js');
      }
      return import('../locales/ru/index.js');
    })
  )
  .use(initReactI18next)
  .init({
    fallbackLng: false,
    lng: (typeof window !== 'undefined' && localStorage.getItem('pos-lang')) || 'uz',
    supportedLngs: ['ru', 'uz'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'pos-lang',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
