import React from 'react';

export function KorxonaReceiptSlip({ receiptDetail, companyInfo }) {
  if (!receiptDetail) {
    return (
      <section
        aria-labelledby="rc-h"
        className="w-full max-w-[380px] lg:flex-[1_1_340px] xl:max-w-[380px] bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs"
      >
        <h2 id="rc-h" className="text-lg font-bold text-slate-900 dark:text-white">Chek</h2>
        <p className="py-16 text-center text-sm text-slate-400">Chap tomondagi ro‘yxatdan chekni tanlang</p>
      </section>
    );
  }

  const { isFiscal } = receiptDetail;

  return (
    <section
      aria-labelledby="rc-h"
      className="w-full max-w-[380px] lg:flex-[1_1_340px] xl:max-w-[380px] bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4.5 box-border flex flex-col gap-3.5 shrink-0 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="rc-h" className="text-lg font-bold text-slate-900 dark:text-white">Chek</h2>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
            isFiscal
              ? 'bg-[#E7F6EE] dark:bg-emerald-950/40 text-[#0E7C4F] dark:text-emerald-400'
              : 'bg-[#FDECEC] dark:bg-rose-950/40 text-[#B42318] dark:text-rose-400'
          }`}
        >
          {isFiscal ? 'Fiskallashtirilgan' : 'Fiskalsiz'}
        </span>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-[#FCFCFD] dark:bg-slate-950/60 p-4 space-y-3 text-[13px] leading-snug">
        <div className="text-center space-y-0.5">
          <span className="text-[15px] font-bold tracking-wider text-slate-900 dark:text-white block uppercase">
            {companyInfo?.name || 'Korxona'}
          </span>
          <span className="text-slate-500 text-xs block">
            {companyInfo?.legalName || companyInfo?.name || '—'} · STIR {companyInfo?.tin || '—'}
          </span>
          <span className="text-slate-400 text-xs block">{receiptDetail.storeName || companyInfo?.address || '—'}</span>
        </div>

        <div className="border-t border-dashed border-slate-300 dark:border-slate-700" />

        <dl className="space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-500 font-sans">Chek №</dt>
            <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">{receiptDetail.no}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 font-sans">Sana</dt>
            <dd className="text-slate-700 dark:text-slate-300 tabular-nums">{receiptDetail.when}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 font-sans">Kassir</dt>
            <dd className="text-slate-700 dark:text-slate-300 font-sans">{receiptDetail.cashierName || 'Kassir'}</dd>
          </div>
        </dl>

        <div className="border-t border-dashed border-slate-300 dark:border-slate-700" />

        <ul className="space-y-2.5">
          {receiptDetail.items?.map((item, idx) => (
            <li key={idx} className="space-y-0.5 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.name}</span>
              <div className="flex justify-between font-mono tabular-nums text-slate-500">
                <span>{item.line}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{item.total}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-dashed border-slate-300 dark:border-slate-700" />

        <dl className="space-y-1 font-mono text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <dt className="font-sans">QQSsiz summa</dt>
            <dd className="tabular-nums">{receiptDetail.subtotal}</dd>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <dt className="font-sans">QQS</dt>
            <dd className="tabular-nums">{receiptDetail.tax}</dd>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <dt className="font-sans">Chegirma</dt>
            <dd className="tabular-nums">0</dd>
          </div>
          <div className="flex justify-between pt-1 text-[15px] font-bold text-slate-900 dark:text-white font-sans">
            <dt>JAMI</dt>
            <dd className="font-mono tabular-nums">{receiptDetail.total} so‘m</dd>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <dt className="font-sans">{receiptDetail.payMethod}</dt>
            <dd className="tabular-nums">{receiptDetail.total}</dd>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <dt className="font-sans">Qaytim</dt>
            <dd className="tabular-nums">0</dd>
          </div>
        </dl>

        <div className="border-t border-dashed border-slate-300 dark:border-slate-700" />

        {isFiscal ? (
          <div className="flex items-center gap-3.5 pt-0.5">
            <div className="w-20 h-20 shrink-0 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-slate-500 shadow-2xs">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3z M20 14v.01 M14 20h.01 M17 20h4v-3" />
              </svg>
              <span className="text-[11px] font-bold mt-0.5">QR</span>
            </div>
            <dl className="flex-1 space-y-1 font-mono text-[11px] leading-tight">
              <div className="flex justify-between">
                <dt className="text-slate-500 font-sans">Fiskal belgi</dt>
                <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">{receiptDetail.fiscalSign}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 font-sans">Chek tartibi</dt>
                <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">{receiptDetail.fiscalSeq}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 font-sans">Fiskal modul</dt>
                <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">{receiptDetail.fiscalTerminalId || '—'}</dd>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block pt-0.5">QR orqali soliq.uz da tekshiriladi</span>
            </dl>
          </div>
        ) : (
          <div role="note" className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FDECEC] dark:bg-rose-950/40 text-[#B42318] dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-0.5">
              <path d="M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <div className="space-y-0.5 text-xs">
              <span className="font-bold block">Fiskallashtirilmagan</span>
              <span className="text-[11px] leading-tight block">Chek soliq serveriga yuborilmagan: fiskal belgi va QR-kod yo‘q.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default KorxonaReceiptSlip;
