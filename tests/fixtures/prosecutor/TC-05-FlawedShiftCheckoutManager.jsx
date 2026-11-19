import React, { useState } from 'react';

/**
 * TC-05: FlawedShiftCheckoutManager.jsx
 * Ushbu komponent Modda 6 ni buzadi (Clean Code):
 * - Sehrli sonlar (status === 3, val > 500000);
 * - Noaniq o'zgaruvchi nomlari (const a = ..., let temp = ...);
 * - console.log qoldirilgan.
 */
export function FlawedShiftCheckoutManager({ currentShift }) {
  const [closingNotes, setClosingNotes] = useState('');

  const handleProcessShiftClose = (status, val) => {
    // QOIDABUZARLIK: Noaniq nomlash
    const a = 100;
    let temp = val + a;

    // QOIDABUZARLIK: console.log qoldirilgan
    console.log('Smena yopilmoqda, parametrlar:', status, val, temp);

    // QOIDABUZARLIK: Sehrli raqamlar
    if (status === 3 && val > 500000) {
      alert('Katta summa bo\'yicha tekshiruv talab etiladi!');
      return false;
    }

    return true;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold text-slate-800">Smena Yopish Menejeri</h3>
      <textarea
        value={closingNotes}
        onChange={(e) => setClosingNotes(e.target.value)}
        className="w-full mt-2 p-2 border rounded"
        placeholder="Izoh..."
      />
      <button
        onClick={() => handleProcessShiftClose(currentShift?.status, currentShift?.cashTotal)}
        className="mt-3 px-4 py-2 bg-slate-800 text-white rounded min-h-[44px]"
      >
        Smenani Tasdiqlash
      </button>
    </div>
  );
}
