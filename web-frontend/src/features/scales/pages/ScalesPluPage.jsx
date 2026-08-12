import ScalesPluTable from '../components/ScalesPluTable';
import ScalesPluSyncPanel from '../components/ScalesPluSyncPanel';
import { useScalesPluPage } from '../hooks/useScalesPluPage';
import { useScalesPluSync } from '../hooks/useScalesPluSync';
import '../../../styles/scales/scales-plu.css';

export default function ScalesPluPage() {
  const {
    t,
    items,
    draftPlu,
    loading,
    savingId,
    onDraftChange,
    onSave,
    reload,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
  } = useScalesPluPage();
  const sync = useScalesPluSync(t);

  return (
    <div className="scales-plu-page">
      <header className="scales-plu-page__header">
        <div>
          <h1 className="scales-plu-page__title">{t('scales.pluPageTitle')}</h1>
          <p className="scales-plu-page__subtitle">{t('scales.pluPageSubtitle')}</p>
        </div>
        <button type="button" className="scales-btn scales-btn--ghost" onClick={reload} disabled={loading}>
          {t('scales.refresh')}
        </button>
      </header>

      <ScalesPluSyncPanel
        t={t}
        desktop={sync.desktop}
        adapters={sync.adapters}
        active={sync.active}
        syncing={sync.syncing}
        lastExport={sync.lastExport}
        onSelectAdapter={sync.onSelectAdapter}
        onExportToScale={sync.onExportToScale}
      />

      {loading ? (
        <div className="scales-plu-page__loading">{t('scales.loading')}</div>
      ) : (
        <ScalesPluTable
          t={t}
          items={items}
          draftPlu={draftPlu}
          onDraftChange={onDraftChange}
          onSave={onSave}
          savingId={savingId}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
