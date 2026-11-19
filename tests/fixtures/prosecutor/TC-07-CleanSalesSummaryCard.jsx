import React, { useState, useEffect } from 'react';

/**
 * TC-07: CleanSalesSummaryCard.jsx
 * Ushbu komponent 100% toza, namunali komponent hisoblanadi (Salbiy nazorat / Negative Control).
 * Barcha Aurent POS standartlariga qat'iy amal qiladi:
 * - Hajmi 65 qator (<200 qator SRP);
 * - Yagona mas'uliyat tamoyili (faqat savdo xulosasini ko'rsatish);
 * - useEffect tozalash (cleanup) funksiyasi mavjud;
 * - Aniq va ifodali nomlash;
 * - Tap target >= 44px (min-h-[48px]);
 * - Semantik ranglar: emerald (brend/faol) va slate (neytral).
 */

const DEFAULT_CURRENCY = 'UZS';

export function CleanSalesSummaryCard({ initialTotal = 0, currency = DEFAULT_CURRENCY, onRefresh }) {
  const [totalSales, setTotalSales] = useState(initialTotal);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleWindowFocus = () => {
      if (isMounted) {
        setIsRefreshing(true);
        onRefresh?.().finally(() => {
          if (isMounted) setIsRefreshing(false);
        });
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    // To'g'ri resurs boshqaruvi: tozalash (cleanup) mavjud
    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [onRefresh]);

  const formattedAmount = `${totalSales.toLocaleString('uz-UZ')} ${currency}`;

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Joriy Savdo
          </span>
          <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formattedAmount}
          </h4>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
          Kunlik
        </span>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={isRefreshing}
          onClick={onRefresh}
          className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isRefreshing ? 'Yangilanmoqda...' : 'Yangilash'}
        </button>
      </div>
    </div>
  );
}
