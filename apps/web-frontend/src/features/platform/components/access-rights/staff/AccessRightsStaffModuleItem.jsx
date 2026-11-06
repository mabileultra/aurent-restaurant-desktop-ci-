import React from 'react';
import AccessRightsTriStateButton from '../shared/AccessRightsTriStateButton';

export default function AccessRightsStaffModuleItem({
  module,
  inTemplate = false,
  overrideMode = 'template', // 'template' | 'grant' | 'deny'
  onChangeMode,
}) {
  const effectiveResult = overrideMode === 'grant'
    ? true
    : overrideMode === 'deny'
    ? false
    : inTemplate;

  let statusText = 'Shablon bilan bir xil — istisno yo‘q';
  let statusColor = 'text-slate-400';

  if (overrideMode === 'grant') {
    statusText = inTemplate
      ? 'Shablonda bor va shaxsiy tasdiqlangan'
      : 'Shaxsiy qo‘shimcha ruxsat berilgan (+ruxsat)';
    statusColor = 'text-emerald-700 dark:text-emerald-400 font-semibold';
  } else if (overrideMode === 'deny') {
    statusText = inTemplate
      ? 'Shablonda bor, lekin bu xodimga taqiqlangan (−taqiq)'
      : 'Shaxsiy taqiqlangan';
    statusColor = 'text-rose-600 dark:text-rose-400 font-semibold';
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {module.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
            {module.groupTitle || 'Asosiy'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
          <span>
            Shablonda: <strong className="text-slate-700 dark:text-slate-300">{inTemplate ? 'Ha' : 'Yo‘q'}</strong>
          </span>
          <span>·</span>
          <span>
            Natija: <strong className={effectiveResult ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}>
              {effectiveResult ? 'Ha' : 'Yo‘q'}
            </strong>
          </span>
          <span>·</span>
          <span className={statusColor}>{statusText}</span>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        <AccessRightsTriStateButton
          mode={overrideMode}
          onChange={(newMode) => onChangeMode(module.id, newMode)}
          moduleName={module.name}
        />
      </div>
    </div>
  );
}
