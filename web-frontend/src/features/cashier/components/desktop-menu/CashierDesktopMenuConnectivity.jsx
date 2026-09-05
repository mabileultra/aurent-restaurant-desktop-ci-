import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { isDesktopCashier } from '../../../../utils/authLogin';
import { useCashierUiScale } from '../../hooks/useCashierUiScale';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import CashierZoomControls from '../CashierZoomControls';

/**
 * Zoom + online/offline controls for the desktop Aurent settings menu.
 */
export default function CashierDesktopMenuConnectivity({ t }) {
  const zoom = useCashierUiScale();
  const status = useOfflineStatus();
  const desktop = isDesktopCashier();

  if (!desktop) return null;

  const canToggle = Boolean(status.offlineAllowed);
  const isOffline = status.showOffline || status.tone === 'offline' || status.forceOfflineMode;
  const modeLabel = isOffline
    ? t('offline.bottomCloudOffline')
    : t('offline.bottomCloudOnline');
  const needsCatalog = !status.canSellOffline && !status.forceOfflineMode;

  return (
    <div className="cashier-desktop-menu__connectivity">
      <div className="cashier-desktop-menu__section-label">{t('desktop.displaySection')}</div>
      <div className="cashier-desktop-menu__zoom-row" role="group" aria-label={t('pos.zoomLabel')}>
        <span className="cashier-desktop-menu__zoom-caption">{t('pos.zoomLabel')}</span>
        <CashierZoomControls zoom={zoom} t={t} />
      </div>

      <div className="cashier-desktop-menu__section-label">{t('desktop.connectionSection')}</div>
      <button
        type="button"
        className={[
          'cashier-desktop-menu__mode',
          isOffline ? 'is-offline' : 'is-online',
          canToggle ? 'is-toggle' : '',
          status.forceOfflineMode ? 'is-forced' : '',
        ].filter(Boolean).join(' ')}
        role="menuitem"
        disabled={!canToggle || status.syncingCatalog}
        aria-pressed={Boolean(status.forceOfflineMode)}
        title={
          canToggle
            ? (status.forceOfflineMode ? t('offline.switchToOnline') : t('offline.switchToOffline'))
            : (status.message || modeLabel)
        }
        onClick={() => {
          if (!canToggle || status.syncingCatalog) return;
          status.handlers.toggleForceOffline(!status.forceOfflineMode);
        }}
      >
        <span className="cashier-desktop-menu__mode-icon" aria-hidden>
          {isOffline ? <CloudOff size={18} strokeWidth={2.25} /> : <Cloud size={18} strokeWidth={2.25} />}
        </span>
        <span className="cashier-desktop-menu__item-text">
          <span>{modeLabel}</span>
          <span className="cashier-desktop-menu__item-meta">
            {status.syncingCatalog
              ? t('offline.preparingCatalogForOffline')
              : canToggle
                ? (status.forceOfflineMode ? t('offline.switchToOnline') : t('offline.switchToOffline'))
                : (status.message || t('offline.onlineOk'))}
          </span>
        </span>
        <span className="cashier-desktop-menu__mode-switch" aria-hidden>
          <span className="cashier-desktop-menu__mode-knob" />
        </span>
      </button>
      {status.actions.showRefreshCatalog || needsCatalog ? (
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          disabled={status.syncingCatalog || status.forceOfflineMode || status.networkOffline}
          onClick={() => status.handlers.refreshCatalog()}
        >
          <RefreshCw
            size={18}
            strokeWidth={2}
            className={status.syncingCatalog ? 'cashier-desktop-menu__spin' : undefined}
            aria-hidden
          />
          <span>
            {status.syncingCatalog ? t('offline.updatingCatalog') : t('offline.updateCatalog')}
          </span>
        </button>
      ) : null}
    </div>
  );
}
