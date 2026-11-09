import React from 'react';
import { formatNumber } from '../utils/korxonaDetailUtils';

export function KorxonaReceiptRow({ receipt: r, isSelected, onSelect }) {
  const isFiscal = Boolean(r[7]);
  const itemCount = (r[10] || []).reduce((sum, item) => sum + (item[1] || 0), 0);

  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(r[0])}
        className={`w-full text-left grid grid-cols-[minmax(160px,1.5fr)_64px_72px_70px_minmax(110px,1fr)_90px] gap-2 items-center px-5 py-3 text-xs transition ${
          isSelected
            ? 'bg-[#EAF1FE] dark:bg-blue-950/50 border-l-[3px] border-l-[#2563EB] text-blue-950 dark:text-blue-100 font-semibold'
            : 'hover:bg-[#F5F8FF] dark:hover:bg-slate-800/40 border-l-[3px] border-l-transparent text-slate-700 dark:text-slate-300'
        }`}
      >
        <span className="font-mono font-bold text-slate-900 dark:text-white">{r[0]}</span>
        <span className="font-mono text-slate-500">{r[2]}</span>
        <span className="text-slate-500">{r[6] === 'CASH' ? 'Naqd' : 'Karta'}</span>
        <span className="text-right font-mono text-slate-500">{itemCount} dona</span>
        <span className="text-right font-mono font-bold text-slate-900 dark:text-white">{formatNumber(r[5])}</span>
        <span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
              isFiscal ? 'bg-[#E7F6EE] text-[#0E7C4F]' : 'bg-[#FDECEC] text-[#B42318]'
            }`}
          >
            {isFiscal ? 'QR bilan' : 'Fiskalsiz'}
          </span>
        </span>
      </button>
    </li>
  );
}

export default KorxonaReceiptRow;
