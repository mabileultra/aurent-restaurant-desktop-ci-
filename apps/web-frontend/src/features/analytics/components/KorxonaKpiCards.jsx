import React from 'react';
import { formatNumber } from '../utils/korxonaDetailUtils';

const BADGE_STYLES = {
  up: 'bg-[#E7F6EE] text-[#0E7C4F] dark:bg-emerald-950/40 dark:text-emerald-300',
  down: 'bg-[#FDECEC] text-[#B42318] dark:bg-rose-950/40 dark:text-rose-300',
  info: 'bg-[#EAF1FE] text-[#1D4ED8] dark:bg-blue-950/50 dark:text-blue-300',
  mute: 'bg-[#EEF1F4] text-[#5B6472] dark:bg-slate-800 dark:text-slate-400',
};

export function KorxonaKpiCards({ cards = [] }) {
  return (
    <section aria-label="Pul aylanmasi" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-2 shadow-xs"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{c.label}</span>
            <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 leading-tight">{c.sub}</p>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${c.v > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              {formatNumber(c.v)} so‘m
            </div>
            {c.badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${BADGE_STYLES[c.badgeType] || BADGE_STYLES.mute}`}>
                {c.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default KorxonaKpiCards;
