import { AlertCircle, Ban, Building2, CheckCircle2, Clock } from 'lucide-react';

function percent(part, total) {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

function KpiCard({ icon: Icon, tone, label, value, share, hint, active, onClick }) {
  return (
    <button
      type="button"
      className={`bc-kpi bc-kpi--${tone}${active ? ' bc-kpi--active' : ''}`}
      onClick={onClick}
    >
      <span className="bc-kpi__icon"><Icon size={20} strokeWidth={2.2} aria-hidden /></span>
      <span className="bc-kpi__body">
        <span className="bc-kpi__label">{label}</span>
        <span className="bc-kpi__value">
          {value ?? '—'}
          {share != null ? <small>({share}%)</small> : null}
        </span>
        {hint ? <span className="bc-kpi__hint">{hint}</span> : null}
      </span>
    </button>
  );
}

export default function BillingKpiCards({ t, money, overview, tab, onTab }) {
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const total = overview?.totalCompanies ?? 0;
  const currency = t('billing.currency');
  const cards = [
    {
      key: 'ALL',
      icon: Building2,
      tone: 'info',
      value: overview?.totalCompanies,
      hint: overview ? k('kpiNewHint', { count: overview.newCompanies, days: overview.newCompanyDays }) : null,
    },
    {
      key: 'ACTIVE',
      icon: CheckCircle2,
      tone: 'success',
      value: overview?.activeCount,
      share: percent(overview?.activeCount, total),
      hint: overview ? k('kpiMrrHint', { amount: money(overview.mrr), currency }) : null,
    },
    {
      key: 'OVERDUE',
      icon: AlertCircle,
      tone: 'danger',
      value: overview?.overdueCount,
      share: percent(overview?.overdueCount, total),
      hint: overview ? k('kpiDebtHint', { amount: money(overview.debtTotal), currency }) : null,
    },
    {
      key: 'DUE_SOON',
      icon: Clock,
      tone: 'warning',
      value: overview?.dueSoonCount,
      share: percent(overview?.dueSoonCount, total),
      hint: overview ? k('kpiExpectedHint', { amount: money(overview.expectedSoonAmount), currency }) : null,
    },
    {
      key: 'SUSPENDED',
      icon: Ban,
      tone: 'neutral',
      value: overview?.suspendedCount,
      share: percent(overview?.suspendedCount, total),
      hint: overview?.notBilledCount ? k('kpiNotBilledHint', { count: overview.notBilledCount }) : null,
    },
  ];

  return (
    <div className="bc-kpis">
      {cards.map((card) => (
        <KpiCard
          key={card.key}
          {...card}
          label={k(`kpi.${card.key}`)}
          active={tab === card.key}
          onClick={() => onTab(card.key)}
        />
      ))}
    </div>
  );
}
