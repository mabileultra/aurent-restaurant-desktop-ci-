import { Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package } from 'lucide-react';
import { CashierThemeToggle, CashierDesktopMenu, CashierNotificationsBell } from '../../features/cashier';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import CashierTopbarTerminalMeta from '../../components/layout/cashier/CashierTopbarTerminalMeta';
import CashierPosTopbarCashier from '../../components/layout/cashier/CashierPosTopbarCashier';
import PharmacyTopbarShortcuts from '../../features/pharmacy-cashier/components/PharmacyTopbarShortcuts';
import { PHARM_DASHBOARD_PATH, PHARM_STOCK_PATHS } from '../app/pharmacyPaths';
import './pharmacy-pos-shell.css';

/**
 * Pharmacy-only POS header: brand + shift + hotkeys + stock/dashboard jumps.
 * No grocery secondary nav / restaurant branches.
 */
export default function PharmacyPosTopbar({
  t,
  storeName,
  shiftOpenBadge,
  shift,
  shiftIsOpen = false,
  cashierName,
  cashierRoleLabel,
  openShift,
  storeId,
  onLogout,
  cashierTheme,
  toggleCashierTheme,
}) {
  return (
    <header className="cashier-topbar cashier-topbar--pos cashier-topbar--compact pharmacy-pos-topbar">
      <div className="cashier-topbar__row cashier-topbar__row--main">
        <div className="cashier-topbar__brand-block">
          <CashierDesktopMenu />
          <span className="cashier-topbar__brand-divider d-none d-md-inline" aria-hidden />
          <div className="pharmacy-pos-topbar__brand d-none d-md-flex">
            <span className="pharmacy-pos-topbar__product">{t('pharmacyCashier.title')}</span>
            <CashierTopbarTerminalMeta
              t={t}
              storeName={storeName}
              shiftOpenBadge={shiftOpenBadge}
              shift={shift}
              pharmacyBadge
            />
            <PharmacyTopbarShortcuts />
          </div>
          <p className="cashier-topbar__pos-title mb-0 fw-semibold d-md-none">
            {t('pharmacyCashier.title')}
          </p>
        </div>
        <div className="cashier-topbar__actions pharmacy-pos-topbar__actions">
          <Link
            to={PHARM_STOCK_PATHS.products}
            className="pharmacy-pos-topbar__nav"
            title={t('nav.stockPharmacyProducts', { defaultValue: 'Товары' })}
          >
            <Package size={16} aria-hidden />
            <span className="d-none d-lg-inline">{t('nav.stockPharmacyProducts', { defaultValue: 'Товары' })}</span>
          </Link>
          <Link
            to={PHARM_DASHBOARD_PATH}
            className="pharmacy-pos-topbar__nav"
            title={t('nav.dashboard', { defaultValue: 'Дашборд' })}
          >
            <LayoutDashboard size={16} aria-hidden />
            <span className="d-none d-lg-inline">{t('nav.dashboard', { defaultValue: 'Дашборд' })}</span>
          </Link>
          <CashierNotificationsBell />
          {storeId && !shiftIsOpen && shift?.status !== 'OPEN' ? (
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
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
          >
            <LogOut size={16} strokeWidth={2.25} aria-hidden />
            <span className="cashier-pos-topbar__logout-text">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
