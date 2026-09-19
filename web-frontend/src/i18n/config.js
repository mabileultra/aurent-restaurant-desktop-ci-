import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from '../locales/ru.json';
import uz from '../locales/uz.json';
import pharmacyErrorsRu from '../locales/pharmacyErrors.ru.json';
import pharmacyErrorsUz from '../locales/pharmacyErrors.uz.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: { ...ru, pharmacyErrors: pharmacyErrorsRu } },
      uz: { translation: { ...uz, pharmacyErrors: pharmacyErrorsUz } },
    },
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'uz'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'pos-lang',
    },
  });

export default i18n;
