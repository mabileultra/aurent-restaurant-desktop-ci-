import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';

export default function AccessRightsHistoryItemCard({
  item,
  onRevert,
  isReverting = false,
}) {
  const [showDetails, setShowDetails] = useState(false);

  const typeBadges = {
    template: { label: 'Shablon', cls: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' },
    exception: { label: 'Istisno', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    copy: { label: 'Nusxa', cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
    bulk: { label: 'Ommaviy', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  };

  const actionType = item.actionType || 'exception';
  const badgeInfo = typeBadges[actionType] || typeBadges.exception;

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400 shrink-0 mt-0.5 sm:mt-0">
            {item.time || '12:00'}
          </span>

          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
            {item.operatorInitials || 'Po'}
          </span>

          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              {item.title || 'Platforma operatori o‘zgartirish kiritdi'}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${badgeInfo.cls}`}>
                {badgeInfo.label}
              </span>
              <span>{item.subtitle || '1 xodim'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <span>Tafsilot</span>
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <BaseButton
            variant="secondary"
            size="sm"
            disabled={isReverting}
            onClick={() => onRevert(item.id)}
            className="text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-200"
          >
            <RotateCcw size={12} />
            <span>Qaytarish</span>
          </BaseButton>
        </div>
      </div>

      {showDetails && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
          <div className="font-bold text-slate-700 dark:text-slate-300">O‘zgarishlar tafsiloti:</div>
          <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            {item.details || 'Modul ruxsatlari yangilandi'}
          </p>
        </div>
      )}
    </div>
  );
}
