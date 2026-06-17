import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export default function OfflineStatusTopbar() {
  const { t } = useTranslation();
  const status = useOfflineStatus();

  if (!status.visible) return null;

  const StatusIcon = status.showOffline ? CloudOff : Wifi;

  return (
    <div
      className={`offline-topbar offline-topbar--${status.tone}`}
      role="status"
      title={status.message}
    >
      <span className="offline-topbar__status">
        <span className="offline-topbar__icon" aria-hidden>
          <StatusIcon size={14} strokeWidth={2.25} />
        </span>
        <span className="offline-topbar__label">{status.shortLabel}</span>
      </span>

      <span className="offline-topbar__actions">
        {status.actions.showSwitchOffline ? (
          <button
            type="button"
            className="offline-topbar__btn"
            title={t('offline.switchToOffline')}
            onClick={() => status.handlers.toggleForceOffline(true)}
          >
            <CloudOff size={14} strokeWidth={2.25} aria-hidden />
            <span className="visually-hidden">{t('offline.switchToOffline')}</span>
          </button>
        ) : null}
        {status.actions.showSwitchOnline ? (
          <button
            type="button"
            className="offline-topbar__btn"
            title={t('offline.switchToOnline')}
            onClick={() => status.handlers.toggleForceOffline(false)}
          >
            <Wifi size={14} strokeWidth={2.25} aria-hidden />
            <span className="visually-hidden">{t('offline.switchToOnline')}</span>
          </button>
        ) : null}
        {status.actions.showSyncSales ? (
          <button
            type="button"
            className="offline-topbar__btn"
            title={status.syncing ? t('offline.syncing') : t('offline.syncSales')}
            disabled={status.syncing}
            onClick={status.handlers.syncSales}
          >
            <RefreshCw size={14} className={status.syncing ? 'offline-topbar__spin' : ''} aria-hidden />
            <span className="visually-hidden">{t('offline.syncSales')}</span>
          </button>
        ) : null}
        {status.actions.showRefreshCatalog ? (
          <button
            type="button"
            className="offline-topbar__btn"
            title={status.syncingCatalog ? t('offline.updatingCatalog') : t('offline.updateCatalog')}
            disabled={status.syncingCatalog}
            onClick={status.handlers.refreshCatalog}
          >
            <RefreshCw
              size={14}
              className={status.syncingCatalog ? 'offline-topbar__spin' : ''}
              aria-hidden
            />
            <span className="visually-hidden">{t('offline.updateCatalog')}</span>
          </button>
        ) : null}
      </span>
    </div>
  );
}
