import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  Headphones,
  Lock,
} from 'lucide-react';
import { useCashierStore } from '../../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../../contexts/CashierShiftModalContext';
import { useCashierLock } from '../../../../contexts/CashierLockContext';
import { useCashierBottomNavCollapsedState } from '../../../../hooks/useCashierBottomNavCollapsedState';
import OnScreenKeyboardButton from '../../../shared/OnScreenKeyboardButton';
import { bottomNavLinkClass } from './bottomNavClass';
import CashierBottomNavProducts from './CashierBottomNavProducts';
import CashierBottomNavRegister from './CashierBottomNavRegister';
import CashierBottomNavTables from './CashierBottomNavTables';
import CashierBottomNavAside from './CashierBottomNavAside';
import { useCashierStoreProfile } from '../../../../hooks/useCashierStoreProfile';

function navClass(isActive) {
  return bottomNavLinkClass(isActive);
}

export default function CashierBottomNav({ className = '' }) {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const { isRestaurant, isPharmacy } = useCashierStoreProfile();
  const { openShift } = useCashierShiftModal();
  const { lock } = useCashierLock();
  const { collapsed, toggleCollapsed } = useCashierBottomNavCollapsedState();

  return (
    <div
      className={[
        'cashier-bottom-nav-shell',
        collapsed ? 'is-collapsed' : '',
        isPharmacy ? 'cashier-bottom-nav-shell--pharmacy' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <nav className="cashier-bottom-nav" aria-label={t('nav.handbook')}>
        <button
          type="button"
          className="cashier-bottom-nav__btn cashier-bottom-nav__btn--lock"
          onClick={lock}
          title={t('pos.lockScreen')}
          aria-label={t('pos.lockScreen')}
        >
          <Lock size={20} strokeWidth={2} aria-hidden />
          {!collapsed ? <span>{t('pos.lockScreen')}</span> : null}
        </button>

        <OnScreenKeyboardButton variant="bottom-nav" />

        {!collapsed ? (
          <>
            <NavLink
              to="/cashier/support"
              className={({ isActive }) => `${navClass(isActive)} cashier-bottom-nav__btn--support`}
              title={t('nav.support')}
            >
              <Headphones size={20} strokeWidth={2} aria-hidden />
              <span>{t('nav.support')}</span>
            </NavLink>
            <NavLink
              to="/cashier/handbook/cashierPos"
              className={({ isActive }) => `${navClass(isActive)} cashier-bottom-nav__btn--handbook`}
              title={t('nav.handbook')}
            >
              <BookOpen size={20} strokeWidth={2} aria-hidden />
              <span>{t('nav.handbook')}</span>
            </NavLink>
            <button
              type="button"
              className={`${bottomNavLinkClass(false)} cashier-bottom-nav__btn--shift`}
              onClick={openShift}
              disabled={!storeId}
              title={t('pos.navShift')}
            >
              <Clock size={20} strokeWidth={2} aria-hidden />
              <span>{t('pos.navShift')}</span>
            </button>
            <NavLink
              to="/cashier/sales"
              className={({ isActive }) => `${navClass(isActive)} cashier-bottom-nav__btn--sales`}
              title={t('pos.navMySales')}
            >
              <CircleDollarSign size={20} strokeWidth={2} aria-hidden />
              <span>{t('pos.navMySales')}</span>
            </NavLink>
            {!isPharmacy ? <CashierBottomNavProducts t={t} /> : null}
            {isRestaurant ? <CashierBottomNavTables t={t} /> : <CashierBottomNavRegister t={t} />}
          </>
        ) : null}

        <button
          type="button"
          className="cashier-bottom-nav__btn cashier-bottom-nav__btn--icon cashier-bottom-nav__btn--toggle"
          onClick={toggleCollapsed}
          title={collapsed ? t('pos.bottomNavExpand') : t('pos.bottomNavCollapse')}
          aria-label={collapsed ? t('pos.bottomNavExpand') : t('pos.bottomNavCollapse')}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronUp size={20} strokeWidth={2} /> : <ChevronDown size={20} strokeWidth={2} />}
        </button>
      </nav>

      {!collapsed ? <CashierBottomNavAside t={t} /> : null}
    </div>
  );
}
