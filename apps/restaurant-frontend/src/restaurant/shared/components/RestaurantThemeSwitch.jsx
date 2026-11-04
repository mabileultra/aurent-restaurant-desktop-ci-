import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import {
  readRestaurantTheme,
  setRestaurantTheme,
  subscribeRestaurantTheme,
} from '../../../store/themeStore';
import '../styles/rst-lang-switch.css';

export default function RestaurantThemeSwitch({ className = '' }) {
  const { t } = useTranslation();
  const theme = useSyncExternalStore(subscribeRestaurantTheme, readRestaurantTheme, () => 'dark');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const light = theme === 'light';
  const label = light ? t('rst.themeLight') : t('rst.themeDark');

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pick = (next) => {
    setRestaurantTheme(next);
    setOpen(false);
  };

  return (
    <div
      ref={wrapRef}
      className={clsx('rst-theme-switch', 'rst-theme-switch--lookup', className, open && 'is-open')}
    >
      <button
        type="button"
        className="rst-theme-switch__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('rst.theme')}
        onClick={() => setOpen((v) => !v)}
      >
        {light ? <Sun size={14} strokeWidth={2.2} aria-hidden="true" /> : <Moon size={14} strokeWidth={2.2} aria-hidden="true" />}
        <span>{label}</span>
        <ChevronDown size={14} strokeWidth={2.4} className="rst-theme-switch__chevron" aria-hidden="true" />
      </button>

      {open ? (
        <ul className="rst-theme-switch__menu" role="listbox" aria-label={t('rst.theme')}>
          <li role="option" aria-selected={!light}>
            <button
              type="button"
              className={clsx('rst-theme-switch__option', !light && 'is-active')}
              onClick={() => pick('dark')}
            >
              <Moon size={14} strokeWidth={2.2} aria-hidden="true" />
              {t('rst.themeDark')}
            </button>
          </li>
          <li role="option" aria-selected={light}>
            <button
              type="button"
              className={clsx('rst-theme-switch__option', light && 'is-active')}
              onClick={() => pick('light')}
            >
              <Sun size={14} strokeWidth={2.2} aria-hidden="true" />
              {t('rst.themeLight')}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
