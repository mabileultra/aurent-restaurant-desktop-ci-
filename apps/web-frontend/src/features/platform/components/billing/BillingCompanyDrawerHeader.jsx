import React from 'react';
import { Copy, X } from 'lucide-react';
import { initials } from './billingCollectionsUi';

export function avatarClass() {
  return 'bg-aa-surface-sunken text-aa-ink-muted border border-aa-line';
}

export function badgeClass(state) {
  switch (state) {
    case 'ACTIVE':
      return 'bg-aa-success-soft text-aa-success border-aa-line';
    case 'NOT_BILLED':
      return 'bg-[#eaf1fe] text-[#1d4ed8] border-transparent dark:bg-[#1d4ed8]/20 dark:text-[#93c5fd]';
    default:
      return 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line';
  }
}

export default function BillingCompanyDrawerHeader({ p, row, b, region, district, k, onCopyAll }) {
  const { t } = p;
  const paymentState = row.paymentState || 'NOT_BILLED';

  return (
    <header className="px-5 py-4 border-b border-aa-line flex items-center justify-between shrink-0 bg-aa-surface">
      <div className="flex items-center space-x-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-aa-sm flex items-center justify-center text-sm font-semibold shrink-0 ${avatarClass(
            paymentState,
          )}`}
        >
          {initials(b.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2.5">
            <h3
              className="text-base font-semibold text-aa-ink truncate leading-tight"
              title={b.companyName}
            >
              {b.companyName || `#${b.companyId}`}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badgeClass(
                paymentState,
              )}`}
            >
              {k(`states.${paymentState}`)}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-aa-ink-muted mt-1">
            <span>
              ID: <strong className="font-mono text-aa-ink font-medium">{b.companyId}</strong>
            </span>
            {region || district ? (
              <>
                <span className="w-1 h-1 rounded-full bg-aa-line-strong" />
                <span className="truncate">{[region, district].filter(Boolean).join(', ')}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 shrink-0 ml-2">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-aa-sm text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
          onClick={onCopyAll}
          title={k('reminder.copy')}
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-aa-sm text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
          onClick={p.closeDrawer}
          title={t('common.close')}
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
