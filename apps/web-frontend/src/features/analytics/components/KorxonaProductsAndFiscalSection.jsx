import React from 'react';

function CenterDonut({ label, color, pct, amount, hint, dash, aria }) {
  return (
    <div className="flex items-center gap-4">
      <svg
        width="104"
        height="104"
        viewBox="0 0 112 112"
        role="img"
        aria-label={aria}
        className="shrink-0"
      >
        <circle cx="56" cy="56" r="44" fill="none" stroke="#EEF1F4" strokeWidth="12" className="dark:stroke-slate-800" />
        <circle
          cx="56"
          cy="56"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={dash}
          transform="rotate(-90 56 56)"
        />
        <text
          x="56"
          y="62"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          className="fill-slate-900 dark:fill-white font-mono"
        >
          {pct}
        </text>
      </svg>
      <div className="space-y-0.5 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span style={{ backgroundColor: color }} className="w-2 h-2 rounded-xs" />
          {label}
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
          {amount}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 block">
          {hint}
        </span>
      </div>
    </div>
  );
}

export function KorxonaProductsAndFiscalSection({
  donuts,
  products,
  totalProductsCount,
  productSort,
  onSortChange,
  setProductSort,
  showAllProducts,
  onToggleShowAll,
  toggleShowAllProducts,
}) {
  const handleSortChange = onSortChange || setProductSort;
  const handleToggleShowAll = onToggleShowAll || toggleShowAllProducts;
  return (
    <div className="flex flex-wrap gap-4 items-stretch">
      {/* Left: Fiskal holati */}
      <section
        aria-labelledby="fiscal-status-heading"
        className="flex-1 lg:flex-[1_1_360px] max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-5 shadow-2xs"
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
            <CenterDonut key={i} {...d} />
          ))}
        </div>
      </section>

      {/* Right: Eng ko‘p urilgan tovarlar */}
      <section
        aria-labelledby="top-products-heading"
        className="flex-1 lg:flex-[999_1_560px] min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-2xs overflow-hidden"
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
              className={`h-8 px-3 rounded-md text-xs font-semibold transition ${
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
              className={`h-8 px-3 rounded-md text-xs font-semibold transition ${
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

        {totalProductsCount > 10 && (
          <button
            type="button"
            onClick={handleToggleShowAll}
            className="self-center py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {showAllProducts ? 'Kamroq ko‘rsatish' : `Barcha ${totalProductsCount} ta tovarni ko‘rsatish`}
          </button>
        )}
      </section>
    </div>
  );
}

export default KorxonaProductsAndFiscalSection;
