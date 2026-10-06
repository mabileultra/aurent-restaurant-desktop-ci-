import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, TrendingUp, Wallet } from 'lucide-react';
import { platformBillingApi } from '../../../../api';
import { COLLECTIONS_QUERY_KEY } from '../../hooks/useBillingCollections';

const PERIODS = ['DAY', 'WEEK', 'MONTH', 'YEAR'];
const REVENUE_FIELD = { DAY: 'today', WEEK: 'week', MONTH: 'month', YEAR: 'year' };
const METHOD_TONE = { CLICK: 'info', PAYME: 'success', BANK_TRANSFER: 'warning', CASH: 'neutral', OTHER: 'neutral' };

function StatRow({ label, value, sub }) {
  return (
    <div className="bc-stat">
      <span className="bc-stat__label">{label}</span>
      <span className="bc-stat__value">{value}</span>
      {sub ? <span className="bc-sub">{sub}</span> : null}
    </div>
  );
}

function Panel({ icon: Icon, tone, title, children, action }) {
  return (
    <section className="bc-card bc-report">
      <header className="bc-report__head">
        <span className={`bc-kpi__icon bc-kpi--${tone}`}><Icon size={18} aria-hidden /></span>
        <h3>{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

export default function BillingReportsView({ t, money }) {
  const [period, setPeriod] = useState('MONTH');
  const k = (key, opts) => t(`platform.billing.collections.reports.${key}`, opts);
  const currency = t('billing.currency');
  const sum = (v) => `${money(v)} ${currency}`;

  const q = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'reports', period],
    queryFn: () => platformBillingApi.collectionsReports({ period }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
  const r = q.data;

  if (q.isLoading) return <p className="bc-muted">{t('common.loading')}</p>;
  if (!r) return <p className="bc-muted">{t('platform.billing.actionFailed')}</p>;

  return (
    <div className="bc-reports">
      <Panel icon={TrendingUp} tone="success" title={k('revenue')}>
        <div className="bc-stat-grid">
          {PERIODS.map((p) => (
            <StatRow key={p} label={k(`periods.${p}`)} value={sum(r.revenue[REVENUE_FIELD[p]])} />
          ))}
        </div>
      </Panel>

      <Panel icon={CalendarClock} tone="info" title={k('expected')}>
        <div className="bc-stat-grid bc-stat-grid--3">
          <StatRow label={k('expectedToday')} value={sum(r.expected.today)} sub={k('paymentsCount', { count: r.expected.todayCount })} />
          <StatRow label={k('expected7')} value={sum(r.expected.next7Days)} sub={k('paymentsCount', { count: r.expected.next7DaysCount })} />
          <StatRow label={k('expected30')} value={sum(r.expected.next30Days)} sub={k('paymentsCount', { count: r.expected.next30DaysCount })} />
        </div>
      </Panel>

      <Panel icon={AlertCircle} tone="danger" title={k('debt')}>
        <div className="bc-stat-grid bc-stat-grid--3">
          <StatRow label={k('debtTotal')} value={<span className="bc-text--danger">{sum(r.debt.total)}</span>} />
          <StatRow label={k('debtCount')} value={r.debt.count} />
          <StatRow label={k('debtAverage')} value={sum(r.debt.average)} />
        </div>
      </Panel>

      <Panel
        icon={Wallet}
        tone="warning"
        title={k('methods')}
        action={(
          <select className="bc-control bc-report__period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <option key={p} value={p}>{k(`periods.${p}`)}</option>)}
          </select>
        )}
      >
        <ul className="bc-methods">
          {r.methods.map((m) => (
            <li key={m.method}>
              <span className="bc-methods__name">{t(`platform.billing.collections.methods.${m.method}`)}</span>
              <span className="bc-methods__bar">
                <span className={`bc-methods__fill bc-badge--${METHOD_TONE[m.method]}`} style={{ width: `${m.percent}%` }} />
              </span>
              <span className="bc-methods__pct">{m.percent}%</span>
              <span className="bc-methods__sum">{sum(m.amount)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
