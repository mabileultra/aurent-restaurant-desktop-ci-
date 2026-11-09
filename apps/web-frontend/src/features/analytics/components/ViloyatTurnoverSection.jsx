import React, { useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { formatCompact, formatPercent, calculateDeltaBadge } from '../utils/viloyatDetailUtils';

function PeriodMiniCard({ label, sub, amount, delta, emptyText }) {
  const isZero = !Number(amount);
  const deltaObj = calculateDeltaBadge(delta);

  return (
    <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-1.5 shadow-xs">
      <div className="space-y-0.5">
        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 leading-tight">{sub}</p>
      </div>
      <div className="space-y-1.5 pt-1">
        <div className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${isZero ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
          {formatCompact(amount)} so‘m
        </div>
        {deltaObj ? (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
            deltaObj.isUp
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}>
            {deltaObj.text}
          </span>
        ) : (isZero && emptyText) ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {emptyText}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function peakFromBars(dailyBars = []) {
  let best = null;
  dailyBars.forEach((b) => {
    if (!b?.val) return;
    if (!best || b.val > best.val) best = b;
  });
  if (!best) return null;
  const label = String(best.tip || '').split(':')[0] || best.date || '';
  return { label, amount: best.val };
}

export default function ViloyatTurnoverSection({
  regionName,
  turnover,
  hasSales,
  fShare,
  dailyBars,
  activeType,
  isDistrictView = false,
  districtName = null,
  rangeLabel = '10-okt – 8-noy',
}) {
  const yearAmount = turnover.year != null ? Number(turnover.year) : Number(turnover.all || 0);
  const monthAmount = Number(turnover.m30 ?? turnover.all ?? 0);
  const weekAmount = Number(turnover.d7 || 0);
  const dayAmount = Number(turnover.day || 0);
  const peak = useMemo(() => peakFromBars(dailyBars), [dailyBars]);
  const barEdgeLabels = useMemo(() => {
    if (!dailyBars?.length) return { start: '—', mid: '—', end: '—' };
    const start = String(dailyBars[0]?.tip || '').split(':')[0] || '—';
    const mid = String(dailyBars[Math.floor(dailyBars.length / 2)]?.tip || '').split(':')[0] || '—';
    const end = String(dailyBars[dailyBars.length - 1]?.tip || '').split(':')[0] || '—';
    return { start, mid, end };
  }, [dailyBars]);

  return (
    <section aria-label="Pul aylanmasi" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Umumiy aylanma</h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              Oxirgi 30 kun
            </span>
          </div>
          <div className="space-y-0.5">
            <div className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${hasSales ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              {formatCompact(monthAmount)} so‘m
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasSales
                ? `Tanlangan davr · ${rangeLabel}`
                : 'Bu turdagi korxonalarda savdo qayd etilmagan'}
            </p>
          </div>
        </div>

        {hasSales && (
          <div className="space-y-2">
            <div role="img" aria-label={`Fiskal ${formatPercent(fShare)}, nofiskal ${formatPercent(100 - fShare)}`} className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <span style={{ width: `${fShare}%` }} className="h-full bg-blue-600 transition-all" />
              <span className="flex-1 h-full bg-blue-300 dark:bg-blue-400" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-blue-600" />
                Fiskal {formatCompact(turnover.allF)} · {formatPercent(fShare)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-blue-300 dark:bg-blue-400" />
                Nofiskal {formatCompact(turnover.allN)} · {formatPercent(100 - fShare)}
              </span>
            </div>
          </div>
        )}

        {activeType === 'A' && hasSales && dailyBars.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Kunlik aylanma · 30 kun</span>
              {peak ? (
                <span className="text-slate-400 dark:text-slate-500 shrink-0">
                  Eng yuqori: {peak.label}, {formatCompact(peak.amount)}
                </span>
              ) : null}
            </div>
            <div className="h-14 flex items-end gap-0.5 border-b border-slate-200 dark:border-slate-800 pb-0.5">
              {dailyBars.map((b, i) => (
                <span
                  key={b.date || i}
                  title={b.tip}
                  style={{ height: `${b.heightPercent}%` }}
                  className={`flex-1 rounded-t-xs transition-colors cursor-pointer ${
                    b.val ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{barEdgeLabels.start}</span>
              <span>{barEdgeLabels.mid}</span>
              <span>{barEdgeLabels.end}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PeriodMiniCard
          label="Oylik"
          sub={`Oxirgi 30 kun · ${rangeLabel}`}
          amount={monthAmount}
          delta={turnover.turnoverDeltaPct != null ? turnover.turnoverDeltaPct : null}
          emptyText="Savdo yo‘q"
        />
        <PeriodMiniCard
          label="Haftalik"
          sub="Oxirgi 7 kun"
          amount={weekAmount}
          delta={turnover.weekDeltaPct != null ? turnover.weekDeltaPct : null}
          emptyText="Savdo yo‘q"
        />
        <PeriodMiniCard
          label="Yillik"
          sub="2026-yil · Yil boshidan"
          amount={yearAmount}
          delta={null}
          emptyText="Savdo yo‘q"
        />
        <PeriodMiniCard
          label="Kunlik"
          sub="Bugun"
          amount={dayAmount}
          delta={null}
          emptyText={hasSales ? 'Bugun hali savdo yo‘q' : 'Savdo yo‘q'}
        />
      </div>

      <figure className="min-h-[220px] md:min-h-0 border-2 border-dashed border-slate-300/80 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center gap-3 p-6 text-center shadow-xs">
        <span className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ImageIcon size={26} strokeWidth={1.8} />
        </span>
        <figcaption className="space-y-1">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">
            {isDistrictView ? 'Tuman rasmi' : 'Viloyat rasmi'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            {(isDistrictView ? districtName : regionName) || regionName} surati shu yerga qo‘yiladi
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
