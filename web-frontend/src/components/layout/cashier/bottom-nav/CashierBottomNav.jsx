import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, Headphones, Lock, Receipt } from 'lucide-react';
import { useCashierStore } from '../../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../../contexts/CashierShiftModalContext';
import { useCashierLock } from '../../../../contexts/CashierLockContext';
import { bottomNavLinkClass } from './bottomNavClass';
import CashierBottomNavProducts from './CashierBottomNavProducts';
import CashierBottomNavRegister from './CashierBottomNavRegister';

function navClass(isActive) {
  return bottomNavLinkClass(isActive);
}

export default function CashierBottomNav({ className = '' }) {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const { openShift } = useCashierShiftModal();
  const { lock } = useCashierLock();

  return (
    <nav
      className={`cashier-bottom-nav${className ? ` ${className}` : ''}`}
      aria-label={t('nav.handbook')}
    >
      <button
        type="button"
        className="cashier-bottom-nav__btn cashier-bottom-nav__btn--icon"
        onClick={lock}
        title={t('pos.lockScreen')}
      >
        <Lock size={28} strokeWidth={2} aria-hidden />
      </button>
      <NavLink
        to="/cashier/support"
        className={({ isActive }) => navClass(isActive)}
        title={t('nav.support')}
      >
        <Headphones size={28} strokeWidth={2} aria-hidden />
        <span>{t('nav.support')}</span>
      </NavLink>
      <NavLink
        to="/cashier/handbook/cashierPos"
        className={({ isActive }) => navClass(isActive)}
        title={t('nav.handbook')}
      >
        <BookOpen size={28} strokeWidth={2} aria-hidden />
        <span>{t('nav.handbook')}</span>
      </NavLink>
      <button
        type="button"
        className={bottomNavLinkClass(false)}
        onClick={openShift}
        disabled={!storeId}
        title={t('pos.navShift')}
      >
        <Clock size={28} strokeWidth={2} aria-hidden />
        <span>{t('pos.navShift')}</span>
      </button>
      <NavLink
        to="/cashier/sales"
        className={({ isActive }) => navClass(isActive)}
        title={t('pos.navMySales')}
      >
        <Receipt size={28} strokeWidth={2} aria-hidden />
        <span>{t('pos.navMySales')}</span>
      </NavLink>
      <CashierBottomNavProducts t={t} />
      <CashierBottomNavRegister t={t} />
    </nav>
  );
}
