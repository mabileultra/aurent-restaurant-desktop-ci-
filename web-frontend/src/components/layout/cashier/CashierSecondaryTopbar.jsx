import { LogOut } from 'lucide-react';
import { CashierThemeToggle, CashierDesktopMenu, CashierNotificationsBell } from '../../../features/cashier';
import LanguageSwitcher from '../../shared/LanguageSwitcher';
import BrandMark from '../../shared/BrandMark';
import { BRAND_NAME } from '../../../config/brandLogos';
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
  cashierRoleLabel,
  onLogout,
  cashierTheme,
  toggleCashierTheme,
}) {
  return (
    <header className="cashier-topbar cashier-topbar--pos">
      <div className="cashier-topbar__row cashier-topbar__row--main">
        <div className="cashier-topbar__brand-block">
          <CashierDesktopMenu appName={displayAppName()} />
          <div className="cashier-topbar__brand">
            <BrandMark variant="icon" size={34} className="cashier-topbar__brand-icon" />
            <span className="cashier-topbar__brand-name">{BRAND_NAME}.</span>
            <span className="cashier-topbar__pro-badge">{t('pos.proBadge')}</span>
          </div>
          <span className="cashier-topbar__brand-divider d-none d-md-inline" aria-hidden />
          <div className="cashier-topbar__terminal-strip d-none d-md-flex">
            <CashierTopbarTerminalMeta
              t={t}
              storeName={storeName}
              shiftOpenBadge={shiftOpenBadge}
              shift={shift}
            />
          </div>
        </div>
        <div className="cashier-topbar__actions">
          <CashierNotificationsBell />
          <CashierPosTopbarCashier name={cashierName} roleLabel={cashierRoleLabel} />
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
            <LogOut size={16} strokeWidth={2.25} aria-hidden />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
