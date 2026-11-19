import ScalesPluSyncExtras from './ScalesPluSyncExtras';

export default function ScalesPluSyncPanel({
  t,
  desktop,
  adapters,
  active,
  syncing,
  probing,
  lastExport,
  probeResult,
  pushDevices,
  password,
  onPasswordChange,
  onPasswordSave,
  lastSync,
  onSelectAdapter,
  onExportToScale,
  onProbeDevices,
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
        <div className="scales-plu-sync__actions">
          <button
            type="button"
            className="scales-btn scales-btn--ghost"
            disabled={!desktop || probing || syncing}
            onClick={onProbeDevices}
          >
            {probing ? t('scales.probing') : t('scales.probeDevices')}
          </button>
          <button
            type="button"
            className="scales-btn"
            disabled={!desktop || syncing || probing}
            onClick={onExportToScale}
          >
            {syncing ? t('scales.exporting') : t('scales.exportToScale')}
          </button>
        </div>
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

      {probeResult?.devices?.length ? (
        <ul className="scales-plu-sync__devices">
          {probeResult.devices.map((d) => (
            <li key={`${d.host}:${d.udpPort}`} className={d.ok ? 'is-online' : 'is-offline'}>
              {(d.label ? `${d.label} · ` : '') + d.host + ':' + d.udpPort}
              {d.ok ? ` — ${t('scales.probeOnline')}` : ` — ${d.error || t('scales.probeOffline')}`}
            </li>
          ))}
        </ul>
      ) : null}

      <ScalesPluSyncExtras
        t={t}
        desktop={desktop}
        password={password}
        onPasswordChange={onPasswordChange}
        onPasswordSave={onPasswordSave}
        lastSync={lastSync}
        pushDevices={pushDevices}
      />

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
