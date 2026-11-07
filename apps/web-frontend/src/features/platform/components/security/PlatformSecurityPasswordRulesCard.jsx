import React from 'react';
import { Lock } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';

export default function PlatformSecurityPasswordRulesCard({
  rules,
  setMinLen,
  setExpiry,
  toggleReq,
}) {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>Parol talablari</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Xodimlar paroli qanchalik murakkab bo‘lishi lozimligi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Eng kam uzunlik</label>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[8, 10, 12, 14].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMinLen(v)}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  rules.minLen === v ? 'bg-white dark:bg-slate-900 text-emerald-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                {v} belgi
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Parolni almashtirish</label>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[
              { v: 0, l: 'Majburiy emas' },
              { v: 90, l: '90 kunda' },
              { v: 180, l: '180 kunda' },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setExpiry(opt.v)}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  rules.expiry === opt.v ? 'bg-white dark:bg-slate-900 text-emerald-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {[
          { k: 'case', l: 'Katta va kichik harf qatnashishi shart' },
          { k: 'digit', l: 'Kamida bitta raqam bo‘lishi shart' },
          { k: 'special', l: 'Maxsus belgi (!, @, #, $) shart' },
          { k: 'history', l: 'Oxirgi 5 parolni takrorlamaslik' },
        ].map((c) => (
          <label key={c.k} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
            <BaseCheckbox
              checked={Boolean(rules.req[c.k])}
              onChange={() => toggleReq(c.k)}
              size={18}
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{c.l}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
