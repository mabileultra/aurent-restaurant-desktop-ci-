import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BaseButton } from '../../../components/ui';
import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineGetStatus,
  rstOfflineResolvePrintJob,
} from '../../../services/offline/restaurantOfflineBridge';
import { openActivityLogFolder, openActivityLogViewer } from '../../../services/desktop/activityLog';
import { validateLocalFirstPrinterSetup } from '../../pos/utils/validateLocalFirstPrinterSetup';

/**
 * Local-first status, printer startup check, UNKNOWN resolve, activity journal.
 * Kept separate from RestaurantPrinterSettings mapping UI.
 */
export default function LocalFirstLogPanel({ t, stations = [], settings = null, printers = [] }) {
  const enabled = isRestaurantLocalFirstDesktop();
  const bridge = isRestaurantOfflineBridge();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const printerCheck = validateLocalFirstPrinterSetup({
    stations,
    stationPrinters: settings?.stationPrinters || {},
    billPrinterName: settings?.billPrinterName || '',
    osPrinterNames: (Array.isArray(printers) ? printers : [])
      .map((p) => p?.name || p)
      .filter(Boolean),
  });

  const refresh = async () => {
    if (!bridge) {
      setStatus(null);
      return;
    }
    setBusy(true);
    try {
      setStatus(await rstOfflineGetStatus());
    } catch {
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
    if (!bridge) return undefined;
    const timer = window.setInterval(() => {
      void refresh();
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [bridge]);

  useEffect(() => {
    if (!enabled || printerCheck.canOperate) return undefined;
    const key = 'rst-local-first-printer-warn';
    try {
      if (sessionStorage.getItem(key) === '1') return undefined;
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
    toast.error(t('rst.admin.localFirstPrinterWarn'), { duration: 10_000 });
    return undefined;
  }, [enabled, printerCheck.canOperate, t]);

  const openJournal = async () => {
    const res = await openActivityLogViewer();
    if (res?.ok === false) {
      toast.error(t('rst.admin.localFirstOpenLogFailed'));
    }
  };

  const openFolder = async () => {
    const res = await openActivityLogFolder();
    if (res?.ok === false) {
      toast.error(t('rst.admin.localFirstOpenLogFailed'));
    }
  };

  const resolveJob = async (jobId, action) => {
    setBusy(true);
    try {
      await rstOfflineResolvePrintJob({ jobId, action });
      toast.success(t('rst.admin.localFirstResolveOk'));
      setStatus(await rstOfflineGetStatus());
    } catch {
      toast.error(t('rst.admin.localFirstResolveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rst-printers__block">
      <h2 className="rst-printers__title">{t('rst.admin.localFirstTitle')}</h2>
      <p className="rst-printers__note">{t('rst.admin.localFirstHint')}</p>
      {!enabled ? (
        <>
          <p className="rst-coming__text">{t('rst.admin.localFirstOff')}</p>
          {typeof window.desktopCashier?.setRestaurantLocalFirst === 'function' ? (
            <BaseButton
              type="button"
              onClick={async () => {
                if (!printerCheck.canOperate) {
                  toast.error(t('rst.admin.localFirstPrinterWarn'), { duration: 10_000 });
                }
                try {
                  await window.desktopCashier.setRestaurantLocalFirst(true);
                  toast.success(t('rst.admin.localFirstEnabled'));
                } catch {
                  toast.error(t('rst.admin.localFirstEnableFailed'));
                }
              }}
            >
              {t('rst.admin.localFirstEnable')}
            </BaseButton>
          ) : null}
        </>
      ) : !bridge ? (
        <p className="rst-coming__text mb-0">{t('rst.admin.localFirstNeedUpdate')}</p>
      ) : (
        <>
          <div className="rst-admin-form__grid rst-admin-form__grid--printers">
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstPrinters')}</span>
              <span className="rst-admin-field__hint">
                {printerCheck.ok
                  ? t('rst.admin.localFirstPrintersOk')
                  : printerCheck.canOperate
                    ? t('rst.admin.localFirstPrintersPartial', {
                        stations: printerCheck.missingStations
                          .map((r) => r.stationName)
                          .join(', ') || '—',
                      })
                    : t('rst.admin.localFirstPrintersMissing')}
              </span>
              {printerCheck.stationRows.length > 0 ? (
                <ul className="rst-admin-field__hint mb-0" style={{ listStyle: 'none', padding: 0 }}>
                  {printerCheck.stationRows.map((row) => (
                    <li key={String(row.stationId)}>
                      {row.ok ? '✓' : '⚠'} {row.stationName}
                      {row.printerName ? `: ${row.printerName}` : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstRuntime')}</span>
              <span className="rst-admin-field__hint">
                {status?.runtimeStarted
                  ? t('rst.admin.localFirstRuntimeOn')
                  : t('rst.admin.localFirstRuntimeOff')}
              </span>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstBootstrap')}</span>
              <span className="rst-admin-field__hint">
                {status?.bootstrapReady
                  ? t('rst.admin.localFirstBootstrapOk', {
                      menu: status.menuItemCount ?? 0,
                      tables: status.tableCount ?? 0,
                    })
                  : t('rst.admin.localFirstBootstrapWait')}
              </span>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstQueues')}</span>
              <span className="rst-admin-field__hint">
                {t('rst.admin.localFirstQueuesValue', {
                  print: status?.pendingPrintJobs ?? 0,
                  unknown: status?.unknownPrintJobs ?? 0,
                  outbox: status?.pendingOutbox ?? 0,
                })}
              </span>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstSession')}</span>
              <span className="rst-admin-field__hint">
                {status?.hasAuthSession
                  ? t('rst.admin.localFirstSessionOn')
                  : t('rst.admin.localFirstSessionOff')}
                {status?.deviceId ? ` · ${status.deviceId}` : ''}
              </span>
            </div>
          </div>
          {(status?.unresolvedPrintJobs || []).length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <p className="rst-printers__note">{t('rst.admin.localFirstUnknownHint')}</p>
              {(status.unresolvedPrintJobs || []).map((job) => (
                <div key={job.id} className="rst-admin-field" style={{ marginBottom: 10 }}>
                  <span className="rst-admin-field__label">
                    {job.status} · {job.printerName || '—'} · {job.kind || 'ticket'}
                  </span>
                  <span className="rst-admin-field__hint">
                    {job.orderId ? `order ${job.orderId}` : job.id}
                    {job.lastError ? ` · ${job.lastError}` : ''}
                  </span>
                  <div className="rst-printers__row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                    {job.status === 'UNKNOWN' ? (
                      <>
                        <BaseButton
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void resolveJob(job.id, 'ACK_PRINTED')}
                        >
                          {t('rst.admin.localFirstAckPrinted')}
                        </BaseButton>
                        <BaseButton
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void resolveJob(job.id, 'MARK_FAILED')}
                        >
                          {t('rst.admin.localFirstMarkFailed')}
                        </BaseButton>
                      </>
                    ) : null}
                    <BaseButton
                      type="button"
                      disabled={busy}
                      onClick={() => void resolveJob(job.id, 'REQUEUE')}
                    >
                      {t('rst.admin.localFirstRequeue')}
                    </BaseButton>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="rst-printers__row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <BaseButton type="button" variant="ghost" disabled={busy} onClick={() => void refresh()}>
              {busy ? t('common.loading') : t('rst.admin.localFirstRefresh')}
            </BaseButton>
            <BaseButton type="button" onClick={() => void openJournal()}>
              {t('rst.admin.localFirstOpenLog')}
            </BaseButton>
            <BaseButton type="button" variant="ghost" onClick={() => void openFolder()}>
              {t('rst.admin.localFirstOpenFolder')}
            </BaseButton>
          </div>
        </>
      )}
    </section>
  );
}
