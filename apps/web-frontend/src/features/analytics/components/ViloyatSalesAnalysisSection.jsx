import React from 'react';
import { TrendingUp, TrendingDown, MapPin, AlertTriangle } from 'lucide-react';
import DonutGauge from './DonutGauge';
import { formatCompact, formatPercent } from '../utils/viloyatDetailUtils';

export default function ViloyatSalesAnalysisSection({
  turnover,
  fiscalRing,
  connRing,
  connPercent,
  currentTypeConfig,
  topProducts,
  lowProducts,
  districtsBreakdown,
  isDistrictView = false,
}) {
  const fShareText = formatPercent(turnover.f30);
  const connShareText = formatPercent(connPercent);
  const quietDistricts = districtsBreakdown.quietCount;
  const districtsNote = isDistrictView
    ? 'Ushbu hudud bo‘yicha tahlil ko‘rsatilgan'
    : (quietDistricts > 0
      ? `Yana ${quietDistricts} ta tumanda korxona bor, lekin 30 kunda savdo yo‘q`
      : 'Korxonasi bor barcha tumanlar ko‘rsatilgan');

  return (
    <section aria-labelledby="sales-analysis-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sales-analysis-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Savdo tahlili
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Oxirgi 30 kun · 10-oktabr – 8-noyabr
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: 2 Donut Gauges */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-around gap-4 shadow-xs">
          <DonutGauge
            label="Fiskal ulush"
            valueText={fShareText}
            greenLabel={turnover.f30 == null ? 'Fiskal: savdo yo‘q' : `Fiskal — ${fShareText}`}
            redLabel={turnover.f30 == null ? 'Nofiskal: savdo yo‘q' : `Nofiskal — ${formatPercent(100 - turnover.f30)}`}
            ring={fiscalRing}
            ariaLabel={`Fiskal ${fShareText}`}
          />
          <div className="border-t border-slate-100 dark:border-slate-800" />
          <DonutGauge
            label="Ulangan korxonalar"
            valueText={connShareText}
            greenLabel={`Ulangan — ${currentTypeConfig.c} ta`}
            redLabel={`Ulanmagan — ${currentTypeConfig.n - currentTypeConfig.c} ta`}
            ring={connRing}
            ariaLabel={`Ulangan korxonalar ${connShareText}`}
          />
        </div>

        {/* Card 2: Eng ko‘p sotilgan tovarlar */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingUp size={16} strokeWidth={2.2} />
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Eng ko‘p sotilgan tovarlar</h3>
          </div>

          {topProducts.length > 0 ? (
            <ol className="space-y-3">
              {topProducts.map((p) => (
                <li key={p.rank} className="space-y-1">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="w-4 font-bold text-slate-400 tabular-nums shrink-0">{p.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div title={p.name} className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.company} · {p.qty.toLocaleString('ru-RU')} dona</div>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white shrink-0">{formatCompact(p.amount)} so‘m</span>
                  </div>
                  <div className="ml-6 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div style={{ width: `${p.barPercent}%` }} className="h-full bg-blue-600 rounded-full" />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="my-auto text-xs text-slate-400 text-center">Bu turdagi korxonalarda 30 kun ichida sotuv qayd etilmagan</p>
          )}
        </div>

        {/* Card 3: Eng kam sotilgan tovarlar */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-center shrink-0">
              <TrendingDown size={16} strokeWidth={2.2} />
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Eng kam sotilgan tovarlar</h3>
          </div>

          {lowProducts.length > 0 ? (
            <ol className="space-y-3">
              {lowProducts.map((p) => (
                <li key={p.rank} className="space-y-1">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="w-4 font-bold text-slate-400 tabular-nums shrink-0">{p.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div title={p.name} className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.company} · {p.qty.toLocaleString('ru-RU')} dona</div>
                      {p.isSuspiciousPrice && (
                        <span className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-semibold">
                          <AlertTriangle size={10} />
                          Narx {p.unitPrice.toLocaleString('ru-RU')} so‘m — tekshiring
                        </span>
                      )}
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white shrink-0">{formatCompact(p.amount)} so‘m</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="my-auto text-xs text-slate-400 text-center">Bu turdagi korxonalarda 30 kun ichida sotuv qayd etilmagan</p>
          )}
        </div>

        {/* Card 4: Tumanlar bo‘yicha aylanma */}
        <div className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-center shrink-0">
              <MapPin size={16} strokeWidth={2} />
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isDistrictView ? 'Korxonalar bo‘yicha aylanma' : 'Tumanlar bo‘yicha aylanma'}
            </h3>
          </div>

          {districtsBreakdown.districts.length > 0 ? (
            <ul className="space-y-3">
              {districtsBreakdown.districts.map((d) => (
                <li key={d.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">
                      <b className="font-semibold text-slate-800 dark:text-slate-200">{d.name}</b>
                      <span className="text-slate-400"> · {d.count} korxona</span>
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white shrink-0">{formatCompact(d.turnover)} so‘m</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(2, (d.turnover / districtsBreakdown.maxTurnover) * 100)}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="my-auto text-xs text-slate-400 text-center">Hech bir tumanda savdo qayd etilmagan</p>
          )}

          <p className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-tight">
            {districtsNote}
          </p>
        </div>
      </div>
    </section>
  );
}
