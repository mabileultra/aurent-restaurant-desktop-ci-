import React from 'react';
import { KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailTemplatesList({ flow }) {
  const { t } = useTranslation();

  const getIcon = (code) => {
    switch (code) {
      case 'USER_CREDENTIALS':
        return <KeyRound className="h-5 w-5" />;
      case 'SUPER_ADMIN_LOGIN':
        return <ShieldAlert className="h-5 w-5" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  return (
    <section className="flex flex-col gap-3 lg:w-80 flex-shrink-0">
      <p className="text-xs text-slate-500 leading-relaxed">
        {t('platform.email.subtitle', 'Tizim hodisalarida avtomatik yuboriladigan xatlar.')}
      </p>

      <div className="flex flex-col gap-2.5">
        {flow.templatesList.map((tpl) => {
          const isSelected = flow.selectedKey === tpl.code;

          return (
            <div
              key={tpl.code}
              role="button"
              tabIndex={0}
              onClick={() => flow.setSelectedKey(tpl.code)}
              onKeyDown={(e) => { if (e.key === 'Enter') flow.setSelectedKey(tpl.code); }}
              className={`flex flex-col gap-2.5 rounded-2xl p-4 cursor-pointer transition ${
                isSelected
                  ? 'border-2 border-emerald-700 bg-white shadow-md dark:border-emerald-500 dark:bg-slate-900'
                  : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${
                    isSelected
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  {getIcon(tpl.code)}
                </span>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {tpl.title}
                  </span>
                  <span className="text-xs text-slate-500 line-clamp-2 leading-snug">
                    {tpl.trigger}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-400">{tpl.code}</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Faol
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
