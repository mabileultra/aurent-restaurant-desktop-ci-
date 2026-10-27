import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAdminThemeStore } from '../../store/themeStore';

const THEMES = [
  { id: 'light', icon: Sun, labelUz: "Yorug'", labelRu: 'Светлая', key: 'themeLight' },
  { id: 'system', icon: Monitor, labelUz: 'Tizim', labelRu: 'Авто', key: 'themeSystem' },
  { id: 'dark', icon: Moon, labelUz: "Tungi", labelRu: 'Тёмная', key: 'themeDark' },
];

export default function ThemeToggle({ className = '', compact = false }) {
  const { t, i18n } = useTranslation();
  const theme = useAdminThemeStore((s) => s.theme);
  const setTheme = useAdminThemeStore((s) => s.setTheme);
  const isUz = i18n?.language?.startsWith('uz');

  if (compact) {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const Icon = theme === 'dark' ? Moon : Sun;
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className={clsx(
          'p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors shadow-sm',
          className
        )}
        aria-label={t('pos.themeToggle', { defaultValue: 'Mavzu' })}
        title={isUz ? (theme === 'dark' ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish") : (theme === 'dark' ? 'Светлая тема' : 'Тёмная тема')}
      >
        <Icon size={16} strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-0.5 rounded-lg border p-0.5 shrink-0',
        'border-slate-300 bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/80',
        className
      )}
      role="radiogroup"
      aria-label={t('pos.themeToggle', { defaultValue: 'Mavzu' })}
    >
      {THEMES.map(({ id, icon: Icon, labelUz, labelRu, key }) => {
        const isActive = theme === id;
        const label = isUz ? labelUz : labelRu;
        const tooltip = t(`pos.${key}`, { defaultValue: label });
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(id)}
            title={tooltip}
            aria-label={tooltip}
            className={clsx(
              'px-2 py-1 rounded-md text-xs transition flex items-center gap-1',
              isActive
                ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-white'
            )}
          >
            <Icon size={13} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
            <span className="hidden xl:inline text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
