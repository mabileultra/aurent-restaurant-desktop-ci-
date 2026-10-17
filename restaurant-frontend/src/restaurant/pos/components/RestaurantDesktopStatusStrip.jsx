import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';
import { getPendingFiscalCount, subscribePendingFiscals } from '../utils/pendingFiscalQueue';

/**
 * Hall PC status strip: link + pending outbox/OFD counts (not a mode switch).
 */
export default function RestaurantDesktopStatusStrip() {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [ofdPending, setOfdPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isRestaurantDesktop()) return undefined;
    let unsub = () => {};
    (async () => {
      try {
        const s = await window.aurentRestaurant?.getStatus?.();
        if (s) setStatus(s);
      } catch {
        /* ignore */
      }
    })();
    if (typeof window.aurentRestaurant?.onStatus === 'function') {
      unsub = window.aurentRestaurant.onStatus((s) => setStatus(s));
    }
    setOfdPending(getPendingFiscalCount());
    const unsubOfd = subscribePendingFiscals(setOfdPending);
    return () => {
      unsub();
      unsubOfd();
    };
  }, []);

  if (!isRestaurantDesktop() || !status) return null;

  const online = typeof navigator !== 'undefined' && navigator.onLine !== false;
  const pendingOutbox = Number(status.pendingOutbox || 0);
  const healthy = Boolean(status.serviceHealthy);

  const onSync = async () => {
    if (syncing || !online) return;
    setSyncing(true);
    try {
      const res = await window.aurentRestaurant?.pushCloudSync?.();
      const n = Number(res?.pushed || 0);
      toast.success(t('rst.edge.syncDone', {
        count: n,
        defaultValue: 'Синхронизация: {{count}}',
      }));
    } catch (err) {
      toast.error(err?.message || t('rst.edge.syncFailed', { defaultValue: 'Синхронизация не удалась' }));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        padding: '6px 12px',
        fontSize: 12,
        background: healthy ? '#0f172a' : '#450a0a',
        color: '#e2e8f0',
        borderBottom: '1px solid #1e293b',
      }}
    >
      <span style={{ opacity: 0.9 }}>
        {healthy
          ? t('rst.edge.localOk', { defaultValue: 'Локальный сервис' })
          : t('rst.edge.localDown', { defaultValue: 'Сервис недоступен' })}
      </span>
      <span style={{ opacity: 0.7 }}>·</span>
      <span>{online
        ? t('rst.edge.online', { defaultValue: 'Сеть есть' })
        : t('rst.edge.offline', { defaultValue: 'Офлайн' })}
      </span>
      {(pendingOutbox > 0 || ofdPending > 0) && (
        <>
          <span style={{ opacity: 0.7 }}>·</span>
          <span>
            {t('rst.edge.queues', {
              outbox: pendingOutbox,
              ofd: ofdPending,
              defaultValue: 'Очередь sync {{outbox}} / ОФД {{ofd}}',
            })}
          </span>
        </>
      )}
      {online && pendingOutbox > 0 && (
        <button
          type="button"
          disabled={syncing}
          onClick={onSync}
          style={{
            marginLeft: 'auto',
            border: 0,
            borderRadius: 6,
            padding: '4px 10px',
            background: '#38bdf8',
            color: '#0c4a6e',
            fontWeight: 600,
            cursor: syncing ? 'wait' : 'pointer',
          }}
        >
          {syncing
            ? t('rst.edge.syncing', { defaultValue: 'Синк…' })
            : t('rst.edge.syncNow', { defaultValue: 'Синхронизировать' })}
        </button>
      )}
    </div>
  );
}
