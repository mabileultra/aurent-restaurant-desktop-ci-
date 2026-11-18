import React from 'react';
import { CalendarDays, CreditCard, Package, Wallet } from 'lucide-react';

export default function TenantBillingMetrics({ me, p, formatDate }) {
  return (
    <section className="billing-metrics">
      <div className="billing-metric billing-metric--plan">
        <div className="billing-metric__icon"><Package size={16} /></div>
        <div className="billing-metric__label">{p.t('billing.metricPlan')}</div>
        <div className="billing-metric__value">
          {me?.planName
            || (Number(me?.monthlyTotal) > 0
              ? `${p.money(me.monthlyTotal)} ${p.t('billing.perMonth')}`
              : '—')}
        </div>
        <div className="billing-metric__sub">
          {me?.maxRegisters ? p.t('billing.registersCount', { count: me.maxRegisters }) : '—'}
          {' · '}
          {me?.maxStores ? p.t('billing.storesCount', { count: me.maxStores }) : '—'}
        </div>
      </div>
      <div className="billing-metric billing-metric--date">
        <div className="billing-metric__icon"><CalendarDays size={16} /></div>
        <div className="billing-metric__label">{p.t('billing.metricNext')}</div>
        <div className="billing-metric__value">{formatDate(me?.nextChargeAt)}</div>
        <div className="billing-metric__sub">
          {me?.autoChargeEnabled ? p.t('billing.autoOn') : p.t('billing.autoOff')}
        </div>
      </div>
      <div className="billing-metric billing-metric--monthly">
        <div className="billing-metric__icon"><Wallet size={16} /></div>
        <div className="billing-metric__label">{p.t('billing.metricMonthly')}</div>
        <div className="billing-metric__value">
          {p.money(me?.monthlyTotal)} {p.t('billing.currency')}
        </div>
        <div className="billing-metric__sub">
          {Number(me?.planMonthlyPrice) > 0
            ? p.t('billing.monthlyBreakdown', {
                plan: p.money(me?.planMonthlyPrice),
                addon: p.money(me?.addonMonthlyAmount),
              })
            : p.t('billing.monthlyCustom', { amount: p.money(me?.monthlyTotal) })}
        </div>
      </div>
      <div className="billing-metric billing-metric--status">
        <div className="billing-metric__icon"><CreditCard size={16} /></div>
        <div className="billing-metric__label">{p.t('billing.metricStatus')}</div>
        <div className="billing-metric__value">
          <span className={`billing-badge billing-badge--${me?.status || 'ACTIVE'}`}>
            {p.t(`platform.billing.statuses.${me?.status || 'ACTIVE'}`)}
          </span>
        </div>
        <div className="billing-metric__sub">{p.statusLabel}</div>
      </div>
    </section>
  );
}
