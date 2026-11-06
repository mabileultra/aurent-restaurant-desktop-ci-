import React from 'react';
import { RotateCcw, Copy, X } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';

export default function AccessRightsStaffBulkBar({
  selectedCount = 0,
  isSameRole = true,
  onResetToTemplate,
  onApplyCopy,
  onClearSelection,
  isResetting = false,
}) {
  if (selectedCount < 1) return null;

  return (
    <div className="p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 shadow-lg space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-emerald-400">
          {selectedCount} xodim tanlandi
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
        >
          <X size={12} />
          <span>Tanlovni bekor qilish</span>
        </button>
      </div>

      {!isSameRole && (
        <p className="text-[10px] text-amber-300">
          Rollar har xil. Nusxa faqat bir xil roldagi xodimlarga qo‘llanadi.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <BaseButton
          variant="secondary"
          size="sm"
          disabled={isResetting}
          onClick={onResetToTemplate}
          className="text-xs font-semibold gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
        >
          <RotateCcw size={13} />
          <span>Shablonga qaytarish</span>
        </BaseButton>

        <BaseButton
          variant="primary"
          size="sm"
          onClick={onApplyCopy}
          className="text-xs font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          <Copy size={13} />
          <span>Huquqdan nusxa qo‘llash</span>
        </BaseButton>
      </div>
    </div>
  );
}
