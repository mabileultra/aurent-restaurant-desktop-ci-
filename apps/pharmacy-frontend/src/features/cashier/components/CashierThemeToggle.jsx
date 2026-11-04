import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

/**
 * @param {{ theme: 'dark' | 'light'; onToggle: () => void; className?: string; compact?: boolean }} props
 */
export default function CashierThemeToggle({ theme, onToggle, className = '', compact = false }) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <div
      className={clsx('cashier-theme-toggle', compact && 'cashier-theme-toggle--compact', className)}
      role="group"
      aria-label={t('pos.themeToggle')}
    >
      <button
        type="button"
        className={clsx('cashier-theme-toggle__opt', !isDark && 'is-active')}
        onClick={() => {
          if (isDark) onToggle();
        }}
        aria-label={t('pos.themeLight')}
        title={t('pos.themeLight')}
        aria-pressed={!isDark}
      >
        <Sun size={compact ? 16 : 18} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className={clsx('cashier-theme-toggle__opt', isDark && 'is-active')}
        onClick={() => {
          if (!isDark) onToggle();
        }}
        aria-label={t('pos.themeDark')}
        title={t('pos.themeDark')}
        aria-pressed={isDark}
      >
        <Moon size={compact ? 16 : 18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
