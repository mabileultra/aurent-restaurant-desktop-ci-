import { openScalePicker, scaleAutoDetect, isDesktopScaleBridge } from '../../../scales/scaleBridge';

export default function ScalesConnectionBar({
  t,
  available,
  connected,
  reading,
  error,
  needsSetup,
  onReconnect,
}) {
  const desktop = isDesktopScaleBridge();
  const kg = reading?.kg != null ? Number(reading.kg).toFixed(3) : '—';
  const stable = Boolean(reading?.stable);

  return (
    <div className="scales-connection">
      <div className="scales-connection__status">
        <span
          className={`scales-connection__dot ${
            connected ? 'scales-connection__dot--ok' : 'scales-connection__dot--off'
          }`}
        />
        <div>
          <p className="scales-connection__title">
            {connected
              ? t('scales.connected')
              : desktop
                ? t('scales.disconnected')
                : t('scales.desktopRequired')}
          </p>
          <p className="scales-connection__meta">
            {error || (available ? t('scales.anyModelHint') : t('scales.bridgeHint'))}
          </p>
        </div>
      </div>

      <div className="scales-connection__reading">
        <span className="scales-connection__kg">{kg}</span>
        <span className="scales-connection__unit">кг</span>
        <span
          className={`scales-connection__stable ${
            stable ? 'scales-connection__stable--yes' : ''
          }`}
        >
          {stable ? t('scales.stable') : t('scales.unstable')}
        </span>
      </div>

      <div className="scales-connection__actions">
        <button type="button" className="scales-btn scales-btn--ghost" onClick={onReconnect} disabled={!desktop}>
          {t('scales.reconnect')}
        </button>
        <button
          type="button"
          className="scales-btn scales-btn--ghost"
          disabled={!desktop}
          onClick={() => openScalePicker()}
        >
          {t('scales.setup')}
        </button>
        {(needsSetup || !connected) && desktop ? (
          <button
            type="button"
            className="scales-btn"
            onClick={async () => {
              await scaleAutoDetect();
              onReconnect?.();
            }}
          >
            {t('scales.autoDetect')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
