import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BaseButton } from '../../../components/ui';
import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineGetStatus,
  rstOfflineResolvePrintJob,
  rstOfflineCreateMenuItem,
  rstOfflinePullHubSnapshot,
} from '../../../services/offline/restaurantOfflineBridge';
import { openActivityLogFolder, openActivityLogViewer } from '../../../services/desktop/activityLog';
import { validateLocalFirstPrinterSetup } from '../../pos/utils/validateLocalFirstPrinterSetup';
import { getConfiguredHubUrl } from '../../../services/offline/waiterPwa/outboxSync';
import { discoverLanHubs } from '../../../services/offline/discoverLanHubs';
import {
  getPeerHubUrl,
  setPeerHubUrl,
  isPeerHubAutoSync,
  setPeerHubAutoSync,
  requestRestaurantBootstrapRefresh,
} from '../../../services/offline/peerHubSettings';

/**
 * Local-first status, printer startup check, UNKNOWN resolve, activity journal.
 * Kept separate from RestaurantPrinterSettings mapping UI.
 */
export default function LocalFirstLogPanel({ t, stations = [], settings = null, printers = [] }) {
  const enabled = isRestaurantLocalFirstDesktop();
  const bridge = isRestaurantOfflineBridge();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [peerHubUrl, setPeerHubUrlState] = useState(() => getPeerHubUrl() || getConfiguredHubUrl());
  const [peerAuto, setPeerAuto] = useState(() => isPeerHubAutoSync());

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
              <BaseButton
                type="button"
                variant="ghost"
                style={{ marginTop: 6 }}
                disabled={busy}
                onClick={() => {
                  requestRestaurantBootstrapRefresh();
                  toast.success(t('rst.admin.localFirstBootstrapPull', {
                    defaultValue: 'Тянем меню/столы с сервера…',
                  }));
                  window.setTimeout(() => void refresh(), 2500);
                }}
              >
                {t('rst.admin.localFirstBootstrapNow', { defaultValue: 'Обновить с сервера' })}
              </BaseButton>
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
            {status?.hub?.url ? (
              <div className="rst-admin-field">
                <span className="rst-admin-field__label">
                  {t('rst.admin.localFirstHub', { defaultValue: 'LAN Hub (официанты)' })}
                </span>
                <span className="rst-admin-field__hint">{status.hub.url}</span>
                <BaseButton
                  type="button"
                  variant="ghost"
                  style={{ marginTop: 6 }}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(status.hub.url);
                      toast.success(t('rst.admin.localFirstHubCopied', {
                        defaultValue: 'Hub URL скопирован — вставьте на телефоне официанта',
                      }));
                    } catch {
                      toast.error(status.hub.url);
                    }
                  }}
                >
                  {t('rst.admin.localFirstHubCopy', { defaultValue: 'Копировать Hub URL' })}
                </BaseButton>
              </div>
            ) : null}
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">
                {t('rst.admin.localFirstPeerHub', { defaultValue: 'Peer Hub (другая касса)' })}
              </span>
              <input
                type="url"
                value={peerHubUrl}
                onChange={(e) => setPeerHubUrlState(e.target.value)}
                placeholder="http://192.168.x.x:8787"
                style={{ width: '100%', marginTop: 4, padding: '6px 8px' }}
              />
              <label className="rst-admin-field__hint" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={peerAuto}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setPeerAuto(on);
                    setPeerHubAutoSync(on);
                    if (on && String(peerHubUrl || '').trim()) {
                      setPeerHubUrl(String(peerHubUrl).replace(/\/$/, ''));
                    }
                  }}
                />
                {t('rst.admin.localFirstPeerAuto', { defaultValue: 'Авто-синк каждые ~12с' })}
              </label>
              <div className="rst-printers__row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                <BaseButton
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const hits = await discoverLanHubs({ preferUrl: peerHubUrl });
                      if (!hits.length) {
                        toast.error(t('rst.admin.localFirstPeerEmpty', {
                          defaultValue: 'Hub в LAN не найден',
                        }));
                        return;
                      }
                      setPeerHubUrlState(hits[0].url);
                      setPeerHubUrl(hits[0].url);
                      toast.success(hits[0].url);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t('rst.admin.localFirstPeerDiscover', { defaultValue: 'Найти' })}
                </BaseButton>
                <BaseButton
                  type="button"
                  disabled={busy || !String(peerHubUrl || '').trim()}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const url = String(peerHubUrl).replace(/\/$/, '');
                      setPeerHubUrl(url);
                      const res = await rstOfflinePullHubSnapshot(url);
                      toast.success(t('rst.admin.localFirstPeerPulled', {
                        defaultValue: `Стянуто заказов: ${res?.mergedOrders ?? 0}`,
                        count: res?.mergedOrders ?? 0,
                      }));
                      setStatus(await rstOfflineGetStatus());
                    } catch {
                      toast.error(t('rst.admin.localFirstPeerFail', {
                        defaultValue: 'Не удалось стянуть snapshot с Hub',
                      }));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t('rst.admin.localFirstPeerPull', { defaultValue: 'Стянуть заказы/меню' })}
                </BaseButton>
              </div>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">
                {t('rst.admin.localFirstDraftDish', { defaultValue: 'Блюдо offline' })}
              </span>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={t('rst.admin.localFirstDraftName', { defaultValue: 'Название' })}
                style={{ width: '100%', marginTop: 4, padding: '6px 8px' }}
              />
              <input
                type="number"
                min="0"
                step="100"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                placeholder={t('rst.admin.localFirstDraftPrice', { defaultValue: 'Цена' })}
                style={{ width: '100%', marginTop: 4, padding: '6px 8px' }}
              />
              <BaseButton
                type="button"
                style={{ marginTop: 6 }}
                disabled={busy || !String(draftName || '').trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await rstOfflineCreateMenuItem({
                      name: String(draftName).trim(),
                      price: Number(draftPrice) || 0,
                    });
                    setDraftName('');
                    setDraftPrice('');
                    toast.success(t('rst.admin.localFirstDraftOk', {
                      defaultValue: 'Блюдо добавлено локально',
                    }));
                    setStatus(await rstOfflineGetStatus());
                  } catch {
                    toast.error(t('rst.admin.localFirstDraftFail', {
                      defaultValue: 'Не удалось создать блюдо',
                    }));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t('rst.admin.localFirstDraftAdd', { defaultValue: 'Добавить блюдо' })}
              </BaseButton>
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
