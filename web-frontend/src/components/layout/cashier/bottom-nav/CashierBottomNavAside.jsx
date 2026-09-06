import { useCashierUiScale } from '../../../../features/cashier/hooks/useCashierUiScale';
import CashierZoomControls from '../../../../features/cashier/components/CashierZoomControls';
import OfflineStatusTopbar from '../../../../features/cashier/components/OfflineStatusTopbar';
import { useOfflineStatus } from '../../../../features/cashier/hooks/useOfflineStatus';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';

/**
 * Right side of bottom dock: zoom + compact онлайн/офлайн.
 * Offline toggle lives in Aurent desktop menu — no «Облако Онлайн» here.
 * Pharmacy also shows KKM chip.
 */
export default function CashierBottomNavAside({ t }) {
  const zoom = useCashierUiScale();
  const status = useOfflineStatus();
  const { isPharmacy } = useCashierStoreProfile();
  const isOffline = status.showOffline || status.tone === 'offline' || status.forceOfflineMode;
  const kkmOk = !isOffline && !status.networkOffline;

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
      <OfflineStatusTopbar forceVisible />
    </div>
  );
}
