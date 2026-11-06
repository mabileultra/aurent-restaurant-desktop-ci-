import React from 'react';
import { KeyRound, Mail, ShieldAlert } from 'lucide-react';

export default function PlatformEmailTemplatesList({ flow }) {
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
        Tizim hodisalarida avtomatik yuboriladigan xatlar. Matnni o‘zgartirsangiz, keyingi xatlar yangi matn bilan ketadi.
      </p>

      <div className="flex flex-col gap-2.5">
        {flow.templatesList.map((t) => {
          const isSelected = flow.selectedKey === t.code;

          return (
            <div
              key={t.code}
              onClick={() => flow.setSelectedKey(t.code)}
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
                  {getIcon(t.code)}
                </span>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {t.title}
                  </span>
                  <span className="text-xs text-slate-500 line-clamp-2 leading-snug">
                    {t.trigger}
                  </span>
                </div>

                {t.hasSwitch && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={t.enabled}
                    onClick={(e) => flow.toggleTemplateEnabled(t.code, e)}
                    className={`flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition ${
                      t.enabled ? 'bg-emerald-700 justify-end' : 'bg-slate-300 justify-start dark:bg-slate-700'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800">
                <span>{t.last}</span>
                <span
                  className={`font-semibold ${
                    !t.hasSwitch
                      ? 'text-slate-500'
                      : t.enabled
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {!t.hasSwitch ? 'Qo‘lda' : t.enabled ? 'Faol' : 'O‘chirilgan'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
