import { LogOut } from 'lucide-react';
import { CashierThemeToggle, CashierDesktopMenu, CashierNotificationsBell } from '../../../features/cashier';
import LanguageSwitcher from '../../shared/LanguageSwitcher';
import CashierTopbarTerminalMeta from './CashierTopbarTerminalMeta';
import CashierPosTopbarCashier from './CashierPosTopbarCashier';

export default function CashierSecondaryTopbar({
  t,
  displayAppName,
  isDesktopApp: _isDesktopApp,
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
    <header className="cashier-topbar cashier-topbar--pos cashier-topbar--compact">
      <div className="cashier-topbar__row cashier-topbar__row--main">
        <div className="cashier-topbar__brand-block">
          <CashierDesktopMenu appName={displayAppName()} />
          <span className="cashier-topbar__pro-badge" title={t('pos.proBadge')}>
            {t('pos.proBadge')}
          </span>
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
