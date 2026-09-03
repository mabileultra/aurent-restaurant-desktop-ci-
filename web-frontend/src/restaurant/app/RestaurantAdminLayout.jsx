import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { BaseButton } from '../../components/ui';
import { RST_ADMIN_NAV } from './restaurantAdminNav';
import '../shared/styles/restaurant-tokens.css';
import '../admin/styles/admin-shell.css';

export default function RestaurantAdminLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="rst-app rst-shell">
      <aside className="rst-shell__nav">
        <div className="rst-shell__brand">
          <span className="rst-shell__brand-kicker">{t('rst.brandKicker')}</span>
          <span className="rst-shell__brand-name">{t('rst.brand')}</span>
        </div>
        <nav className="rst-shell__links">
          {RST_ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rst-shell__link${isActive ? ' is-active' : ''}${item.enabled ? '' : ' is-disabled'}`}
            >
              <span>{t(`rst.nav.${item.key}`)}</span>
              {!item.enabled ? <span className="rst-shell__stage">{t('rst.nav.later')}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="rst-shell__footer">
          <Link to="/rst/pos">{t('rst.pos.toFloor')}</Link>
          <Link to="/rst/kitchen">{t('rst.pos.toKitchen')}</Link>
          <Link to="/dashboard">{t('rst.admin.toPlatform')}</Link>
        </div>
      </aside>
      <div className="rst-shell__main">
        <header className="rst-shell__top">
          <strong>{user?.fullName || user?.username || ''}</strong>
          <div className="rst-shell__actions">
            <BaseButton type="button" variant="ghost" onClick={() => logoutAndResetSession()}>
              {t('nav.logout')}
            </BaseButton>
          </div>
        </header>
        <div className="rst-shell__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
