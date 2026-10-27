import { AlertCircle, Ban, Building2, CheckCircle2, Clock, UserPlus } from 'lucide-react';

function percent(part, total) {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

function KpiCard({ icon: Icon, tone, label, value, share, hint, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`bc-kpi bc-kpi--${tone}${active ? ' bc-kpi--active' : ''}`}
      onClick={onClick}
    >
      <span className="bc-kpi__icon">
        <Icon size={20} strokeWidth={2.2} aria-hidden />
      </span>
      <span className="bc-kpi__body">
        <span className="bc-kpi__label">{label}</span>
        <span className="bc-kpi__value">
          {value ?? 0}
          {share != null ? <small>({share}%)</small> : null}
        </span>
        {hint ? <span className="bc-kpi__hint">{hint}</span> : null}
      </span>
      {active && <span className="bc-kpi__active-bar" aria-hidden="true" />}
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
      value: overview?.totalCompanies ?? 0,
      hint: k('kpiAllHint', { defaultValue: 'Barcha kompaniyalar' }),
    },
    {
      key: 'ACTIVE',
      icon: CheckCircle2,
      tone: 'success',
      value: overview?.activeCount ?? 0,
      share: percent(overview?.activeCount, total),
      hint: overview ? k('kpiMrrHint', { amount: money(overview.mrr), currency }) : null,
    },
    {
      key: 'OVERDUE',
      icon: AlertCircle,
      tone: 'danger',
      value: overview?.overdueCount ?? 0,
      share: percent(overview?.overdueCount, total),
      hint: overview ? k('kpiDebtHint', { amount: money(overview.debtTotal), currency }) : null,
    },
    {
      key: 'DUE_SOON',
      icon: Clock,
      tone: 'warning',
      value: overview?.dueSoonCount ?? 0,
      share: percent(overview?.dueSoonCount, total),
      hint: overview ? k('kpiExpectedHint', { amount: money(overview.expectedSoonAmount), currency }) : null,
    },
    {
      key: 'NEW',
      icon: UserPlus,
      tone: 'brand',
      value: overview?.newCompanies ?? 0,
      share: percent(overview?.newCompanies, total),
      hint: overview ? k('kpiNewHint', { count: overview.newCompanies, days: overview.newCompanyDays || 7 }) : null,
    },
    {
      key: 'SUSPENDED',
      icon: Ban,
      tone: 'neutral',
      value: overview?.suspendedCount ?? 0,
      share: percent(overview?.suspendedCount, total),
      hint: overview?.notBilledCount ? k('kpiNotBilledHint', { count: overview.notBilledCount }) : null,
    },
  ];

  return (
    <div
      className="bc-kpis"
      role="tablist"
      aria-label={t('platform.billing.title', { defaultValue: 'Billing KPI filtrlari' })}
    >
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
