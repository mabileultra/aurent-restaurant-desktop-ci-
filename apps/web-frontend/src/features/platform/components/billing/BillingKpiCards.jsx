import { AlertCircle, Ban, Building2, CheckCircle2, Clock, UserPlus } from 'lucide-react';

function percent(part, total) {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

function getHintColor(tone, cardKey) {
  if (cardKey === 'ALL' || cardKey === 'NEW' || cardKey === 'SUSPENDED') {
    return 'text-aa-ink-muted';
  }
  switch (tone) {
    case 'danger':
      return 'text-aa-danger';
    case 'success':
      return 'text-aa-success';
    case 'warning':
      return 'text-aa-warning';
    default:
      return 'text-aa-ink-muted';
  }
}

function KpiCard({ icon: Icon, tone, label, value, share, hint, active, onClick, cardKey }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`aa-kpi bc-kpi relative p-3.5 sm:p-4 rounded-aa-lg bg-aa-surface border transition-all duration-200 text-left w-full ${
        active
          ? 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring bc-kpi--active bg-aa-surface'
          : 'border-aa-line hover:border-aa-line-strong'
      } cursor-pointer hover:bg-aa-surface-hover hover:-translate-y-0.5`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon size={16} className="text-aa-ink-muted shrink-0" aria-hidden="true" />
        <span className="aa-kpi__label bc-kpi__label">
          {label}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="aa-kpi__value bc-kpi__value aa-num whitespace-nowrap">
          {value ?? 0}
          {share != null ? <small className="text-xs font-normal text-aa-ink-muted ml-1">({share}%)</small> : null}
        </span>
      </div>

      {hint ? (
        <p className={`aa-kpi__meta bc-kpi__hint ${getHintColor(tone, cardKey)}`}>
          {hint}
        </p>
      ) : null}
      {active && <span className="bc-kpi__active-bar sr-only" aria-hidden="true" />}
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
      className="bc-kpis grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
      role="tablist"
      aria-label={t('platform.billing.title', { defaultValue: 'Billing KPI filtrlari' })}
    >
      {cards.map(({ key, ...cardProps }) => (
        <KpiCard
          key={key}
          cardKey={key}
          {...cardProps}
          label={k(`kpi.${key}`)}
          active={tab === key}
          onClick={() => onTab(key)}
        />
      ))}
    </div>
  );
}
