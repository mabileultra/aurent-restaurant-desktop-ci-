import { BaseButton, BaseInput, BaseCheckbox, PageLayout } from '../../../components/ui';
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
          <label className="reporting-sync-filters__checkbox flex items-center gap-2 cursor-pointer">
            <BaseCheckbox checked={p.backfillSales} onChange={(e) => p.setBackfillSales(e.target.checked)} size={18} />
            <span>{p.t('reportsSync.backfillSales')}</span>
          </label>
          <label className="reporting-sync-filters__checkbox flex items-center gap-2 cursor-pointer">
            <BaseCheckbox checked={p.backfillStock} onChange={(e) => p.setBackfillStock(e.target.checked)} size={18} />
            <span>{p.t('reportsSync.backfillStock')}</span>
          </label>
          <label className="reporting-sync-filters__checkbox flex items-center gap-2 cursor-pointer">
            <BaseCheckbox checked={p.backfillMovements} onChange={(e) => p.setBackfillMovements(e.target.checked)} size={18} />
            <span>{p.t('reportsSync.backfillMovements')}</span>
          </label>
          <label className="reporting-sync-filters__checkbox flex items-center gap-2 cursor-pointer">
            <BaseCheckbox checked={p.backfillShifts} onChange={(e) => p.setBackfillShifts(e.target.checked)} size={18} />
            <span>{p.t('reportsSync.backfillShifts')}</span>
          </label>
          <label className="reporting-sync-filters__checkbox flex items-center gap-2 cursor-pointer">
            <BaseCheckbox checked={p.backfillProducts} onChange={(e) => p.setBackfillProducts(e.target.checked)} size={18} />
            <span>{p.t('reportsSync.backfillProducts')}</span>
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
