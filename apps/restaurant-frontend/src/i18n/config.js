import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from '../locales/ru.json';
import uz from '../locales/uz.json';
import en from '../locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      uz: { translation: uz },
      en: { translation: en },
    },
    fallbackLng: ['ru'],
    supportedLngs: ['ru', 'uz', 'en'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    cleanCode: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'pos-lang',
      convertDetectedLanguage: (lng) => String(lng || '').split('-')[0].toLowerCase(),
    },
  });

export default i18n;
