import { CashierThemeToggle, CashierDesktopMenu, CashierNotificationsBell, OfflineStatusTopbar } from '../../../features/cashier';
import LanguageSwitcher from '../../shared/LanguageSwitcher';
import CashierTopbarTerminalMeta from './CashierTopbarTerminalMeta';
import CashierPosTopbarCashier from './CashierPosTopbarCashier';

export default function CashierSecondaryTopbar({
  t,
  displayAppName,
  isDesktopApp,
  storeName,
  shiftOpenBadge,
  shift,
  cashierName,
  onLogout,
  cashierTheme,
  toggleCashierTheme,
}) {
  return (
    <header className="cashier-topbar cashier-topbar--pos border-bottom">
      <div className="cashier-topbar__row cashier-topbar__row--main">
        <div className="cashier-topbar__brand-block">
          <CashierDesktopMenu appName={displayAppName()} />
          {!isDesktopApp ? (
            <p className="cashier-topbar__terminal-name mb-0 d-none d-md-block">{displayAppName()}</p>
          ) : null}
          <div className="cashier-topbar__terminal-strip d-none d-md-flex">
            <CashierTopbarTerminalMeta
              t={t}
              storeName={storeName}
              shiftOpenBadge={shiftOpenBadge}
              shift={shift}
            />
            {isDesktopApp ? <OfflineStatusTopbar /> : null}
          </div>
          <CashierPosTopbarCashier name={cashierName} />
        </div>
        <div className="cashier-topbar__actions">
          {isDesktopApp ? <CashierNotificationsBell /> : null}
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
