export default function ScalesPluSyncPanel({
  t,
  desktop,
  adapters,
  active,
  syncing,
  lastExport,
  onSelectAdapter,
  onExportToScale,
}) {
  const canPush = Boolean(active?.capabilities?.pluPush);
  const readyNow = adapters.filter((a) => a.readyNow || a.id === 'weight-generic');
  const families = adapters.filter((a) => a.family || (a.id || '').startsWith('family-'));

  return (
    <section className="scales-plu-sync">
      <div className="scales-plu-sync__head">
        <div>
          <h2 className="scales-plu-sync__title">{t('scales.syncTitle')}</h2>
          <p className="scales-plu-sync__subtitle">{t('scales.syncSubtitle')}</p>
        </div>
        <button
          type="button"
          className="scales-btn"
          disabled={!desktop || syncing}
          onClick={onExportToScale}
        >
          {syncing ? t('scales.exporting') : t('scales.exportToScale')}
        </button>
      </div>

      {!desktop ? (
        <p className="scales-plu-sync__hint">{t('scales.syncDesktopHint')}</p>
      ) : null}

      {adapters.length > 0 ? (
        <div className="scales-plu-sync__row">
          <label className="scales-plu-sync__label" htmlFor="scales-adapter">
            {t('scales.adapterLabel')}
          </label>
          <select
            id="scales-adapter"
            className="scales-plu-sync__select"
            value={active?.id || active?.activeId || 'weight-generic'}
            onChange={(e) => onSelectAdapter(e.target.value)}
            disabled={!desktop}
          >
            {readyNow.length ? (
              <optgroup label={t('scales.adapterGroupReady')}>
                {readyNow.map((adapter) => (
                  <option key={adapter.id} value={adapter.id}>
                    {adapter.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {families.length ? (
              <optgroup label={t('scales.adapterGroupFamilies')}>
                {families.map((adapter) => (
                  <option key={adapter.id} value={adapter.id}>
                    {adapter.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
          <p className="scales-plu-sync__meta">
            {active?.description || t('scales.adapterWeightHint')}
            {active?.modelsHint ? ` · ${active.modelsHint}` : ''}
            {!canPush ? ` — ${t('scales.adapterNoPush')}` : ` — ${t('scales.adapterFamilyHint')}`}
          </p>
        </div>
      ) : null}

      {lastExport ? (
        <p className="scales-plu-sync__stats">
          {t('scales.exportStats', {
            total: lastExport.total ?? 0,
            withPlu: lastExport.withPlu ?? 0,
            profile: lastExport.labelProfile || 'AURENT_20_WEIGHT',
          })}
        </p>
      ) : null}
    </section>
  );
}
