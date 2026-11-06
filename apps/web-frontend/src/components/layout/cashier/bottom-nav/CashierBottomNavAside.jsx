import { useCashierUiScale } from '../../../../features/cashier/hooks/useCashierUiScale';
import CashierZoomControls from '../../../../features/cashier/components/CashierZoomControls';

/** Right side of bottom dock: zoom. Offline status lives in Aurent desktop menu. */
export default function CashierBottomNavAside({ t }) {
  const zoom = useCashierUiScale();

  return (
    <div className="cashier-bottom-nav__aside">
      <CashierZoomControls zoom={zoom} t={t} />
    </div>
  );
}
