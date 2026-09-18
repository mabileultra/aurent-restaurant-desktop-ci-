import { useCashierUiScale } from '../../../../features/cashier/hooks/useCashierUiScale';
import CashierZoomControls from '../../../../features/cashier/components/CashierZoomControls';
import OfflineStatusDock from '../../../../features/cashier/components/OfflineStatusDock';
import { useOfflineDockBadge } from '../../../../features/cashier/hooks/useOfflineDockBadge';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';

/**
 * Right side of bottom dock: zoom + compact онлайн/офлайн.
 * Offline toggle and catalog refresh live in Aurent desktop menu.
 */
export default function CashierBottomNavAside({ t }) {
  const zoom = useCashierUiScale();
  const status = useOfflineDockBadge();
  const { isPharmacy } = useCashierStoreProfile();
  const kkmOk = !status.showOffline && !status.networkOffline;

  return (
    <div className="cashier-bottom-nav__aside">
      <CashierZoomControls zoom={zoom} t={t} />
      {isPharmacy ? (
        <span
          className={`cashier-bottom-nav__kkm${kkmOk ? ' is-ok' : ' is-warn'}`}
          title={kkmOk ? t('pharmacyCashier.bottom.kkmOk') : t('pharmacyCashier.bottom.kkmWarn')}
        >
          <span className="cashier-bottom-nav__kkm-dot" aria-hidden />
          {t('pharmacyCashier.bottom.kkm')}
        </span>
      ) : null}
      <OfflineStatusDock status={status} />
    </div>
  );
}
