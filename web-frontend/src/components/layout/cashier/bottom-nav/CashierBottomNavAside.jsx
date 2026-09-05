import { isDesktopOfflineBridge } from '../../../../services/offline/desktopOfflineBridge';
import { useCashierUiScale } from '../../../../features/cashier/hooks/useCashierUiScale';
import CashierZoomControls from '../../../../features/cashier/components/CashierZoomControls';
import { useOfflineStatus } from '../../../../features/cashier/hooks/useOfflineStatus';

/**
 * Right side of bottom dock: zoom + cloud online/offline pill.
 * Cloud status is always visible; toggle works on desktop when offline is allowed.
 */
export default function CashierBottomNavAside({ t }) {
  const zoom = useCashierUiScale();
  const status = useOfflineStatus();
  const isOffline = status.showOffline || status.tone === 'offline';
  const label = isOffline
    ? t('offline.bottomCloudOffline')
    : t('offline.bottomCloudOnline');

  const toggleEnabled = status.offlineAllowed && isDesktopOfflineBridge();

  return (
    <div className="cashier-bottom-nav__aside">
      <CashierZoomControls zoom={zoom} t={t} />
      <button
        type="button"
        className={[
          'cashier-bottom-nav__status',
          `cashier-bottom-nav__status--${isOffline ? 'offline' : 'online'}`,
          toggleEnabled ? 'is-toggle' : '',
          status.forceOfflineMode ? 'is-forced' : '',
        ].filter(Boolean).join(' ')}
        title={
          toggleEnabled
            ? (status.forceOfflineMode ? t('offline.forceOfflineOff') : t('offline.forceOfflineOn'))
            : (status.message || label)
        }
        disabled={!toggleEnabled}
        aria-pressed={Boolean(status.forceOfflineMode)}
        onClick={() => {
          if (!toggleEnabled) return;
          status.handlers.toggleForceOffline(!status.forceOfflineMode);
        }}
      >
        <span className="cashier-bottom-nav__status-dot" aria-hidden />
        <span className="cashier-bottom-nav__status-label">{label}</span>
        {toggleEnabled ? (
          <span className="cashier-bottom-nav__status-switch" aria-hidden>
            <span className="cashier-bottom-nav__status-knob" />
          </span>
        ) : null}
      </button>
    </div>
  );
}
