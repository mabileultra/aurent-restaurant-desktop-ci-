import React from 'react';
import { formatNumber } from '../utils/korxonaDetailUtils';

export function KorxonaHeaderCard({ info, companyInfo }) {
  const data = companyInfo || info || {};
  const {
    name,
    monogram = 'MM',
    legalName,
    tin,
    businessType,
    isConnected,
    avgCheck,
    totalChecks30d,
    address,
    phone,
    storesCount,
    storeName,
    fiscalModule,
  } = data;

  return (
    <section aria-label="Korxona haqida" className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 space-y-4 shadow-xs">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <span
            aria-hidden="true"
            className="w-13 h-13 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-lg inline-flex items-center justify-center shrink-0"
          >
            {monogram}
          </span>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                {isConnected ? 'Ulangan' : 'Ulanmagan'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                {businessType}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {legalName} · STIR {tin}
            </p>
          </div>
        </div>

        {/* Right Metric Highlights */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 dark:text-slate-500 block">O‘rtacha chek</span>
            <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
              {formatNumber(avgCheck)} so‘m
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 dark:text-slate-500 block">Cheklar · 30 kun</span>
            <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
              {totalChecks30d} ta
            </span>
          </div>
        </div>
      </div>

      {/* Meta Definition List */}
      <dl className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-7 gap-y-2 text-xs sm:text-[13px] leading-relaxed">
        <div className="inline-flex gap-1.5 items-center">
          <dt className="text-slate-500">Manzil:</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-200">{address}</dd>
        </div>
        <div className="inline-flex gap-1.5 items-center">
          <dt className="text-slate-500">Telefon:</dt>
          <dd className="font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">{phone}</dd>
        </div>
        <div className="inline-flex gap-1.5 items-center">
          <dt className="text-slate-500">Do‘konlar:</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-200">{storesCount} ta · {storeName}</dd>
        </div>
        <div className="inline-flex gap-1.5 items-center">
          <dt className="text-slate-500">Fiskal modul:</dt>
          <dd className="font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">{fiscalModule}</dd>
        </div>
      </dl>
    </section>
  );
}

export default KorxonaHeaderCard;
