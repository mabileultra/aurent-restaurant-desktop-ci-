import { PageLayout } from '../../../components/ui';
import DashboardChartsRow from '../components/DashboardChartsRow';
import DashboardDateRangePicker from '../components/DashboardDateRangePicker';
import DashboardHero from '../components/DashboardHero';
import DashboardKpiGrid from '../components/DashboardKpiGrid';
import DashboardLowStockTable from '../components/DashboardLowStockTable';
import { useDashboardPage } from '../hooks/useDashboardPage';

export default function DashboardPage() {
  const p = useDashboardPage();

  return (
    <PageLayout
      title={p.t('dashboard.title')}
      subtitle={p.periodLabel}
      actions={(
        <DashboardDateRangePicker
          t={p.t}
          from={p.from}
          to={p.to}
          onFromChange={p.setFrom}
          onToChange={p.setTo}
          presets={p.presets}
          onPreset={p.applyPreset}
          isPresetActive={p.isPresetActive}
        />
      )}
    >
      {p.invalidRange ? (
        <div className="ui-alert-warning" role="alert">
          {p.t('dashboard.invalidRange')}
        </div>
      ) : null}

      {!p.invalidRange ? (
        <DashboardHero
          t={p.t}
          periodLabel={p.periodLabel}
          isSingleDay={p.isSingleDay}
          kpis={p.kpis}
        />
      ) : null}

      <DashboardKpiGrid t={p.t} isSingleDay={p.isSingleDay} kpis={p.kpis} />
      <DashboardChartsRow t={p.t} periodReport={p.periodReport} topProducts={p.topProducts} />
      <DashboardLowStockTable t={p.t} lowStock={p.lowStock} />
    </PageLayout>
  );
}
