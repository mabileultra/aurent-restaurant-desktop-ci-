import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { getMainAppUrl } from '../../config/env';
import {
  PHARM_DASHBOARD_PATH,
  PHARM_POS_PATH,
  PHARM_RETURNS_PATH,
  PHARM_SALES_PATH,
  PHARM_STOCK_PATHS,
} from './pharmacyPaths';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-700'
  }`;

/** Minimal back-office chrome for stock / dashboard / returns on pharmacy SPA. */
export default function PharmacyAdminShell() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 text-slate-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to={PHARM_DASHBOARD_PATH} className="mr-2 font-semibold text-emerald-400">
            Aurent Pharmacy
          </Link>
          <NavLink to={PHARM_DASHBOARD_PATH} className={linkClass}>
            {t('nav.dashboard', { defaultValue: 'Дашборд' })}
          </NavLink>
          <NavLink to={PHARM_POS_PATH} className={linkClass}>
            {t('nav.cashier', { defaultValue: 'Касса' })}
          </NavLink>
          <NavLink to={PHARM_STOCK_PATHS.products} className={linkClass}>
            {t('nav.stockPharmacyProducts', { defaultValue: 'Товары' })}
          </NavLink>
          <NavLink to={PHARM_STOCK_PATHS.receipts} className={linkClass}>
            {t('nav.stockPharmacyReceipts', { defaultValue: 'Приход' })}
          </NavLink>
          <NavLink to={PHARM_STOCK_PATHS.aslMarks} className={linkClass}>
            {t('nav.stockPharmacyAslMarks', { defaultValue: 'ASL' })}
          </NavLink>
          <NavLink to={PHARM_SALES_PATH} className={linkClass}>
            {t('nav.sales', { defaultValue: 'Продажи' })}
          </NavLink>
          <NavLink to={PHARM_RETURNS_PATH} className={linkClass}>
            {t('nav.returns', { defaultValue: 'Возвраты' })}
          </NavLink>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-300">
            <span>{user?.fullName || user?.username || ''}</span>
            <a href={getMainAppUrl()} className="hover:text-white">
              Platform
            </a>
            <button
              type="button"
              className="rounded-md px-2 py-1 hover:bg-slate-700"
              onClick={() => {
                logout();
                window.location.assign('/login');
              }}
            >
              {t('common.logout', { defaultValue: 'Выход' })}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
