import React from 'react';
import { Store } from 'lucide-react';

export default function StoresGroupedEmpty({ t }) {
  return (
    <div className="py-16 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
        <Store size={26} />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        {t('platform.groupedEmptyTitle', { defaultValue: 'Filiallar topilmadi' })}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {t('platform.groupedEmptyDesc', {
          defaultValue: 'Tanlangan filtr yoki qidiruv so‘rovi bo‘yicha hech qanday filial mavjud emas.',
        })}
      </p>
    </div>
  );
}
