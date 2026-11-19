import React from 'react';

/**
 * TC-06: FlawedCashierPaymentAction.jsx
 * Ushbu komponent Modda 7 ni buzadi (UI/UX standartlari):
 * - Tugma o'lchami h-6 (24px < 44px tap target buzilgan);
 * - Neytral elementga ogohlantirishsiz bg-amber / text-rose rang shovqini berilgan.
 */
export function FlawedCashierPaymentAction({ order, onPay }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Buyurtma #{order?.id}</span>

        {/* QOIDABUZARLIK: Neytral do'kon turi uchun xavf (amber/rose) rang shovqini */}
        <span className="px-2 py-0.5 text-xs rounded font-medium storeType bg-amber-500 text-rose-500">
          Chakana Do'kon
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {/* QOIDABUZARLIK: Tap target < 44px (h-6 = 24px) */}
        <button
          onClick={() => onPay?.('CASH')}
          className="h-6 px-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Naqd
        </button>

        {/* QOIDABUZARLIK: Tap target < 44px (h-6 = 24px) */}
        <button
          onClick={() => onPay?.('CARD')}
          className="h-6 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Karta
        </button>
      </div>
    </div>
  );
}
