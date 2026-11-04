import React from 'react';
import { Plus } from 'lucide-react';
import { STATE_TONE, dueHint, initials } from './billingCollectionsUi';

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
      className="bc-row hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
      onClick={() => p?.selectCompany?.(row)}
    >
      <td>
        <div className="bc-company">
          <span className={`bc-avatar bc-avatar--${STATE_TONE[row.paymentState] || 'neutral'}`}>
            {initials(b.companyName)}
          </span>
          <span>
            <span className="bc-company__name">{b.companyName || `#${companyId}`}</span>
            <span className="bc-company__meta">ID: {companyId}</span>
          </span>
        </div>
      </td>
      <td>
        {b.planName ? (
          <span className="bc-pill bc-pill--plan">{b.planName}</span>
        ) : (
          <span className="bc-muted">—</span>
        )}
      </td>
      <td className="bc-num font-semibold">{sum(b.monthlyTotal)}</td>
      <td className={`bc-num font-semibold ${isOverdue ? 'bc-text--danger' : ''}`}>
        {sum(b.balance)}
      </td>
      <td>
        <span className="bc-date">{formatDate(b.nextChargeAt)}</span>
        {hint ? (
          <span className={`bc-sub bc-text--${hint.tone} block text-xs`}>{hint.text}</span>
        ) : null}
      </td>
      <td>
        <span className={`bc-badge bc-badge--${STATE_TONE[row.paymentState] || 'neutral'}`}>
          {t(`platform.billing.collections.states.${row.paymentState}`, {
            defaultValue: row.paymentState,
          })}
        </span>
      </td>
      <td className="text-right" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bc-btn bc-btn--primary bc-btn--sm inline-flex items-center gap-1"
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
