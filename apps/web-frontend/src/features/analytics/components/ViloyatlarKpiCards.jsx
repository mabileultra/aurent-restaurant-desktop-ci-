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
          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
          : isUp
          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30'
          : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30'
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
          className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs transition hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700/80"
        >
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 font-medium">
            {card.label}
          </span>
          <div className="flex items-center gap-2 flex-wrap my-2">
            <span className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {card.value}
            </span>
            <DeltaBadge delta={card.delta} />
            {card.badgeText ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 tabular-nums">
                {card.badgeText}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-slate-400 line-clamp-1">
            {card.hint}
          </span>
        </div>
      ))}
    </section>
  );
}
