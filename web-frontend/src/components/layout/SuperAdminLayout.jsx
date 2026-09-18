import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Store, Users, LogOut, Menu, KeyRound, Activity, Mail, ShieldCheck, Layers, Bell, BookOpen, Inbox, Wallet, CircleUser } from 'lucide-react';
import BrandMark from '../shared/BrandMark';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import OnScreenKeyboardButton from '../shared/OnScreenKeyboardButton';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { visiblePlatformNav } from '../../features/platform/nav/platformNav';

const NAV_ICONS = {
  '/platform/companies': Building2,
  '/platform/stores': Store,
  '/platform/users': Users,
  '/platform/access': KeyRound,
  '/platform/business-types': Layers,
  '/platform/reference-books': BookOpen,
  '/platform/leads': Inbox,
  '/platform/billing': Wallet,
  '/platform/monitoring': Activity,
  '/platform/email': Mail,
  '/platform/desktop-notifications': Bell,
  '/platform/security': ShieldCheck,
  '/platform/account': CircleUser,
};

export default function SuperAdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const links = useMemo(
    () => visiblePlatformNav(user?.role, hasModule),
    [user?.role, hasModule]
  );

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutAndResetSession();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`;

  return (
    <div className="platform-shell admin-shell flex min-h-0 overflow-hidden">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[min(100vw,16rem)] flex-col shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="admin-sidebar__brand flex items-center gap-2 px-4 py-5">
          <BrandMark variant="full" height={28} className="shrink-0" />
          <div className="min-w-0">
            <p className="admin-sidebar__brand-name truncate text-sm">{t('platform.title')}</p>
            <p className="admin-page-subtitle truncate text-xs">{t('platform.subtitle')}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(({ to, key }) => {
            const Icon = NAV_ICONS[to];
            return (
              <NavLink key={to} to={to} className={linkClass}>
                {Icon ? <Icon size={18} className="shrink-0" /> : null}
                {t(key)}
              </NavLink>
            );
          })}
        </nav>
        <div className="admin-sidebar__footer p-3">
          <p className="admin-page-subtitle mb-2 truncate px-2 text-xs">{user?.fullName}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar flex shrink-0 items-center justify-between gap-2 px-3 sm:px-4 sm:py-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-deep)] lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t('nav.expandMenu')}
          >
            <Menu size={20} />
          </button>
          <p className="admin-page-title truncate text-sm lg:hidden">{t('platform.title')}</p>
          <div className="ml-auto flex items-center gap-2">
            <BrandMark variant="full" height={26} className="lg:hidden" />
            <OnScreenKeyboardButton variant="header" />
            <LanguageSwitcher />
            <div className="admin-topbar__avatar hidden sm:flex" aria-hidden>
              {user?.fullName?.[0] ?? 'S'}
            </div>
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-deep)] lg:inline-flex"
              onClick={handleLogout}
              aria-label={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="admin-main flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
