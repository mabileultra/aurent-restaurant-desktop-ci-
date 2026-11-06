import React from 'react';
import { BaseButton } from '../../../../components/ui';

export default function PlatformSecurityRulesStickyBar({
  dirtyCount,
  onReset,
  onSave,
}) {
  const isDirty = dirtyCount > 0;

  return (
    <div
      className={`sticky bottom-0 z-20 -mx-4 sm:-mx-6 -mb-6 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t transition-all ${
        isDirty
          ? 'bg-emerald-950 text-white border-emerald-900 shadow-xl'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
          }`}
        />
        <div>
          <span className="font-bold">
            {isDirty ? `${dirtyCount} ta o‘zgarish saqlanmagan` : 'Barcha qoidalar saqlangan'}
          </span>
          <p className={`text-[11px] ${isDirty ? 'text-emerald-200' : 'text-slate-400'}`}>
            {isDirty
              ? 'Yangi qoidalar xodimlar keyingi kirganida amal qiladi'
              : 'Oxirgi o‘zgartirish: Administrator Super · 2-noyabr, 16:20'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {isDirty && (
          <BaseButton
            type="button"
            variant="secondary"
            className="text-xs font-semibold bg-transparent border-white/30 text-white hover:bg-white/10"
            onClick={onReset}
          >
            Bekor qilish
          </BaseButton>
        )}
        <BaseButton
          type="button"
          disabled={!isDirty}
          onClick={onSave}
          className={`text-xs font-bold ${
            isDirty
              ? 'bg-white text-emerald-950 hover:bg-slate-100 shadow-sm'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          }`}
        >
          Qoidalarni saqlash
        </BaseButton>
      </div>
    </div>
  );
}
