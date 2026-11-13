import React from 'react';
import { Plus } from 'lucide-react';
import { dueHint, initials } from './billingCollectionsUi';

function resolveStateBadge(state) {
  switch (state) {
    case 'ACTIVE':
    case 'OK':
      return 'bg-aa-success-soft text-aa-success border-aa-success';
    case 'OVERDUE':
      return 'bg-aa-danger-soft text-aa-danger border-aa-danger';
    case 'DUE_SOON':
    case 'TRIAL':
      return 'bg-aa-warning-soft text-aa-warning border-aa-warning';
    default:
      return 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line';
  }
}

export default function BillingActionableLedgerRow({
  row,
  index,
  p,
  t,
  sum,
  formatDate,
}) {
  const b = row?.billing || {};
  const companyId = b.companyId || row.companyId || index;
  const hint = dueHint(row, t);
  const isOverdue = row.paymentState === 'OVERDUE' || Number(b.balance) < 0;

  return (
    <tr
      key={companyId}
      className="bc-row hover:bg-aa-surface-sunken cursor-pointer transition-colors"
      onClick={() => p?.selectCompany?.(row)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-aa-sm bg-aa-surface-sunken text-aa-ink-muted border border-aa-line inline-flex items-center justify-center text-xs font-semibold shrink-0">
            {initials(b.companyName)}
          </span>
          <div className="min-w-0">
            <span className="block text-xs font-medium text-aa-ink truncate">{b.companyName || `#${companyId}`}</span>
            <span className="block text-xs text-aa-ink-muted">ID: {companyId}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {b.planName ? (
          <span className="inline-block px-2 py-0.5 text-xs rounded-aa-sm bg-aa-surface-sunken text-aa-ink border border-aa-line font-medium">
            {b.planName}
          </span>
        ) : (
          <span className="text-xs text-aa-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-xs font-semibold text-aa-ink">{sum(b.monthlyTotal)}</td>
      <td className={`px-4 py-3 text-right text-xs font-semibold ${isOverdue ? 'text-aa-danger' : 'text-aa-ink'}`}>
        {sum(b.balance)}
      </td>
      <td className="px-4 py-3">
        <span className="block text-xs text-aa-ink">{formatDate(b.nextChargeAt)}</span>
        {hint ? (
          <span className={`block text-xs font-medium ${hint.tone === 'danger' ? 'text-aa-danger' : hint.tone === 'warning' ? 'text-aa-warning' : 'text-aa-ink-muted'}`}>
            {hint.text}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-aa-sm border ${resolveStateBadge(row.paymentState)}`}>
          {t(`platform.billing.collections.states.${row.paymentState}`, {
            defaultValue: row.paymentState,
          })}
        </span>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="aa-btn aa-btn--primary aa-size-sm inline-flex items-center gap-1"
          onClick={() => {
            p?.openPaymentModal?.(b.companyId, { returnToDrawer: false });
          }}
        >
          <Plus size={13} aria-hidden />
          <span>{t('platform.billing.collections.addPayment', { defaultValue: 'To‘lov qo‘shish' })}</span>
        </button>
      </td>
    </tr>
  );
}
