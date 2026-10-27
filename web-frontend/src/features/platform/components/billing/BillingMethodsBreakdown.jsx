import React from 'react';
import { Wallet } from 'lucide-react';
import PlatformSelect from '../PlatformSelect';

const METHOD_TONE = { CLICK: 'info', PAYME: 'success', BANK_TRANSFER: 'warning', CASH: 'neutral', OTHER: 'neutral' };
const PERIODS = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

export default function BillingMethodsBreakdown({ t, methods = [], period, onPeriodChange, sum }) {
  const k = (key, opts) => t(`platform.billing.collections.reports.${key}`, opts);
  const totalAmount = methods.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  return (
    <div className="bc-chart-card">
      <div className="bc-chart-card__head flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bc-report-kpi-card__icon bc-kpi--warning">
            <Wallet size={16} aria-hidden />
          </span>
          <div>
            <h3 className="bc-chart-card__title">{k('methods')}</h3>
            <p className="bc-chart-card__sub">
              {k(`periods.${period}`)} {t('platform.billing.collections.reports.distribution', { defaultValue: 'bo‘yicha ulush' })}
            </p>
          </div>
        </div>
        <div style={{ width: '8.5rem' }}>
          <PlatformSelect
            size="sm"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            options={PERIODS.map((pKey) => ({
              value: pKey,
              label: k(`periods.${pKey}`),
            }))}
            searchable={false}
          />
        </div>
      </div>

      <div className="bc-methods-wrap">
        <ul className="bc-methods">
          {methods.map((m) => (
            <li key={m.method}>
              <span className="bc-methods__name">{t(`platform.billing.collections.methods.${m.method}`, { defaultValue: m.method })}</span>
              <span className="bc-methods__bar">
                <span
                  className={`bc-methods__fill bc-badge--${METHOD_TONE[m.method] || 'neutral'}`}
                  style={{ width: `${Math.max(m.percent || 0, 0)}%` }}
                />
              </span>
              <span className="bc-methods__pct">{m.percent || 0}%</span>
              <span className="bc-methods__sum">{sum(m.amount || 0)}</span>
            </li>
          ))}
        </ul>

        {totalAmount === 0 && (
          <p className="bc-methods-empty text-xs text-center text-slate-400 mt-4">
            {t('platform.billing.collections.reports.noMethodPayments', { defaultValue: 'Ushbu davrda hali to‘lovlar qayd etilmagan' })}
          </p>
        )}
      </div>
    </div>
  );
}
