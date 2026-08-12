import ScalesPluTable from '../components/ScalesPluTable';
import { useScalesPluPage } from '../hooks/useScalesPluPage';
import '../../../styles/scales/scales-plu.css';

export default function ScalesPluPage() {
  const { t, items, draftPlu, loading, savingId, onDraftChange, onSave, reload } = useScalesPluPage();

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
        />
      )}
    </div>
  );
}
