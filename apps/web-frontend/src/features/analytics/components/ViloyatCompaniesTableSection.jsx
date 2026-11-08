import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PlatformSelect from '../../platform/components/PlatformSelect';
import ViloyatCompanyTableRow from './ViloyatCompanyTableRow';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'on', label: 'Ulangan' },
  { value: 'off', label: 'Ulanmagan' },
];

export default function ViloyatCompaniesTableSection({
  regionCode,
  searchQuery,
  onSearchChange,
  districtOptions,
  selectedDistrict,
  onDistrictChange,
  selectedStatus,
  onStatusChange,
  tableData,
  onPrevPage,
  onNextPage,
}) {
  const { rows, total, from, to, page, totalPages } = tableData;
  const companyLink = (id) => (
    regionCode ? `/platform/analytics/viloyatlar/${regionCode}/companies/${id}` : `/platform/analytics/companies/${id}`
  );

  return (
    <section aria-labelledby="companies-table-heading" className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="p-4 sm:p-5 pb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="companies-table-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Korxonalar <span className="font-normal text-slate-400">· {total} ta</span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Korxonani bosing — batafsil ma’lumot ochiladi
        </span>
      </div>

      {/* Filters Bar */}
      <div className="px-4 sm:px-5 pb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] sm:min-w-[280px] h-10 sm:h-11 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex items-center gap-2">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="search"
            aria-label="Nomi yoki STIR bo‘yicha qidirish"
            placeholder="Nomi yoki STIR bo‘yicha qidirish"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-0 outline-hidden text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Tuman:</span>
          <PlatformSelect
            value={selectedDistrict}
            onChange={onDistrictChange}
            options={districtOptions}
            size="sm"
            aria-label="Tuman bo‘yicha filtr"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Holati:</span>
          <PlatformSelect
            value={selectedStatus}
            onChange={onStatusChange}
            options={STATUS_OPTIONS}
            size="sm"
            aria-label="Holat bo‘yicha filtr"
          />
        </div>
      </div>

      {/* Table Responsive Wrapper */}
      <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-100 dark:border-slate-800">
              <th scope="col" className="py-3 pl-5 pr-2 w-10">№</th>
              <th scope="col" className="py-3 px-2">Korxona</th>
              <th scope="col" className="py-3 px-2">STIR / JShShIR</th>
              <th scope="col" className="py-3 px-2">Tuman</th>
              <th scope="col" className="py-3 px-2">Faoliyat turi</th>
              <th scope="col" className="py-3 px-2">Holati</th>
              <th scope="col" className="py-3 px-2 text-right">Aylanma · 30 kun ↓</th>
              <th scope="col" className="py-3 px-2 text-right">Hafta o‘zgarishi</th>
              <th scope="col" className="py-3 pr-5 pl-2 w-10"><span className="sr-only">Ochish</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.map((row) => (
              <ViloyatCompanyTableRow
                key={row.id}
                row={row}
                targetUrl={companyLink(row.id)}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 px-4 text-center text-slate-400 text-sm">
                  Hech narsa topilmadi. Qidiruv yoki filtrlarni o‘zgartirib ko‘ring.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="text-slate-500 font-mono tabular-nums">
          {from}–{to} / {total} ta korxona
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page === 0}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft size={16} />
            Oldingi
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages - 1}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Keyingi
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
