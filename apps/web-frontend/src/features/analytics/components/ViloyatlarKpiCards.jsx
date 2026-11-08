import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { fmtPercent } from '../utils/analyticsFormat';

function DeltaBadge({ delta }) {
  if (delta == null) return null;
  const isUp = delta > 0;
  const isZero = delta === 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
        isZero
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          : isUp
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
      }`}
    >
      {isUp ? <ArrowUpRight size={13} className="shrink-0" /> : null}
      {!isUp && !isZero ? <ArrowDownRight size={13} className="shrink-0" /> : null}
      {isUp ? '+' : ''}{fmtPercent(delta)}
    </span>
  );
}

export default function ViloyatlarKpiCards({ kpis }) {
  return (
    <section
      aria-label="Respublika bo‘yicha jami"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {kpis.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs transition hover:shadow-sm"
        >
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {card.label}
          </span>
          <div className="flex items-center gap-2 flex-wrap my-2">
            <span className="text-2xl sm:text-[26px] font-bold text-slate-800 dark:text-white tabular-nums tracking-tight">
              {card.value}
            </span>
            <DeltaBadge delta={card.delta} />
            {card.badgeText ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 tabular-nums">
                {card.badgeText}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
            {card.hint}
          </span>
        </div>
      ))}
    </section>
  );
}
