import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import '../../restaurant/shared/styles/rst-lang-switch.css';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
];

function resolveActiveCode(i18n) {
  const current = String(i18n.resolvedLanguage || i18n.language || '').toLowerCase();
  const hit = LANGS.find(({ code }) => current === code || current.startsWith(`${code}-`));
  return hit?.code || 'ru';
}

export default function LanguageSwitcher({ className = '', variant = 'default' }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const activeCode = resolveActiveCode(i18n);
  const activeLabel = LANGS.find((l) => l.code === activeCode)?.label || 'RU';

  const rootClass = variant === 'public'
    ? 'public-lang-switch'
    : variant === 'cashier'
      ? 'cashier-lang-switch'
      : 'rst-lang-switch';

  const switchTo = (code) => {
    try {
      localStorage.setItem('pos-lang', code);
    } catch {
      /* ignore quota / private mode */
    }
    void i18n.changeLanguage(code);
    setOpen(false);
  };

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

  return (
    <div
      ref={wrapRef}
      className={clsx(rootClass, `${rootClass}--lookup`, className, open && 'is-open')}
    >
      <button
        type="button"
        className={`${rootClass}__trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('cashierLogin.language', { defaultValue: 'Язык' })}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{activeLabel}</span>
        <ChevronDown size={14} strokeWidth={2.4} className={`${rootClass}__chevron`} aria-hidden="true" />
      </button>

      {open ? (
        <ul className={`${rootClass}__menu`} role="listbox" aria-label={t('cashierLogin.language', { defaultValue: 'Язык' })}>
          {LANGS.map(({ code, label }) => (
            <li key={code} role="option" aria-selected={code === activeCode}>
              <button
                type="button"
                className={clsx(`${rootClass}__option`, code === activeCode && 'is-active')}
                onClick={() => switchTo(code)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
