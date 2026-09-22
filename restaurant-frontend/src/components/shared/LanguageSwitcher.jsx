import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import '../../restaurant/shared/styles/rst-lang-switch.css';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
];

function isActive(i18n, code) {
  const current = String(i18n.resolvedLanguage || i18n.language || '').toLowerCase();
  return current === code || current.startsWith(`${code}-`);
}

export default function LanguageSwitcher({ className = '', variant = 'default' }) {
  const { i18n } = useTranslation();

  const switchTo = (code) => {
    try {
      localStorage.setItem('pos-lang', code);
    } catch {
      /* ignore quota / private mode */
    }
    void i18n.changeLanguage(code);
  };

  if (variant === 'cashier' || variant === 'rst') {
    const root = variant === 'rst' ? 'rst-lang-switch' : 'cashier-lang-switch';
    const btn = variant === 'rst' ? 'rst-lang-switch__btn' : 'cashier-lang-switch__btn';
    return (
      <div className={clsx(root, className)} role="group" aria-label="Language">
        {LANGS.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={clsx(btn, isActive(i18n, code) && 'is-active')}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'public') {
    return (
      <div
        className={clsx('public-lang-switch', className)}
        role="group"
        aria-label="Language"
      >
        {LANGS.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={clsx(
              'public-lang-switch__btn',
              isActive(i18n, code) && 'is-active'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx('rst-lang-switch', className)}
      role="group"
      aria-label="Language"
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          className={clsx(
            'rst-lang-switch__btn',
            isActive(i18n, code) && 'is-active'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
