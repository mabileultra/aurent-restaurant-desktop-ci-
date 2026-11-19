import React, { useState } from 'react';

/**
 * TC-02: FlawedOrderFilters.jsx
 * Ushbu komponent DRY qoidasini va xom HTML taqiqini buzadi:
 * - Xom <select> ishlatilgan (PlatformSelect / BaseSelect o'rniga);
 * - Xom <input type="date"> ishlatilgan (PlatformDatePicker o'rniga);
 * - Lokal sana formatlash funksiyasi qayta yozilgan (formatCustomUzDate).
 */

// XATO: Umumiy formatAdminDateTime bo'la turib, alohida sana formatlash nusxalangan
function formatCustomUzDate(rawDate) {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

export function FlawedOrderFilters({ onFilterChange }) {
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    onFilterChange?.({
      status,
      startDate: formatCustomUzDate(startDate),
      endDate: formatCustomUzDate(endDate),
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-slate-200 flex flex-wrap gap-4 items-center">
      {/* QOIDABUZARLIK: Xom <select> tegi ishlatilgan */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Buyurtma Holati:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white text-slate-800"
        >
          <option value="ALL">Barchasi</option>
          <option value="PAID">To'langan</option>
          <option value="PENDING">Kutilmoqda</option>
          <option value="CANCELLED">Bekor qilingan</option>
        </select>
      </div>

      {/* QOIDABUZARLIK: Xom <input type="date"> ishlatilgan */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Boshlanish sanasi:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      {/* QOIDABUZARLIK: Xom <input type="date"> ishlatilgan */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Tugash sanasi:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      <button
        onClick={handleApply}
        className="mt-5 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 min-h-[44px]"
      >
        Filtrlash
      </button>
    </div>
  );
}
