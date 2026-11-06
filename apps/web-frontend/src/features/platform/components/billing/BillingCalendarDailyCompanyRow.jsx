import React from 'react';
import { ChevronRight } from 'lucide-react';
import { STATE_TONE, initials } from './billingCollectionsUi';

export default function BillingCalendarDailyCompanyRow({
  item,
  company,
  billing,
  regionName,
  isFuture,
  money,
  currency,
  t,
  k,
  onOpenCompany,
}) {
  const name = item.companyName || billing?.companyName || `#${item.companyId}`;
  const plan = billing?.planName || t('platform.billing.collections.customPlan', { defaultValue: 'Individual' });
  const region = company?.regionCode ? regionName(company.regionCode) : '';

  // Determine display badge and tone
  let state = item.paymentState;
  let stateTone = STATE_TONE[state] || 'neutral';
  let badgeLabel = t(`platform.billing.collections.states.${state}`, { defaultValue: state });

  if (isFuture) {
    if (item.category === 'LOW_BALANCE') {
      stateTone = 'danger';
      badgeLabel = k('tabLowBalance', { defaultValue: 'Balans yetmaydi' });
    } else if (item.category === 'PLANNED') {
      stateTone = 'info';
      badgeLabel = k('tabPlanned', { defaultValue: 'Rejalashtirilgan' });
    }
  }

  return (
    <li className="bc-cal-company-item">
      <div
        className="bc-cal-company-card"
        role="button"
        tabIndex={0}
        onClick={() => onOpenCompany(item.companyId, company)}
        onKeyDown={(e) => e.key === 'Enter' && onOpenCompany(item.companyId, company)}
      >
        {/* Avatar */}
        <div className={`bc-cal-company-avatar bc-avatar--${stateTone}`}>
          {initials(name)}
        </div>

        {/* Middle details */}
        <div className="bc-cal-company-info">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bc-cal-company-name" title={name}>
              {name}
            </span>
            <span className={`bc-badge bc-badge--${stateTone} text-[10px]`}>
              {badgeLabel}
            </span>
          </div>

          <div className="bc-cal-company-meta">
            <span>ID: {item.companyId}</span>
            {(company?.tin || company?.companyTin) ? (
              <>
                <span className="bc-dot-sep">·</span>
                <span>STIR: {company.tin || company.companyTin}</span>
              </>
            ) : null}
            {region ? (
              <>
                <span className="bc-dot-sep">·</span>
                <span>{region}</span>
              </>
            ) : null}
          </div>

          <div className="bc-cal-company-plan">
            <span>
              {t('platform.billing.collections.colPlan', { defaultValue: 'Tarif' })}: <strong>{plan}</strong>
            </span>
          </div>
        </div>

        {/* Right side: Amount & Balance */}
        <div className="bc-cal-company-financials">
          <div className="bc-cal-company-amount font-bold">
            {money(item.amount)} {currency}
          </div>
          <div className={`bc-cal-company-balance ${item.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
            {k('balanceLabel', {
              amount: money(item.balance),
              currency,
              defaultValue: `Balans: ${money(item.balance)} ${currency}`,
            })}
          </div>
          <div className="bc-cal-company-arrow">
            <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </li>
  );
}
