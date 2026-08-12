import toast from 'react-hot-toast';
import {
  openScalePicker,
  scaleAutoDetect,
  isDesktopApp,
  isDesktopScaleBridge,
} from '../../../scales/scaleBridge';

export default function ScalesConnectionBar({
  t,
  available,
  connected,
  reading,
  error,
  needsSetup,
  onReconnect,
}) {
  const desktop = isDesktopApp();
  const scalesApi = isDesktopScaleBridge();
  const canControl = scalesApi;
  const kg = reading?.kg != null ? Number(reading.kg).toFixed(3) : '—';
  const stable = Boolean(reading?.stable);

  const statusTitle = connected
    ? t('scales.connected')
    : scalesApi
      ? t('scales.disconnected')
      : desktop
        ? t('scales.desktopUpdateRequired')
        : t('scales.desktopRequired');

  const statusMeta =
    error ||
    (scalesApi
      ? available
        ? t('scales.anyModelHint')
        : t('scales.bridgeHint')
      : desktop
        ? t('scales.desktopUpdateHint')
        : t('scales.bridgeHint'));

  const onSetup = async () => {
    if (!canControl) {
      toast.error(desktop ? t('scales.desktopUpdateRequired') : t('scales.desktopRequired'));
      return;
    }
    const res = await openScalePicker();
    if (res?.ok === false) {
      toast.error(res.message || t('scales.setupFailed'));
      return;
    }
    onReconnect?.();
  };

  const onAuto = async () => {
    if (!canControl) {
      toast.error(desktop ? t('scales.desktopUpdateRequired') : t('scales.desktopRequired'));
      return;
    }
    const res = await scaleAutoDetect({ save: true });
    if (res?.ok) {
      toast.success(t('scales.autoDetectOk'));
      onReconnect?.();
    } else {
      toast.error(res?.message || t('scales.autoDetectFailed'));
    }
  };

  const onReconnectClick = () => {
    if (!canControl) {
      toast.error(desktop ? t('scales.desktopUpdateRequired') : t('scales.desktopRequired'));
      return;
    }
    onReconnect?.();
  };

  return (
    <div className="scales-connection">
      <div className="scales-connection__status">
        <span
          className={`scales-connection__dot ${
            connected ? 'scales-connection__dot--ok' : 'scales-connection__dot--off'
          }`}
        />
        <div>
          <p className="scales-connection__title">{statusTitle}</p>
          <p className="scales-connection__meta">{statusMeta}</p>
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
        <button type="button" className="scales-btn scales-btn--ghost" onClick={onReconnectClick}>
          {t('scales.reconnect')}
        </button>
        <button type="button" className="scales-btn scales-btn--ghost" onClick={onSetup}>
          {t('scales.setup')}
        </button>
        {(needsSetup || !connected) && (
          <button type="button" className="scales-btn scales-btn--primary" onClick={onAuto}>
            {t('scales.autoDetect')}
          </button>
        )}
      </div>
    </div>
  );
}
