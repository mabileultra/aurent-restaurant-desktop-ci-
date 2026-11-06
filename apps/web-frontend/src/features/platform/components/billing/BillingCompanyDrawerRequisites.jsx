import React from 'react';
import { Copy, Hash, Phone } from 'lucide-react';

export default function BillingCompanyDrawerRequisites({ p, row, b, k, onCopy }) {
  const detail = p?.companyDetail || {};
  const tin = row?.companyTin || row?.tin || detail.tin || row?.company?.tin || b?.tin || '';
  const phone = row?.companyPhone || row?.phone || detail.phone || row?.company?.phone || b?.phone || '';

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
        Rekvizitlar va Aloqa
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Telefon raqam */}
        <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:!bg-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{k('phone')}</span>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{phone || '—'}</div>
            </div>
          </div>
          {phone ? (
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => onCopy(phone, k('phone'))}
              title={k('reminder.copy')}
            >
              <Copy size={14} />
            </button>
          ) : null}
        </div>

        {/* STIR / INN */}
        <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:!bg-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Hash size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{k('tin')}</span>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{tin || '—'}</div>
            </div>
          </div>
          {tin ? (
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => onCopy(tin, k('tin'))}
              title={k('reminder.copy')}
            >
              <Copy size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
