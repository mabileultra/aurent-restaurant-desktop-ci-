import { isDesktopCashier } from '../../../../utils/authLogin';
import { useCashierUiScale } from '../../../../features/cashier/hooks/useCashierUiScale';
import CashierZoomControls from '../../../../features/cashier/components/CashierZoomControls';
import { useOfflineStatus } from '../../../../features/cashier/hooks/useOfflineStatus';

/**
 * Right side of bottom dock: zoom + cloud online/offline pill.
 * On desktop (Electron) toggle works whenever cashier has offline access — same as before.
 */
export default function CashierBottomNavAside({ t }) {
  const zoom = useCashierUiScale();
  const status = useOfflineStatus();
  const isOffline = status.showOffline || status.tone === 'offline' || status.forceOfflineMode;
  const label = isOffline
    ? t('offline.bottomCloudOffline')
    : t('offline.bottomCloudOnline');

  const desktop = isDesktopCashier();
  const canToggle = Boolean(status.offlineAllowed && desktop);

  return (
    <div className="cashier-bottom-nav__aside">
      <CashierZoomControls zoom={zoom} t={t} />
      <button
        type="button"
        className={[
          'cashier-bottom-nav__status',
          `cashier-bottom-nav__status--${isOffline ? 'offline' : 'online'}`,
          canToggle ? 'is-toggle' : '',
          status.forceOfflineMode ? 'is-forced' : '',
        ].filter(Boolean).join(' ')}
        title={
          canToggle
            ? (status.forceOfflineMode ? t('offline.switchToOnline') : t('offline.switchToOffline'))
            : (status.message || label)
        }
        disabled={!canToggle || status.syncingCatalog}
        aria-pressed={Boolean(status.forceOfflineMode)}
        onClick={() => {
          if (!canToggle || status.syncingCatalog) return;
          status.handlers.toggleForceOffline(!status.forceOfflineMode);
        }}
      >
        <span className="cashier-bottom-nav__status-dot" aria-hidden />
        <span className="cashier-bottom-nav__status-label">{label}</span>
        {canToggle ? (
          <span className="cashier-bottom-nav__status-switch" aria-hidden>
            <span className="cashier-bottom-nav__status-knob" />
          </span>
        ) : null}
      </button>
    </div>
  );
}
