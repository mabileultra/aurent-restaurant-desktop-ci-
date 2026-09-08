// src/components/layout/SuperAdminLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Store, Users, LogOut, Menu, KeyRound, Activity, Mail, ShieldCheck, Layers, Bell, BookOpen, Inbox, Wallet } from 'lucide-react';
import BrandMark from '../shared/BrandMark';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import OnScreenKeyboardButton from '../shared/OnScreenKeyboardButton';

const NAV = [
  { to: '/platform/companies', icon: Building2, key: 'platform.companies' },
  { to: '/platform/stores', icon: Store, key: 'platform.stores' },
  { to: '/platform/users', icon: Users, key: 'platform.users' },
  { to: '/platform/access', icon: KeyRound, key: 'platform.moduleAccess.nav' },
  { to: '/platform/business-types', icon: Layers, key: 'platform.businessTypes.nav' },
  { to: '/platform/reference-books', icon: BookOpen, key: 'platform.referenceBooks.nav' },
  { to: '/platform/leads', icon: Inbox, key: 'platform.leads.nav' },
  { to: '/platform/billing', icon: Wallet, key: 'platform.billing.nav' },
  { to: '/platform/monitoring', icon: Activity, key: 'platform.monitoring.nav' },
  { to: '/platform/email', icon: Mail, key: 'platform.email.nav' },
  { to: '/platform/desktop-notifications', icon: Bell, key: 'platform.desktopNotifications.nav' },
  { to: '/platform/security', icon: ShieldCheck, key: 'platform.security.nav' },
];

export default function SuperAdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
          {NAV.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} className="shrink-0" />
              {t(key)}
            </NavLink>
          ))}
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
