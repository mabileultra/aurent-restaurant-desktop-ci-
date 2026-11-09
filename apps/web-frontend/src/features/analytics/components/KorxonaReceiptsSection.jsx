import React from 'react';
import { formatNumber } from '../utils/korxonaDetailUtils';
import { KorxonaReceiptSlip } from './KorxonaReceiptSlip';
import { KorxonaReceiptsPagination } from './KorxonaReceiptsPagination';
import { KorxonaReceiptRow } from './KorxonaReceiptRow';

function DayNavBtn({ dir, onClick, disabled, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-10 h-10 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}

export function KorxonaReceiptsSection({
  companyInfo,
  dayChips = [],
  selectedDay,
  dayIndex = 0,
  hasPrevDay,
  hasNextDay,
  onPrevDay,
  onNextDay,
  onSelectDay,
  fiscalKind,
  setFiscalKind,
  dayReceipts = [],
  pagedReceipts,
  totalFiscal = 0,
  totalNonFiscal = 0,
  dayTotalCount = 0,
  dayTotal = 0,
  dayTotalFormatted,
  totalReceiptsCount,
  selectedReceiptNo,
  onSelectReceipt,
  receiptDetail,
  receiptPage = 0,
  receiptFrom,
  receiptTo,
  receiptTotalPages = 1,
  receiptTotalCount,
  onPrevReceiptPage,
  onNextReceiptPage,
}) {
  const currentChip = dayChips[dayIndex] || dayChips[0];
  const fiscalFilters = [
    { key: 'all', label: `Hammasi ${dayTotalCount}` },
    { key: 'f', label: `Fiskal ${totalFiscal}` },
    { key: 'n', label: `Fiskalsiz ${totalNonFiscal}` },
  ];
  const visibleReceipts = pagedReceipts || dayReceipts;
  const totalCount = receiptTotalCount ?? dayReceipts.length;
  const from = receiptFrom ?? (totalCount === 0 ? 0 : 1);
  const to = receiptTo ?? visibleReceipts.length;
  const totalPages = receiptTotalPages ?? 1;

  return (
    <div className="flex flex-wrap gap-4 items-start">
      <section
        aria-labelledby="ch-h"
        className="flex-1 lg:flex-[999_1_620px] min-w-0 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col overflow-hidden shadow-xs"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 id="ch-h" className="text-lg font-bold text-slate-900 dark:text-white">Cheklar</h2>
            <span className="text-xs text-slate-500">{dayChips.length} ta savdo kuni · {totalReceiptsCount || dayTotalCount} ta chek · oxirgi 30 kun</span>
          </div>
          <div className="flex items-center gap-2">
            <DayNavBtn dir="left" onClick={onPrevDay} disabled={!hasPrevDay} label="Oldingi savdo kuni" />
            <span className="min-w-32 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
              {currentChip?.longLabel || currentChip?.label || '—'}
            </span>
            <DayNavBtn dir="right" onClick={onNextDay} disabled={!hasNextDay} label="Keyingi savdo kuni" />
          </div>
        </div>

        {/* Day Chips */}
        <div role="group" aria-label="Savdo kunlari" className="px-4 sm:px-5 pb-3.5 flex gap-2 overflow-x-auto no-scrollbar">
          {dayChips.map((chip) => {
            const isSelected = chip.date === selectedDay;
            return (
              <button
                key={chip.date}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectDay(chip.date)}
                className={`shrink-0 flex flex-col items-center px-3.5 py-1.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold leading-tight">
                  {chip.label || chip.shortLabel}
                  {chip.hasPending && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300 ring-1 ring-white' : 'bg-rose-500'}`} />
                  )}
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'}`}>
                  {chip.sub || chip.subText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Tabs & Day Total */}
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Fiskal holati bo‘yicha" className="flex gap-1 p-1 bg-[#EEF2F7] dark:bg-slate-800 rounded-xl">
            {fiscalFilters.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={fiscalKind === tab.key}
                onClick={() => setFiscalKind(tab.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  fiscalKind === tab.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Kun jami: <b className="text-slate-900 dark:text-white font-bold">{dayTotalFormatted || `${formatNumber(dayTotal)} so‘m`}</b>
          </span>
        </div>

        {/* Receipts Table */}
        <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
          <div className="min-w-[620px]">
            <div
              aria-hidden="true"
              className="grid grid-cols-[minmax(160px,1.5fr)_64px_72px_70px_minmax(110px,1fr)_90px] gap-2 px-5 py-2.5 bg-[#F8FAFB] dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
            >
              <span>Chek raqami</span>
              <span>Vaqt</span>
              <span>To‘lov</span>
              <span className="text-right">Tovar</span>
              <span className="text-right">Summa, so‘m</span>
              <span>Holati</span>
            </div>
            <ul aria-label="Kun cheklari" className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-128 overflow-y-auto">
              {visibleReceipts.map((r) => (
                <KorxonaReceiptRow
                  key={r[0]}
                  receipt={r}
                  isSelected={r[0] === selectedReceiptNo}
                  onSelect={onSelectReceipt}
                />
              ))}
              {visibleReceipts.length === 0 && (
                <li className="py-12 text-center text-xs text-slate-400">Bu kunda bunday chek topilmadi</li>
              )}
            </ul>
          </div>
        </div>

        <KorxonaReceiptsPagination
          page={receiptPage}
          from={from}
          to={to}
          totalCount={totalCount}
          totalPages={totalPages}
          onPrevPage={onPrevReceiptPage}
          onNextPage={onNextReceiptPage}
        />
      </section>

      <KorxonaReceiptSlip receiptDetail={receiptDetail} companyInfo={companyInfo} />
    </div>
  );
}

export default KorxonaReceiptsSection;
