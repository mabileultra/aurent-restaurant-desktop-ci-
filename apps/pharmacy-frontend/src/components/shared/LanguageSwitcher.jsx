import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
];

export default function LanguageSwitcher({ className = '', variant = 'default' }) {
  const { i18n } = useTranslation();

  if (variant === 'cashier') {
    return (
      <div
        className={clsx('cashier-lang-switch', className)}
        role="group"
        aria-label="Language"
      >
        {LANGS.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            className={clsx(
              'cashier-lang-switch__btn',
              i18n.language?.startsWith(code) && 'is-active',
            )}
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
            onClick={() => i18n.changeLanguage(code)}
            className={clsx(
              'public-lang-switch__btn',
              i18n.language?.startsWith(code) && 'is-active',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('ui-tabs', className)} role="group" aria-label="Language">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          className={clsx(
            'ui-tab',
            i18n.language?.startsWith(code) && 'ui-tab-active',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
