import React from 'react';
import { Check, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailAudienceSelector({ flow }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
          1
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('platform.email.stepAudience', 'Kimga yuboriladi')}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-w-md">
        {flow.modes.map((m) => {
          const isSelected = flow.mode === m.id;
          const title = m.id === 'all'
            ? t('platform.email.audienceAll', m.title)
            : t('platform.email.audienceRole', m.title);
          const sub = m.id === 'all'
            ? t('platform.email.audienceAllSub', m.sub)
            : t('platform.email.audienceRoleSub', m.sub);

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => flow.setMode(m.id)}
              className={`flex flex-col items-start gap-1 rounded-xl p-3 text-left transition ${
                isSelected
                  ? 'border-2 border-emerald-700 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-950/30'
                  : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <span className="text-xs font-bold text-slate-900 dark:text-white">{title}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</span>
            </button>
          );
        })}
      </div>

      {flow.mode === 'all' && (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {t('platform.email.audienceAllHint', 'Email manzili bor barcha faol foydalanuvchilarga yuboriladi. Super-admin hisoblari kiritilmaydi.')}
        </p>
      )}

      {flow.mode === 'role' && (
        <div className="flex flex-wrap gap-2">
          {flow.roleOptions.map((r) => {
            const isOn = Boolean(flow.roles[r.id]);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => flow.toggleRole(r.id)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
                  isOn
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isOn && <Check className="h-3.5 w-3.5" />}
                {r.label}
                <span className="opacity-80 font-normal">({r.count})</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 text-xs dark:bg-emerald-950/20 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200">
            <b>{flow.countLabel}</b> — {t('platform.email.eachSeparateNotice', 'har biriga alohida xat ketadi, boshqalarning manzili ko‘rinmaydi')}
          </span>
        </div>
      </div>
    </div>
  );
}
