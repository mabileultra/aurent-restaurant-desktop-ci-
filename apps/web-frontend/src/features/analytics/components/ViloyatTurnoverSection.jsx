import React from 'react';
import { formatCompact, formatPercent, calculateDeltaBadge } from '../utils/viloyatDetailUtils';

function PeriodMiniCard({ label, sub, amount, delta, emptyText }) {
  const isZero = amount === 0 || amount == null;
  const deltaObj = calculateDeltaBadge(delta);

  return (
    <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-1.5 shadow-xs">
      <div className="space-y-0.5">
        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 leading-tight">{sub}</p>
      </div>
      <div className="space-y-1.5 pt-1">
        <div className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${isZero ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
          {amount != null ? `${formatCompact(amount)} so‘m` : '—'}
        </div>
        {deltaObj ? (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
            deltaObj.isUp
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}>
            {deltaObj.text}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {amount == null ? "Ma'lumot kutilmoqda" : emptyText}
          </span>
        )}
      </div>
    </div>
  );
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
  return (
    <section aria-label="Pul aylanmasi" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* 1. Big Card: Umumiy aylanma */}
      <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Umumiy aylanma</h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              Butun davr
            </span>
          </div>
          <div className="space-y-0.5">
            <div className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${hasSales ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              {formatCompact(turnover.all)} so‘m
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasSales ? 'Tizimda qayd etilgan barcha savdo (2026-yil boshidan)' : 'Bu turdagi korxonalarda savdo qayd etilmagan'}
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

        {activeType === 'A' && hasSales && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Kunlik aylanma · 30 kun</span>
              <span className="text-slate-400 dark:text-slate-500">
                {dailyBars.length > 0 ? 'Dinamika' : 'Backend integratsiyasi kutilmoqda'}
              </span>
            </div>
            {dailyBars.length > 0 ? (
              <>
                <div className="h-14 flex items-end gap-0.5 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                  {dailyBars.map((b, i) => (
                    <span
                      key={i}
                      title={b.tip}
                      style={{ height: `${b.heightPercent}%` }}
                      className={`flex-1 rounded-t-xs transition-colors cursor-pointer ${
                        b.val ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>10-okt</span>
                  <span>24-okt</span>
                  <span>8-noy</span>
                </div>
              </>
            ) : (
              <div className="py-3 px-2 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/30 rounded-lg">
                Kunlik savdo dinamikasi: Backend orqali ma’lumotlar ulanishi kutilmoqda
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 4 Period Mini-Cards (2x2 grid) */}
      <div className="grid grid-cols-2 gap-3">
        <PeriodMiniCard
          label="Oylik"
          sub={`Oxirgi 30 kun · ${rangeLabel}`}
          amount={turnover.m30}
          delta={turnover.turnoverDeltaPct != null ? turnover.turnoverDeltaPct : null}
          emptyText="Savdo yo‘q"
        />
        <PeriodMiniCard
          label="Haftalik"
          sub="Oxirgi 7 kun"
          amount={turnover.d7}
          delta={null}
          emptyText="Savdo yo‘q"
        />
        <PeriodMiniCard
          label="Yillik"
          sub="2026-yil · Butun davr"
          amount={turnover.all}
          delta={null}
          emptyText="Savdo yo‘q"
        />
        <PeriodMiniCard
          label="Kunlik"
          sub="Bugun"
          amount={turnover.day}
          delta={null}
          emptyText={hasSales ? 'Oxirgi savdo qayd etilgan' : 'Savdo yo‘q'}
        />
      </div>

      {/* 3. Moliyaviy tahlil rasmli karta */}
      <figure className="relative min-h-[220px] md:min-h-0 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 shadow-xs group flex flex-col justify-end">
        <img
          src="/analytics/turnover-analytics.webp"
          alt={isDistrictView ? districtName : regionName}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
        <figcaption className="relative z-10 p-5 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 block tracking-wider uppercase">
            {isDistrictView ? 'Hududiy aylanma' : 'Viloyat aylanmasi'}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-xs">
            {(isDistrictView ? districtName : regionName) || regionName}
          </h3>
          <p className="text-xs text-slate-300/90 leading-tight">
            Moliyaviy tahlil va aylanma dinamikasi
          </p>
        </figcaption>
      </figure>
    </section>
  );
}
