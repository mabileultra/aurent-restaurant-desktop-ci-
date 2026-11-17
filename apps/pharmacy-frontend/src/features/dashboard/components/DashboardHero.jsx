import { useAuthStore } from '../../../store/authStore';

export default function DashboardHero({ t, periodLabel, isSingleDay, kpis }) {
  const fullName = useAuthStore((s) => s.user?.fullName);
  const firstName = (fullName || '').trim().split(/\s+/)[0] || '';

  return (
    <section className="ui-banner">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="ui-badge-primary">{periodLabel}</span>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {firstName
              ? t('dashboard.heroGreetingNamed', { name: firstName })
              : t('dashboard.heroGreeting')}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-ink-muted">
            {isSingleDay ? t('dashboard.heroHintToday') : t('dashboard.heroHintPeriod')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="ui-stat-chip">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t('dashboard.revenue')}
            </p>
            <p className="ui-tabular mt-0.5 text-sm font-bold text-ink sm:text-base">{kpis.revenue}</p>
          </div>
          <div className="ui-stat-chip">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t('dashboard.avgCheck')}
            </p>
            <p className="ui-tabular mt-0.5 text-sm font-bold text-ink sm:text-base">{kpis.avgCheck}</p>
          </div>
          <div className="ui-stat-chip col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t('dashboard.periodTransactions', { count: kpis.txCount })}
            </p>
            <p className="ui-tabular mt-0.5 text-sm font-bold text-ink sm:text-base">
              {kpis.itemsSold} · {t('dashboard.unitsSold')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
