import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import KorxonaCenterDonut from './KorxonaCenterDonut';

export function KorxonaProductsAndFiscalSection({
  donuts = [],
  products = [],
  totalProductsCount = 0,
  productSort = 'sum',
  onSortChange,
  setProductSort,
  productPage = 0,
  productFrom = 1,
  productTo = 10,
  productTotalPages = 1,
  onPrevProductPage,
  onNextProductPage,
}) {
  const handleSortChange = onSortChange || setProductSort;

  return (
    <div className="flex flex-wrap gap-4 items-stretch">
      {/* Left: Fiskal holati */}
      <section
        aria-labelledby="fiscal-status-heading"
        className="flex-1 lg:flex-[1_1_360px] max-w-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between gap-5 shadow-xs"
      >
        <div className="space-y-0.5">
          <h2 id="fiscal-status-heading" className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
            Fiskal holati
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Oxirgi 30 kun · 43 ta chek
          </span>
        </div>

        <div className="space-y-5">
          {donuts.map((d, i) => (
            <KorxonaCenterDonut key={i} {...d} />
          ))}
        </div>
      </section>

      {/* Right: Eng ko‘p urilgan tovarlar */}
      <section
        aria-labelledby="top-products-heading"
        className="flex-1 lg:flex-[999_1_560px] min-w-0 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xs overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 id="top-products-heading" className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              Eng ko‘p urilgan tovarlar
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Oxirgi 30 kun · {totalProductsCount} xil tovar
            </span>
          </div>

          {/* Sort Switcher */}
          <div role="group" aria-label="Tartiblash" className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg inline-flex gap-1">
            <button
              type="button"
              aria-pressed={productSort === 'sum'}
              onClick={() => handleSortChange?.('sum')}
              className={`h-8 px-3 rounded-md text-xs font-semibold transition cursor-pointer ${
                productSort === 'sum'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Summa bo‘yicha
            </button>
            <button
              type="button"
              aria-pressed={productSort === 'qty'}
              onClick={() => handleSortChange?.('qty')}
              className={`h-8 px-3 rounded-md text-xs font-semibold transition cursor-pointer ${
                productSort === 'qty'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Soni bo‘yicha
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                <th scope="col" className="py-2 px-1.5 font-semibold w-8">№</th>
                <th scope="col" className="py-2 px-1.5 font-semibold">Tovar</th>
                <th scope="col" className="py-2 px-1.5 font-semibold text-right w-24">Soni</th>
                <th scope="col" className="py-2 px-1.5 font-semibold text-right w-32">Summa</th>
                <th scope="col" className="py-2 px-1.5 font-semibold w-36">Ulushi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {products.map((p) => (
                <tr key={p.rank} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-1.5 text-slate-400 font-mono tabular-nums">{p.rank}</td>
                  <td title={p.name} className="py-2.5 px-1.5 font-semibold text-slate-800 dark:text-slate-200 max-w-[280px] truncate">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-1.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {p.qty}
                  </td>
                  <td className="py-2.5 px-1.5 text-right font-bold font-mono tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                    {p.amount}
                  </td>
                  <td className="py-2.5 px-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div style={{ width: p.barWidth }} className="h-full bg-blue-600 rounded-full" />
                      </div>
                      <span className="w-11 text-right text-xs text-slate-400 font-mono tabular-nums shrink-0">
                        {p.share}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 10 tadan sahifalab o‘tkazish (Pagination) */}
        {totalProductsCount > 10 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
            <button
              type="button"
              onClick={onPrevProductPage}
              disabled={productPage === 0}
              aria-label="Oldingi 10 ta tovar"
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Oldingi</span>
            </button>

            <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums text-xs sm:text-sm">
              {productFrom}–{productTo} / {totalProductsCount} ta tovar
            </span>

            <button
              type="button"
              onClick={onNextProductPage}
              disabled={productPage >= (productTotalPages || 1) - 1}
              aria-label="Keyingi 10 ta tovar"
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <span className="hidden sm:inline">Keyingi</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default KorxonaProductsAndFiscalSection;
