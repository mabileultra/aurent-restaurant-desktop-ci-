import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Building, MapPinOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fmtMoney, fmtPercent } from '../utils/analyticsFormat';

function RegionDeltaBadge({ delta, turnover, connected }) {
  if (turnover === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
        {connected > 0 ? 'Savdo yo‘q' : 'Ulanmagan'}
      </span>
    );
  }
  if (delta == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
        Taqqoslash yo‘q
      </span>
    );
  }
  const isUp = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
        isUp
          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30'
          : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30'
      }`}
    >
      {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {isUp ? '+' : ''}{fmtPercent(delta)}
    </span>
  );
}

function ChromaDecorations() {
  return (
    <>
      <span className="chroma-wash" aria-hidden="true" />
      <span className="chroma-card-glow" aria-hidden="true" />
    </>
  );
}

export function ViloyatActiveCard({ region }) {
  const sharePct = region.companies > 0
    ? Math.round((region.connected / region.companies) * 1000) / 10
    : 0;

  const accent = region.turnoverDeltaPct > 0
    ? '#10b981'
    : (region.turnoverDeltaPct < 0 ? '#f43f5e' : '#10b981');

  const cardTarget = region.link || `/platform/analytics/viloyatlar/${region.code}`;

  return (
    <Link
      to={cardTarget}
      className="chroma-card group bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 transition hover:shadow-lg hover:border-emerald-500/50 dark:hover:bg-slate-900/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
      data-chroma-area=""
      style={{ '--chroma-accent': accent }}
      aria-label={`${region.name}: ${region.companies} korxona, aylanma ${fmtMoney(region.turnover)}`}
    >
      <ChromaDecorations />
      <div className="relative z-[1] flex flex-col justify-between gap-4 h-full">
        <div className="flex items-start justify-between gap-2">
          <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
            {region.name}
          </span>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition shrink-0 mt-0.5" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400 font-medium">Aylanma</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {fmtMoney(region.turnover)}
            </span>
            <RegionDeltaBadge
              delta={region.turnoverDeltaPct}
              turnover={region.turnover}
              connected={region.connected}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              <b className="font-bold text-slate-900 dark:text-white tabular-nums">{region.companies}</b> korxona
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              {fmtPercent(sharePct)} ulangan
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-xs shadow-emerald-500/50"
              style={{ width: `${Math.min(100, Math.max(0, sharePct))}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {region.connected} ta ulangan, {Math.max(0, region.companies - region.connected)} ta ulanmagan
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Fiskal ulush</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
            {region.fiscalSharePct != null ? fmtPercent(region.fiscalSharePct) : '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ViloyatEmptyCard({ region }) {
  return (
    <div
      className="chroma-card bg-slate-50/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between min-h-[220px]"
      data-chroma-area=""
      style={{ '--chroma-accent': '#94a3b8' }}
    >
      <ChromaDecorations />
      <div className="relative z-[1] flex flex-col justify-between h-full">
        <span className="text-base font-semibold text-slate-600 dark:text-slate-400">
          {region.name}
        </span>
        <div className="flex items-center gap-3 mt-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
            <Building size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">0 korxona</span>
            <span className="text-xs text-slate-400">Bu hududda hali korxona yo‘q</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ViloyatUnassignedCard({ unassigned }) {
  return (
    <div
      className="chroma-card bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border-2 border-dashed border-amber-300 dark:border-amber-500/40 rounded-xl p-5 flex flex-col justify-between gap-4"
      data-chroma-area=""
      style={{ '--chroma-accent': '#f59e0b' }}
    >
      <ChromaDecorations />
      <div className="relative z-[1] flex flex-col justify-between gap-4 h-full">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <MapPinOff size={18} className="shrink-0" />
          <span className="text-base font-bold">Hududi ko‘rsatilmagan</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400 font-medium">Aylanma</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {fmtMoney(unassigned.turnover)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              <b className="font-bold text-slate-900 dark:text-white tabular-nums">{unassigned.companies}</b> korxona
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              {fmtPercent(unassigned.sharePct)} ulangan
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-xs shadow-emerald-500/50"
              style={{ width: `${Math.min(100, Math.max(0, unassigned.sharePct))}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto">
          Korxona kartasida viloyat tanlanmagan, shuning uchun ular hech bir viloyat hisobiga kirmaydi.
        </p>
      </div>
    </div>
  );
}
