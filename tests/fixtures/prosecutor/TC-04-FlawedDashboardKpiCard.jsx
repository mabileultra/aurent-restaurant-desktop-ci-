import React, { useState, useEffect } from 'react';

/**
 * TC-04: FlawedDashboardKpiCard.jsx
 * Ushbu komponent Modda 5 ni buzadi:
 * - Butun bazani yuklash (getAll chaqiruvi);
 * - useEffect da cleanupsiz addEventListener (Memory Leak).
 */
export function FlawedDashboardKpiCard({ apiClient }) {
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // QOIDABUZARLIK: Full-table yuklash (oddiy count uchun butun bazani tortish)
    apiClient.getAll('/api/customers').then((res) => {
      setTotalCustomersCount(res.data.length);
    });

    // QOIDABUZARLIK: useEffect ichida cleanupsiz event listener (Memory leak!)
    window.addEventListener('resize', () => {
      setWindowWidth(window.innerWidth);
    });
    // XATO: return () => window.removeEventListener(...) yo'q!
  }, [apiClient]);

  return (
    <div className="p-4 bg-white rounded-xl shadow border border-slate-200">
      <div className="text-sm text-slate-500 font-medium">Jami Mijozlar (Full-table)</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{totalCustomersCount}</div>
      <div className="text-xs text-slate-400 mt-2">Ekran kengligi: {windowWidth}px</div>
    </div>
  );
}
