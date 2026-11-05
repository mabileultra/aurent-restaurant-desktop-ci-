import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import PharmacyShellOutlet from '../app/PharmacyShellOutlet';
import {
  CashierLockOverlay,
  CashierShiftModal,
} from '../../features/cashier';
import { CashierShiftModalProvider } from '../../contexts/CashierShiftModalContext';
import { CashierLockProvider } from '../../contexts/CashierLockContext';
import { PosShellProvider } from '../../contexts/PosShellContext';
import OfflineSyncProgressBanner from '../../features/cashier/components/OfflineSyncProgressBanner';
import { usePharmacyPosShell } from './usePharmacyPosShell';
import PharmacyPosTopbar from './PharmacyPosTopbar';
import { PharmacyPosActionsProvider } from './pharmacyPosActions';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/cashier/index.css';
import './pharmacy-pos-shell.css';

function PharmacyPosShellInner() {
  const p = usePharmacyPosShell();

  return (
    <div className={p.shellClassName} style={p.zoom.rootStyle}>
      <PharmacyPosActionsProvider>
      <div className="cashier-app__body d-flex flex-column flex-grow-1 min-vw-0 min-h-0 w-100">
        <PharmacyPosTopbar
          t={p.t}
          storeName={p.storeName}
          shiftOpenBadge={p.shiftOpenBadge}
          shift={p.shift}
          shiftIsOpen={p.shiftIsOpen}
          cashierName={p.displayCashierName()}
          cashierRoleLabel={p.cashierRoleLabel}
          openShift={p.openShift}
          storeId={p.storeId}
          onLogout={p.handleLogout}
          cashierTheme={p.cashierTheme}
          toggleCashierTheme={p.toggleCashierTheme}
        />
        <main className="cashier-app__main flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
          <PharmacyShellOutlet />
        </main>
      </div>
      </PharmacyPosActionsProvider>

      <OfflineSyncProgressBanner />

      <CashierShiftModal
        open={p.open}
        onClose={p.closeShift}
        storeId={p.storeId}
        storeName={p.storeName}
        cashierName={p.displayCashierName()}
        shift={p.shift}
        catalogKind={p.catalogKind}
      />
      <CashierLockOverlay />
    </div>
  );
}

/**
 * Pharmacy POS application chrome (Phase 4).
 * Replaces grocery CashierLayout for /pos — no bottom-nav grocery world.
 */
export default function PharmacyPosShell() {
  return (
    <BillingAccessGuard>
      <CashierLockProvider>
        <CashierShiftModalProvider>
          <PosShellProvider>
            <PharmacyPosShellInner />
          </PosShellProvider>
        </CashierShiftModalProvider>
      </CashierLockProvider>
    </BillingAccessGuard>
  );
}
