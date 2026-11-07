import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 3-holatli boshqaruv: Shablon (default) / Ruxsat (+grant) / Taqiq (-deny)
 */
export default function AccessRightsTriStateButton({
  mode = 'template',
  onChange,
  disabled = false,
  size = 'sm',
  moduleName = '',
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const options = [
    { id: 'template', label: isRu ? 'Шаблон' : 'Shablon' },
    { id: 'grant', label: isRu ? 'Разрешено' : 'Ruxsat' },
    { id: 'deny', label: isRu ? 'Запрещено' : 'Taqiq' },
  ];

  return (
    <div
      role="group"
      aria-label={moduleName ? `${moduleName} huquqi` : 'Modul huquqi'}
      className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80"
    >
      {options.map((opt) => {
        const isActive = mode === opt.id;
        let activeClass = 'bg-white text-slate-800 shadow-xs dark:bg-slate-900 dark:text-slate-100';
        if (isActive) {
          if (opt.id === 'grant') {
            activeClass = 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-700';
          } else if (opt.id === 'deny') {
            activeClass = 'bg-rose-600 text-white shadow-xs dark:bg-rose-700';
          } else {
            activeClass = 'bg-slate-700 text-white shadow-xs dark:bg-slate-600';
          }
        }

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            aria-label={moduleName ? `${moduleName}: ${opt.label}` : opt.label}
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              isActive
                ? activeClass
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
