import React from 'react';

export default function CopyStrategyRadioGroup({ strategy, onStrategyChange }) {
  return (
    <div>
      <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        3. Qanday ko‘chirilsin
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label
          className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
            strategy === 'MERGE'
              ? 'border-emerald-600 bg-emerald-50/30 dark:border-emerald-500 dark:bg-emerald-950/30'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="copy-strategy"
              checked={strategy === 'MERGE'}
              onChange={() => onStrategyChange('MERGE')}
              className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="font-bold text-slate-900 dark:text-white">Istisnolarni qo‘shish</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
            Xodimning o‘z istisnolari qoladi, manbadagilar ustiga qo‘shiladi.
          </p>
        </label>

        <label
          className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
            strategy === 'REPLACE'
              ? 'border-emerald-600 bg-emerald-50/30 dark:border-emerald-500 dark:bg-emerald-950/30'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="copy-strategy"
              checked={strategy === 'REPLACE'}
              onChange={() => onStrategyChange('REPLACE')}
              className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="font-bold text-slate-900 dark:text-white">To‘liq almashtirish</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
            Xodimning istisnolari o‘chiriladi va manbaniki bilan bir xil bo‘ladi.
          </p>
        </label>
      </div>
    </div>
  );
}
