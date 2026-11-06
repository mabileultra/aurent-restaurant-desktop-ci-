import React from 'react';
import { Clock } from 'lucide-react';

export default function AccessRightsHistoryEmptyState({ onClearFilters, canClear = false }) {
  return (
    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
      <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
        Tarix yozuvlari topilmadi
      </h3>
      <p className="text-[11px] text-slate-500 mt-0.5">
        Qidiruv yoki sana filtrini o‘zgartirib ko‘ring
      </p>
      {canClear && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg cursor-pointer"
        >
          Filtrlarni tozalash
        </button>
      )}
    </div>
  );
}
