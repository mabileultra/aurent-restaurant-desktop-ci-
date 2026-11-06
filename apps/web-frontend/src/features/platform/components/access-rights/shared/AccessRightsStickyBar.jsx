import React from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';

export default function AccessRightsStickyBar({
  isDirty = false,
  dirtyCount = 0,
  message,
  onReset,
  onSave,
  isSaving = false,
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 sm:px-5 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-all">
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        {isDirty ? (
          <>
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {message || `${dirtyCount} ta o‘zgarish saqlanmagan`}
            </span>
          </>
        ) : (
          <>
            <Check size={16} className="text-emerald-700 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-slate-400">
              Barcha o‘zgarishlar saqlangan
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <BaseButton
          variant="secondary"
          size="sm"
          disabled={!isDirty || isSaving}
          onClick={onReset}
          className="text-xs font-semibold"
        >
          Bekor qilish
        </BaseButton>
        <BaseButton
          variant="primary"
          size="sm"
          disabled={!isDirty || isSaving}
          onClick={onSave}
          className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white min-w-[90px]"
        >
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" />
              <span>Saqlanmoqda...</span>
            </span>
          ) : (
            'Saqlash'
          )}
        </BaseButton>
      </div>
    </div>
  );
}
