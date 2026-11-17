import React from 'react';
import { getPickerText } from '../utils/platformDatePickerUtils';

export default function PlatformDateRangeFooter({
  footerText,
  draftFrom,
  draftTo,
  setDraftFrom,
  setDraftTo,
  setSelectionStep,
  handleCancel,
  handleApply,
  isBlue,
  lang,
  t,
}) {
  return (
    <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
      <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[240px]">
        {footerText}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        {(draftFrom || draftTo) && (
          <button
            type="button"
            onClick={() => {
              setDraftFrom('');
              setDraftTo('');
              setSelectionStep('start');
            }}
            className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
          >
            {getPickerText('clear', lang, t)}
          </button>
        )}
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
        >
          {getPickerText('cancel', lang, t)}
        </button>
        <button
          type="button"
          onClick={handleApply}
          className={`px-4 py-1.5 rounded-lg ${
            isBlue ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-700/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20'
          } text-white font-semibold shadow-sm transition-colors`}
        >
          {getPickerText('apply', lang, t)}
        </button>
      </div>
    </div>
  );
}
