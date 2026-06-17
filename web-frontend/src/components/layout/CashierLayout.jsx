import { Outlet } from 'react-router-dom';
import {
  CashierLockOverlay,
  CashierShiftModal,
} from '../../features/cashier';
import { CashierShiftModalProvider } from '../../contexts/CashierShiftModalContext';
import { CashierLockProvider } from '../../contexts/CashierLockContext';
import { PosShellProvider } from '../../contexts/PosShellContext';
import CashierBottomNav from './cashier/bottom-nav/CashierBottomNav';
import CashierPosTopbar from './cashier/CashierPosTopbar';
import CashierSecondaryTopbar from './cashier/CashierSecondaryTopbar';
import { useCashierLayoutShell } from './cashier/useCashierLayoutShell';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/cashier/index.css';

function CashierLayoutShell() {
  const p = useCashierLayoutShell();

  return (
    <div className={p.shellClassName}>
      <div className="cashier-app__body d-flex flex-column flex-grow-1 min-vw-0 min-h-0 w-100">
        {p.isPosRoute ? (
          <>
            <CashierPosTopbar
              t={p.t}
              displayAppName={p.displayAppName}
              isDesktopApp={p.isDesktopApp}
              storeName={p.storeName}
              shiftOpenBadge={p.shiftOpenBadge}
              shift={p.shift}
              cashierName={p.displayCashierName()}
              openShift={p.openShift}
              storeId={p.storeId}
              onLogout={p.handleLogout}
              cashierTheme={p.cashierTheme}
              toggleCashierTheme={p.toggleCashierTheme}
            />
            <main className="cashier-app__main flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
              <Outlet />
            </main>
          </>
        ) : (
          <>
            <CashierSecondaryTopbar
              t={p.t}
              displayAppName={p.displayAppName}
              isDesktopApp={p.isDesktopApp}
              storeName={p.storeName}
              shiftOpenBadge={p.shiftOpenBadge}
              shift={p.shift}
              cashierName={p.displayCashierName()}
              onLogout={p.handleLogout}
              cashierTheme={p.cashierTheme}
              toggleCashierTheme={p.toggleCashierTheme}
            />
            <main className="cashier-app__main flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
              <Outlet />
            </main>
            <CashierBottomNav className="cashier-app__bottom-nav" />
          </>
        )}
      </div>

      <CashierShiftModal
        open={p.open}
        onClose={p.closeShift}
        storeId={p.storeId}
        storeName={p.storeName}
        cashierName={p.displayCashierName()}
        shift={p.shift}
      />
      <CashierLockOverlay />
    </div>
  );
}

export default function CashierLayout() {
  return (
    <CashierLockProvider>
      <CashierShiftModalProvider>
        <PosShellProvider>
          <CashierLayoutShell />
        </PosShellProvider>
      </CashierShiftModalProvider>
    </CashierLockProvider>
  );
}
