import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ru from './ru.json';
import uz from './uz.json';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'ru';
const defaultLang = deviceLang === 'uz' ? 'uz' : 'ru';

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng: defaultLang,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export default i18n;

export function setAppLanguage(lang: 'ru' | 'uz') {
  void i18n.changeLanguage(lang);
}

export function getAppLanguage(): 'ru' | 'uz' {
  return i18n.language === 'uz' ? 'uz' : 'ru';
}
