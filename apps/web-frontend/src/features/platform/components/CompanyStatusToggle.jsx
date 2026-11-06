import React from 'react';
import { Power } from 'lucide-react';

export default function CompanyStatusToggle({ t, active, onToggle }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 mb-3">
      <div>
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {t('common.status')}: {active ? t('common.active') : t('common.inactive')}
        </div>
        <div className="text-[11px] text-slate-500">
          {active ? 'Kompaniya faol, savdo do‘konlari ishlaydi' : 'Kompaniya faolsizlantirilgan (nofaol)'}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
          active
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}
      >
        <Power size={13} />
        <span>{active ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('platform.activate', { defaultValue: 'Faollashtirish' })}</span>
      </button>
    </div>
  );
}
