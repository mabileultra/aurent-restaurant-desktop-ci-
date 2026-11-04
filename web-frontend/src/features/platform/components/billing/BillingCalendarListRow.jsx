import React from 'react';
import { Plus } from 'lucide-react';
import { STATE_TONE, initials } from './billingCollectionsUi';
import { classifyCalendarItem, formatDayTitle } from './billingCalendarUtils';

export default function BillingCalendarListRow({
  item,
  todayIso,
  regionName,
  lang,
  money,
  currency,
  t,
  onOpenCompany,
  onOpenPaymentModal,
}) {
  const b = item.billing;
  const name = item.companyName || b?.companyName || `#${item.companyId}`;
  const isFuture = Boolean(item.date && item.date > todayIso);
  const category = classifyCalendarItem(item, item.company, isFuture);

  let isOverdue = item.paymentState === 'OVERDUE' || item.balance < 0;
  let stateTone = STATE_TONE[item.paymentState] || 'neutral';
  let badgeText = t(`platform.billing.collections.states.${item.paymentState}`, { defaultValue: item.paymentState });

  if (isFuture) {
    if (category === 'LOW_BALANCE') {
      stateTone = 'danger';
      badgeText = t('platform.billing.collections.calendar.tabLowBalance', { defaultValue: 'Balans yetmaydi' });
      isOverdue = true;
    } else if (category === 'PLANNED') {
      stateTone = 'info';
      badgeText = t('platform.billing.collections.calendar.tabPlanned', { defaultValue: 'Rejalashtirilgan' });
      isOverdue = false;
    }
  }

  const region = item.regionCode ? regionName(item.regionCode) : '—';

  return (
    <tr
      className="bc-row hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
      onClick={() => onOpenCompany(item.companyId, item.company)}
    >
      <td>
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
          {formatDayTitle(item.date, lang)}
        </span>
      </td>
      <td>
        <div className="bc-company">
          <span className={`bc-avatar bc-avatar--${stateTone}`}>
            {initials(name)}
          </span>
          <span>
            <span className="bc-company__name">{name}</span>
            <span className="bc-company__meta">ID: {item.companyId}</span>
          </span>
        </div>
      </td>
      <td>
        <span className="text-xs text-slate-600 dark:text-slate-300">{region}</span>
      </td>
      <td>
        {b?.planName ? (
          <span className="bc-pill bc-pill--plan">{b.planName}</span>
        ) : (
          <span className="bc-muted">—</span>
        )}
      </td>
      <td className="bc-num font-semibold">
        {money(item.amount)} {currency}
      </td>
      <td className={`bc-num font-semibold ${isOverdue ? 'bc-text--danger' : ''}`}>
        {money(item.balance)} {currency}
      </td>
      <td>
        <span className={`bc-badge bc-badge--${stateTone}`}>
          {badgeText}
        </span>
      </td>
      <td className="text-right" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bc-btn bc-btn--primary bc-btn--sm inline-flex items-center gap-1"
          onClick={() => onOpenPaymentModal(item.companyId)}
        >
          <Plus size={13} aria-hidden />
          <span>{t('platform.billing.collections.acceptPayment', { defaultValue: 'To‘lov' })}</span>
        </button>
      </td>
    </tr>
  );
}
