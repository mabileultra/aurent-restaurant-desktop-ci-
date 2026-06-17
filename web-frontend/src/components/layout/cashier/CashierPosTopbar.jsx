import { CashierThemeToggle, CashierDesktopMenu, CashierNotificationsBell } from '../../../features/cashier';
import LanguageSwitcher from '../../shared/LanguageSwitcher';
import CashierTopbarTerminalMeta from './CashierTopbarTerminalMeta';
import CashierPosTopbarCashier from './CashierPosTopbarCashier';

export default function CashierPosTopbar({
  t,
  displayAppName,
  isDesktopApp,
  storeName,
  shiftOpenBadge,
  shift,
  cashierName,
  openShift,
  storeId,
  onLogout,
  cashierTheme,
  toggleCashierTheme,
}) {
  const shiftOpen = shift?.status === 'OPEN';

  return (
    <header className="cashier-topbar cashier-topbar--pos border-bottom">
      <div className="cashier-topbar__row cashier-topbar__row--main">
        <div className="cashier-topbar__brand-block">
          <CashierDesktopMenu appName={displayAppName()} />
          {!isDesktopApp ? (
            <p className="cashier-topbar__terminal-name mb-0 d-none d-md-block">{displayAppName()}</p>
          ) : null}
          <CashierTopbarTerminalMeta
            t={t}
            storeName={storeName}
            shiftOpenBadge={shiftOpenBadge}
            shift={shift}
          />
          <CashierPosTopbarCashier name={cashierName} />
          <p className="cashier-topbar__pos-title mb-0 fw-semibold d-md-none">{t('pos.navSale')}</p>
        </div>
        <div className="cashier-topbar__actions">
          {isDesktopApp ? <CashierNotificationsBell /> : null}
          {!shiftOpen && storeId ? (
            <button type="button" className="cashier-pos-topbar__open-shift" onClick={openShift}>
              {t('pos.openShift')}
            </button>
          ) : null}
          <CashierThemeToggle
            theme={cashierTheme}
            onToggle={toggleCashierTheme}
            compact
            className="cashier-topbar__theme"
          />
          <LanguageSwitcher variant="cashier" className="cashier-topbar__lang" />
          <button
            type="button"
            className="cashier-pos-topbar__logout d-none d-md-inline-flex"
            onClick={onLogout}
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
