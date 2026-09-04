import { useCashierUiScale } from '../../../../features/cashier/hooks/useCashierUiScale';
import CashierZoomControls from '../../../../features/cashier/components/CashierZoomControls';
import { useOfflineStatus } from '../../../../features/cashier/hooks/useOfflineStatus';

/**
 * Right side of bottom dock: zoom + cloud online/offline pill.
 * Cloud status is always visible in the dock (web + desktop).
 */
export default function CashierBottomNavAside({ t }) {
  const zoom = useCashierUiScale();
  const status = useOfflineStatus();
  const isOffline = status.showOffline || status.tone === 'offline';
  const label = isOffline
    ? t('offline.bottomCloudOffline')
    : t('offline.bottomCloudOnline');

  const canToggle =
    status.offlineAllowed
    && (status.actions.showSwitchOffline || status.actions.showSwitchOnline);

  return (
    <div className="cashier-bottom-nav__aside">
      <CashierZoomControls zoom={zoom} t={t} />
      <button
        type="button"
        className={`cashier-bottom-nav__status cashier-bottom-nav__status--${isOffline ? 'offline' : 'online'}`}
        title={status.message || label}
        disabled={!canToggle}
        onClick={() => {
          if (!canToggle) return;
          status.handlers.toggleForceOffline(!status.forceOfflineMode);
        }}
      >
        <span className="cashier-bottom-nav__status-dot" aria-hidden />
        <span className="cashier-bottom-nav__status-label">{label}</span>
      </button>
    </div>
  );
}
