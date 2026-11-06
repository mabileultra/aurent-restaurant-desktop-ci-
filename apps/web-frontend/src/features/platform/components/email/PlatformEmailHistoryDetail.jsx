import React from 'react';
import { Mail, RotateCcw } from 'lucide-react';
import { formatNumberWithSpaces, getHistoryTypeBadge } from '../../utils/emailFormatUtils';

export default function PlatformEmailHistoryDetail({ selectedRow, onRetryFails, onCopyDraft }) {
  if (!selectedRow) {
    return (
      <aside className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[320px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Xabar tanlanmagan</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
          Tafsilotlar, auditoriya va yetkazilmagan xatlarni ko‘rish uchun ro‘yxatdan xabarni tanlang.
        </p>
      </aside>
    );
  }

  const typeBadge = getHistoryTypeBadge(selectedRow.type);
  const hasFails = selectedRow.fails && selectedRow.fails.length > 0;
  const isAllDelivered = selectedRow.ok === selectedRow.total && selectedRow.fail === 0 && (!selectedRow.queued || selectedRow.queued === 0);
  const isInProgress = !hasFails && selectedRow.total > 0 && selectedRow.ok < selectedRow.total;

  return (
    <aside className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1.5 border-b border-slate-100 p-5 dark:border-slate-800">
        <span className={`inline-flex self-start rounded-md px-2 py-0.5 text-xs font-semibold ${typeBadge.className}`}>
          {typeBadge.label}
        </span>
        <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {selectedRow.subject}
        </h2>
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {selectedRow.time} · {selectedRow.sender}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 dark:text-slate-400">Jami</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumberWithSpaces(selectedRow.total)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 dark:text-slate-400">Yetkazildi</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {formatNumberWithSpaces(selectedRow.ok)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 dark:text-slate-400">Xato</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
            {formatNumberWithSpaces(selectedRow.fail)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-b border-slate-100 p-5 text-xs dark:border-slate-800">
        <span className="text-slate-600 dark:text-slate-400">Auditoriya</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRow.audience}</span>
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Yetkazilmaganlar</h3>
        {hasFails ? (
          <>
            <div className="flex flex-col gap-2">
              {selectedRow.fails.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-0.5 rounded-xl border border-rose-200 bg-rose-50/50 p-2.5 text-xs dark:border-rose-900/40 dark:bg-rose-950/20"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{f.who}</span>
                  <span className="text-slate-600 dark:text-slate-400">{f.email}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">{f.reason}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onRetryFails(selectedRow.id)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xatolarni qayta yuborish
            </button>
          </>
        ) : isInProgress ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            <span className="font-bold block">Xat yuborish davom etmoqda</span>
            <span className="text-slate-600 dark:text-slate-300 mt-0.5 block">
              {selectedRow.total} tadan {selectedRow.ok} tasi yetkazildi, {selectedRow.total - selectedRow.ok} tasi kutilmoqda.
            </span>
          </div>
        ) : isAllDelivered ? (
          <p className="rounded-xl bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Barcha xatlar muvaffaqiyatli yetkazildi.
          </p>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Hozircha xatoliklar mavjud emas.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onCopyDraft}
          className="flex-1 h-9 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Nusxa olib yozish
        </button>
      </div>
    </aside>
  );
}
