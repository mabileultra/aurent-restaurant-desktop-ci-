import React from 'react';
import { Calendar, Search } from 'lucide-react';
import {
  formatNumberWithSpaces,
  getHistoryStatusBadge,
  getHistoryTypeBadge,
} from '../../utils/emailFormatUtils';
import PlatformEmailHistoryMobileCards from './PlatformEmailHistoryMobileCards';

export default function PlatformEmailHistoryTable({ flow }) {
  const hasRows = flow.rows && flow.rows.length > 0;

  return (
    <section className="flex flex-[1.6] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Yuborilgan xabarlar</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {flow.types.map((t) => {
              const active = flow.typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => flow.setTypeFilter(t.id)}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-800 text-white shadow-sm dark:bg-emerald-600'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={flow.search}
              onChange={(e) => flow.setSearch(e.target.value)}
              placeholder="Mavzu yoki email..."
              className="h-8 w-40 rounded-xl border border-slate-300 pl-8 pr-2.5 text-xs outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              value={flow.dateFilter}
              onChange={(e) => flow.setDateFilter(e.target.value)}
              aria-label="Sana bo‘yicha filtr"
              className="h-8 rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              {(flow.datePresets || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasRows ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Xabar topilmadi</p>
          <p className="text-xs text-slate-500 mt-1">Qidiruv so‘zi yoki filtrlarni o‘zgartirib ko‘ring</p>
          <button
            type="button"
            onClick={flow.clearFilters}
            className="mt-3 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <PlatformEmailHistoryMobileCards flow={flow} />

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="p-3 pl-5 font-semibold">Xabar</th>
                  <th className="p-3 text-right font-semibold">Kimga</th>
                  <th className="p-3 font-semibold w-48">Natija</th>
                  <th className="p-3 pr-5 font-semibold">Vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {flow.rows.map((r) => {
                  const isSelected = flow.selectedRow?.id === r.id;
                  const typeBadge = getHistoryTypeBadge(r.type);
                  const statusBadge = getHistoryStatusBadge(r);
                  const okWidth = r.total > 0 ? (r.ok / r.total) * 100 : 0;
                  const failWidth = r.total > 0 ? (r.fail / r.total) * 100 : 0;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => flow.setSelectedId(r.id)}
                      className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        isSelected
                          ? 'bg-emerald-50/60 shadow-[inset_3px_0_0_#006847] dark:bg-emerald-950/30'
                          : ''
                      }`}
                    >
                      <td className="p-3 pl-5 align-top">
                        <div className="flex flex-col gap-1">
                          <span className={`self-start rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeBadge.className}`}>
                            {typeBadge.label}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{r.subject}</span>
                          <span className="text-xs text-slate-500">{r.audience}</span>
                        </div>
                      </td>
                      <td className="p-3 align-top text-right font-semibold text-slate-900 dark:text-white">
                        {formatNumberWithSpaces(r.total)}
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className={`self-start rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="bg-emerald-600" style={{ width: `${okWidth}%` }} />
                            <div className="bg-rose-500" style={{ width: `${failWidth}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">
                            {r.queued > 0
                              ? `${r.ok} / ${r.total} yuborildi`
                              : r.fail > 0
                              ? `${r.ok} yetkazildi · ${r.fail} xato`
                              : 'Hammasi yetkazildi'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 pr-5 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-white">{r.time}</span>
                          <span className="text-xs text-slate-500">{r.sender}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 p-3 px-5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <span className="font-medium">{flow.paginationLabel}</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={!flow.canPrev}
            onClick={flow.handlePrevPage}
            className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Oldingi
          </button>
          <button
            type="button"
            disabled={!flow.canNext}
            onClick={flow.handleNextPage}
            className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Keyingi
          </button>
        </div>
      </div>
    </section>
  );
}
