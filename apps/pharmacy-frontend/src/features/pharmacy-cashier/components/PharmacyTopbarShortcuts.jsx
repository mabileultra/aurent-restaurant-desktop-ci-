import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-topbar-shortcuts.css';

const HINTS = [
  { key: 'F2', labelKey: 'pharmacyCashier.hotkeys.search', tone: 'default' },
  { key: 'F3', labelKey: 'pharmacyCashier.hotkeys.analogs', tone: 'default' },
  { key: 'F9', labelKey: 'pharmacyCashier.hotkeys.receipt', tone: 'default' },
  { key: 'ENTER', labelKey: 'pharmacyCashier.hotkeys.pay', tone: 'pay' },
];

/**
 * Подсказки хоткеев в topbar — только аптека (поверх продуктовой шапки).
 */
export default function PharmacyTopbarShortcuts() {
  const { t } = useTranslation();

  return (
    <div className="pharmacy-topbar-shortcuts d-none d-lg-flex" aria-label={t('pharmacyCashier.hotkeys.title')}>
      {HINTS.map((hint) => (
        <span
          key={hint.key}
          className={`pharmacy-topbar-shortcuts__item${hint.tone === 'pay' ? ' pharmacy-topbar-shortcuts__item--pay' : ''}`}
        >
          <kbd className={`pharmacy-topbar-shortcuts__kbd${hint.tone === 'pay' ? ' pharmacy-topbar-shortcuts__kbd--pay' : ''}`}>
            {hint.key}
          </kbd>
          <span className="pharmacy-topbar-shortcuts__label">{t(hint.labelKey)}</span>
        </span>
      ))}
    </div>
  );
}
