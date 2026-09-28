import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  readRestaurantTheme,
  setRestaurantTheme,
  subscribeRestaurantTheme,
} from '../../../store/themeStore';
import '../styles/rst-lang-switch.css';

export default function RestaurantThemeSwitch() {
  const { t } = useTranslation();
  const theme = useSyncExternalStore(subscribeRestaurantTheme, readRestaurantTheme, () => 'dark');

  return (
    <div className="rst-theme-switch" role="group" aria-label={t('rst.theme')}>
      <button
        type="button"
        className={clsx('rst-theme-switch__btn', theme === 'dark' && 'is-active')}
        onClick={() => setRestaurantTheme('dark')}
      >
        {t('rst.themeDark')}
      </button>
      <button
        type="button"
        className={clsx('rst-theme-switch__btn', theme === 'light' && 'is-active')}
        onClick={() => setRestaurantTheme('light')}
      >
        {t('rst.themeLight')}
      </button>
    </div>
  );
}
