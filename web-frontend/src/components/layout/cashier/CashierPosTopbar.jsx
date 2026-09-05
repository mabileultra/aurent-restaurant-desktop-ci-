import { LogOut } from 'lucide-react';
import { CashierThemeToggle, CashierDesktopMenu, CashierNotificationsBell, OfflineStatusTopbar } from '../../../features/cashier';
import LanguageSwitcher from '../../shared/LanguageSwitcher';
import BrandMark from '../../shared/BrandMark';
import { BRAND_NAME } from '../../../config/brandLogos';
import { useLocation } from 'react-router-dom';
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
  cashierRoleLabel,
  openShift,
  storeId,
  onLogout,
  cashierTheme,
  toggleCashierTheme,
}) {
  const location = useLocation();
  const isRestaurantRegister = location.pathname.startsWith('/rst/pos');
  const shiftOpen = shift?.status === 'OPEN';

  return (
    <header className="cashier-topbar cashier-topbar--pos">
      <div className="cashier-topbar__row cashier-topbar__row--main">
        <div className="cashier-topbar__brand-block">
          <CashierDesktopMenu appName={displayAppName()} />
          <div className="cashier-topbar__brand">
            <BrandMark variant="icon" size={22} className="cashier-topbar__brand-icon" />
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
            {isDesktopApp ? <OfflineStatusTopbar /> : null}
          </div>
          <p className="cashier-topbar__pos-title mb-0 fw-semibold d-md-none">
            {t(isRestaurantRegister ? 'restaurantCashier.title' : 'pos.navSale')}
          </p>
        </div>
        <div className="cashier-topbar__actions">
          {isDesktopApp ? <CashierNotificationsBell /> : null}
          {!shiftOpen && storeId ? (
            <button type="button" className="cashier-pos-topbar__open-shift" onClick={openShift}>
              {t('pos.openShift')}
            </button>
          ) : null}
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
