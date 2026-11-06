import { BaseButton, BaseInput, PageLayout } from '../../../components/ui';
import { useReportingSyncPage } from '../hooks/useReportingSyncPage';
import '../../../styles/reports/reporting-sync.css';

export default function ReportingSyncPage() {
  const p = useReportingSyncPage();
  const canRun = p.backfillFrom && p.backfillTo && (
    p.backfillSales || p.backfillStock || p.backfillMovements || p.backfillShifts || p.backfillProducts
  );

  return (
    <PageLayout
      title={p.t('reportsSync.title')}
      subtitle={p.t('reportsSync.subtitle')}
    >
      <section className="reporting-sync-backfill">
        <h2 className="reporting-sync-backfill__title">{p.t('reportsSync.backfillTitle')}</h2>
        <p className="reporting-sync-backfill__hint">{p.t('reportsSync.backfillHint')}</p>
        <div className="reporting-sync-filters">
          <div className="reporting-sync-filters__field">
            <BaseInput
              type="date"
              label={p.t('reportsSync.from')}
              value={p.backfillFrom}
              onChange={(e) => p.setBackfillFrom(e.target.value)}
            />
          </div>
          <div className="reporting-sync-filters__field">
            <BaseInput
              type="date"
              label={p.t('reportsSync.to')}
              value={p.backfillTo}
              onChange={(e) => p.setBackfillTo(e.target.value)}
            />
          </div>
          <label className="reporting-sync-filters__checkbox">
            <input type="checkbox" checked={p.backfillSales} onChange={(e) => p.setBackfillSales(e.target.checked)} />
            {p.t('reportsSync.backfillSales')}
          </label>
          <label className="reporting-sync-filters__checkbox">
            <input type="checkbox" checked={p.backfillStock} onChange={(e) => p.setBackfillStock(e.target.checked)} />
            {p.t('reportsSync.backfillStock')}
          </label>
          <label className="reporting-sync-filters__checkbox">
            <input type="checkbox" checked={p.backfillMovements} onChange={(e) => p.setBackfillMovements(e.target.checked)} />
            {p.t('reportsSync.backfillMovements')}
          </label>
          <label className="reporting-sync-filters__checkbox">
            <input type="checkbox" checked={p.backfillShifts} onChange={(e) => p.setBackfillShifts(e.target.checked)} />
            {p.t('reportsSync.backfillShifts')}
          </label>
          <label className="reporting-sync-filters__checkbox">
            <input type="checkbox" checked={p.backfillProducts} onChange={(e) => p.setBackfillProducts(e.target.checked)} />
            {p.t('reportsSync.backfillProducts')}
          </label>
          <BaseButton
            onClick={() => p.backfillMutation.mutate()}
            disabled={!canRun || p.backfillMutation.isPending}
          >
            {p.t('reportsSync.runBackfill')}
          </BaseButton>
        </div>
      </section>
    </PageLayout>
  );
}
