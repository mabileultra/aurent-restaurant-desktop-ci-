import React from 'react';
import { Copy, X } from 'lucide-react';
import { initials } from './billingCollectionsUi';

export function avatarClass(state) {
  switch (state) {
    case 'ACTIVE':
      return 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
    case 'DUE_SOON':
      return 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400';
    case 'OVERDUE':
      return 'bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400';
    case 'SUSPENDED':
      return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
    case 'NOT_BILLED':
    default:
      return 'bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400';
  }
}

export function badgeClass(state) {
  switch (state) {
    case 'ACTIVE':
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'DUE_SOON':
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'OVERDUE':
      return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    case 'SUSPENDED':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    case 'NOT_BILLED':
    default:
      return 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  }
}

export default function BillingCompanyDrawerHeader({ p, row, b, region, district, k, onCopyAll }) {
  const { t } = p;
  const paymentState = row.paymentState || 'NOT_BILLED';

  return (
    <header className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:!bg-slate-900">
      <div className="flex items-center space-x-4 min-w-0">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold shadow-inner shrink-0 ${avatarClass(
            paymentState,
          )}`}
        >
          {initials(b.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2.5">
            <h3
              className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight"
              title={b.companyName}
            >
              {b.companyName || `#${b.companyId}`}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badgeClass(
                paymentState,
              )}`}
            >
              {k(`states.${paymentState}`)}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
            <span>
              ID: <strong className="text-slate-600 dark:text-slate-300 font-medium">{b.companyId}</strong>
            </span>
            {region || district ? (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="truncate">{[region, district].filter(Boolean).join(', ')}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          onClick={onCopyAll}
          title={k('reminder.copy')}
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          onClick={p.closeDrawer}
          title={t('common.close')}
        >
          <X size={20} />
        </button>
      </div>
    </header>
  );
}
