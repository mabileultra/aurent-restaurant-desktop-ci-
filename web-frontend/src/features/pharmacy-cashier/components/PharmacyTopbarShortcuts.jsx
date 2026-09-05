import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-topbar-shortcuts.css';

const HINTS = [
  { key: 'F2', labelKey: 'pharmacyCashier.hotkeys.search' },
  { key: 'F3', labelKey: 'pharmacyCashier.hotkeys.analogs' },
  { key: 'Enter', labelKey: 'pharmacyCashier.hotkeys.pay' },
];

/**
 * Подсказки хоткеев в topbar — только аптека.
 */
export default function PharmacyTopbarShortcuts() {
  const { t } = useTranslation();

  return (
    <div className="pharmacy-topbar-shortcuts d-none d-lg-flex" aria-label={t('pharmacyCashier.hotkeys.title')}>
      {HINTS.map((hint) => (
        <span key={hint.key} className="pharmacy-topbar-shortcuts__item">
          <kbd className="pharmacy-topbar-shortcuts__kbd">{hint.key}</kbd>
          <span className="pharmacy-topbar-shortcuts__label">{t(hint.labelKey)}</span>
        </span>
      ))}
    </div>
  );
}
