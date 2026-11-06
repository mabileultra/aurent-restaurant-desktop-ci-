import { useAuthStore } from '../../../store/authStore';

export default function DashboardHero({ t, periodLabel, isSingleDay, kpis }) {
  const fullName = useAuthStore((s) => s.user?.fullName);
  const firstName = (fullName || '').trim().split(/\s+/)[0] || '';

  return (
    <section className="admin-hero p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/75">{periodLabel}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {firstName
              ? t('dashboard.heroGreetingNamed', { name: firstName })
              : t('dashboard.heroGreeting')}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/85">
            {isSingleDay ? t('dashboard.heroHintToday') : t('dashboard.heroHintPeriod')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-[2px]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              {t('dashboard.revenue')}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">{kpis.revenue}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-[2px]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              {t('dashboard.avgCheck')}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">{kpis.avgCheck}</p>
          </div>
          <div className="col-span-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-[2px] sm:col-span-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              {t('dashboard.periodTransactions', { count: kpis.txCount })}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">
              {kpis.itemsSold} · {t('dashboard.unitsSold')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
