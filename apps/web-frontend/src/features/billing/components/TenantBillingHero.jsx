import React from 'react';

export default function TenantBillingHero({
  me,
  user,
  planLabel,
  p,
  start,
  end,
  formatDate,
  formatDateObj,
}) {
  return (
    <section className="billing-hero">
      <div>
        <div className="billing-hero__meta">
          <span className={`billing-chip ${me?.billingEnabled ? 'billing-chip--ok' : ''}`}>
            {me?.billingEnabled ? p.t('billing.connected') : p.t('billing.statusNotConfigured')}
          </span>
          <span className="billing-chip">
            ID {me?.companyId || user?.companyId || '—'}
          </span>
          <span className="billing-chip billing-chip--accent">
            {planLabel}
          </span>
        </div>
        <p className="billing-hero__label">{p.t('billing.availableBalance')}</p>
        <div className="billing-hero__balance">
          {p.money(me?.balance)} {p.t('billing.currency')}
        </div>
        <p className="billing-hero__hint">
          {p.t('billing.nextChargeHint', {
            date: formatDate(me?.nextChargeAt),
            amount: p.money(me?.monthlyTotal),
          })}
        </p>
      </div>
      <div className="billing-hero__side">
        <div>
          <p className="billing-hero__label">{p.t('billing.periodLeft')}</p>
          <p className="billing-hero__period-value">
            {p.remaining == null ? p.t('billing.periodNotStarted') : p.t('billing.daysLeft', { count: p.remaining })}
          </p>
          <div className="billing-progress mt-3">
            <span style={{ width: `${p.progress}%` }} />
          </div>
          {end ? (
            <div className="billing-hero__period">
              <span>{formatDateObj(start)}</span>
              <span>{formatDate(end)}</span>
            </div>
          ) : (
            <p className="billing-hero__period">{p.t('billing.periodHint')}</p>
          )}
        </div>
        <div className="billing-hero__actions">
          <button type="button" className="billing-btn billing-btn--primary" onClick={() => p.openPay()}>
            + {p.t('billing.topUp')}
          </button>
        </div>
      </div>
    </section>
  );
}
