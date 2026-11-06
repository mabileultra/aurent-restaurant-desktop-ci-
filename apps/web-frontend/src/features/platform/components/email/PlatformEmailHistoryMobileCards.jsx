import React from 'react';
import {
  formatNumberWithSpaces,
  getHistoryStatusBadge,
  getHistoryTypeBadge,
} from '../../utils/emailFormatUtils';

export default function PlatformEmailHistoryMobileCards({ flow }) {
  return (
    <div className="flex flex-col divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
      {flow.rows.map((r) => {
        const isSelected = flow.selectedRow?.id === r.id;
        const typeBadge = getHistoryTypeBadge(r.type);
        const statusBadge = getHistoryStatusBadge(r);
        const okWidth = r.total > 0 ? (r.ok / r.total) * 100 : 0;
        const failWidth = r.total > 0 ? (r.fail / r.total) * 100 : 0;

        return (
          <div
            key={r.id}
            role="button"
            tabIndex={0}
            onClick={() => flow.setSelectedId(r.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') flow.setSelectedId(r.id); }}
            className={`p-4 cursor-pointer transition ${
              isSelected
                ? 'bg-emerald-50/70 border-l-4 border-emerald-700 dark:bg-emerald-950/40'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeBadge.className}`}>
                {typeBadge.label}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
              {r.subject}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{r.audience}</p>

            <div className="mt-3 flex flex-col gap-1">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="bg-emerald-600" style={{ width: `${okWidth}%` }} />
                <div className="bg-rose-500" style={{ width: `${failWidth}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>
                  {r.queued > 0
                    ? `${r.ok} / ${r.total} yuborildi`
                    : r.fail > 0
                    ? `${r.ok} yetkazildi · ${r.fail} xato`
                    : 'Hammasi yetkazildi'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatNumberWithSpaces(r.total)} kishi
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{r.time}</span>
              <span>{r.sender}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
