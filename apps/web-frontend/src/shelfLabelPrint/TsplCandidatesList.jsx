import React from 'react';
import { Wifi } from 'lucide-react';

export function sourceLabel(source, t) {
  if (source === 'windows_printer') {
    return t('usersBarcodePrint.tsplSourceWindows', { defaultValue: 'Windows-принтер' });
  }
  if (source === 'network_scan') {
    return t('usersBarcodePrint.tsplSourceScan', { defaultValue: 'Сеть' });
  }
  return t('usersBarcodePrint.tsplSourceUnknown', { defaultValue: 'Найдено' });
}

export default function TsplCandidatesList({ candidates = [], selectedHost = '', onPick, t }) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-2 dark:border-slate-600 dark:bg-slate-900/50">
      <p className="mb-2 flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
        <Wifi size={12} aria-hidden />
        {t('usersBarcodePrint.tsplCandidates', { defaultValue: 'Найденные устройства (порт 9100)' })}
      </p>
      <div className="flex flex-col gap-1.5">
        {candidates.slice(0, 6).map((item) => (
          <button
            key={`${item.host}:${item.port}`}
            type="button"
            onClick={() => onPick?.(item.host)}
            className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
              selectedHost === item.host
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40'
                : 'border-slate-200 hover:border-violet-300 dark:border-slate-600 dark:hover:border-violet-700'
            }`}
          >
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
              {item.host}
            </span>
            <span className="text-slate-500 dark:text-slate-400">{sourceLabel(item.source, t)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
