import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { getMainAppUrl } from '../../config/env';
import { PHARM_DASHBOARD_PATH } from './pharmacyPaths';
import { PHARMACY_ADMIN_NAV } from './pharmacyAdminNav';
import './pharmacy-admin-shell.css';

const linkClass = ({ isActive }) =>
  `pharmacy-admin-shell__link${isActive ? ' is-active' : ''}`;

/** Back-office chrome for stock / dashboard / returns on pharmacy SPA. */
export default function PharmacyAdminShell() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="pharmacy-admin-shell">
      <header className="pharmacy-admin-shell__header">
        <div className="pharmacy-admin-shell__bar">
          <Link to={PHARM_DASHBOARD_PATH} className="pharmacy-admin-shell__brand">
            Aurent Pharmacy
          </Link>
          <nav className="pharmacy-admin-shell__nav" aria-label="Pharmacy admin">
            {PHARMACY_ADMIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {t(item.labelKey, { defaultValue: item.fallback })}
              </NavLink>
            ))}
          </nav>
          <div className="pharmacy-admin-shell__meta">
            <span>{user?.fullName || user?.username || ''}</span>
            <a href={getMainAppUrl()}>
              {t('nav.platform', { defaultValue: 'Platform' })}
            </a>
            <button
              type="button"
              className="pharmacy-admin-shell__logout"
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
      <main className="pharmacy-admin-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
