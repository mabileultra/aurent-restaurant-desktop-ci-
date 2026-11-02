import React from 'react';
import { Check } from 'lucide-react';

export const BUSINESS_TYPE_OPTIONS = [
  { code: 'BUILDING_MATERIALS', label: 'Qurilish materiallari' },
  { code: 'GROCERY', label: 'Oziq-ovqat' },
  { code: 'CLOTHING', label: 'Kiyim-kechak' },
  { code: 'PHARMACY', label: 'Dorixona' },
  { code: 'CANTEEN', label: 'Oshxona / bufet' },
  { code: 'RESTAURANT', label: 'Restoran' },
  { code: 'AUTO_PARTS', label: 'Avto ehtiyot qismlari' },
  { code: 'UNIVERSAL', label: 'Universal' },
  { code: 'OTHER', label: 'Boshqa' },
];

export default function PlatformLeadBusinessTypeChips({
  selectedType,
  onSelectType,
  guessedLabel,
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
        Faoliyat turi * — <span className="text-emerald-700 dark:text-emerald-400">xabardan taxmin qilindi: «{guessedLabel}»</span>
      </label>
      <div className="flex flex-wrap gap-1.5">
        {BUSINESS_TYPE_OPTIONS.map((bt) => {
          const isChecked = selectedType === bt.code;
          return (
            <button
              key={bt.code}
              type="button"
              onClick={() => onSelectType(bt.code)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isChecked
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                  isChecked ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {isChecked && <Check size={8} className="text-white" />}
              </div>
              <span>{bt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
