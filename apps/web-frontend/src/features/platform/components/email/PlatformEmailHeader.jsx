import React from 'react';
import { Plus } from 'lucide-react';
import { EMAIL_TAB_KEYS } from '../../utils/emailConstants';

export default function PlatformEmailHeader({ activeTab, onGoToSend, onGoToSettings }) {
  const isHistory = activeTab === EMAIL_TAB_KEYS.HISTORY;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Boshqaruv › Pochta</span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Pochta
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Foydalanuvchilarga xabar yuborish, avtomatik xatlar va yetkazilish nazorati
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isHistory ? (
          <button
            type="button"
            onClick={onGoToSend}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            Yangi xabar
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoToSettings}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Pochta serveri ulangan
          </button>
        )}
      </div>
    </div>
  );
}
