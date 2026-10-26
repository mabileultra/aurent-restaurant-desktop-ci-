import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Store,
  Users,
  LogOut,
  Menu,
  KeyRound,
  Activity,
  Mail,
  ShieldCheck,
  Layers,
  Bell,
  BookOpen,
  Inbox,
  Wallet,
  CircleUser,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import BrandMark from '../shared/BrandMark';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import OnScreenKeyboardButton from '../shared/OnScreenKeyboardButton';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { visiblePlatformNavGrouped } from '../../features/platform/nav/platformNav';

const NAV_ICONS = {
  '/platform/companies': Building2,
  '/platform/stores': Store,
  '/platform/users': Users,
  '/platform/access': KeyRound,
  '/platform/business-types': Layers,
  '/platform/reference-books': BookOpen,
  '/platform/leads': Inbox,
  '/platform/billing': Wallet,
  '/platform/analytics': BarChart3,
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

  const groupedLinks = useMemo(
    () => visiblePlatformNavGrouped(user?.role, hasModule),
    [user?.role, hasModule]
  );

  const [openGroups, setOpenGroups] = useState({
    main: true,
    finance: true,
    management: true,
  });

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  // Find active group and ensure it's open
  const activeGroupId = useMemo(() => {
    for (const group of groupedLinks) {
      if (group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))) {
        return group.id;
      }
    }
    return null;
  }, [groupedLinks, location.pathname]);

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId, location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutAndResetSession();
    navigate('/login');
  };

  return (
    <div className="platform-shell admin-shell flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header
        className="admin-topbar border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20"
        data-purpose="top-header"
      >
        {/* Top Left: Hamburger for mobile + Logo & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden transition"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label={t('nav.expandMenu')}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-3">
            <BrandMark variant="full" height={28} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 leading-tight text-sm sm:text-base">
                {t('platform.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {t('platform.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Top Right: ABC keyboard, RU/UZ switcher, avatar, logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <OnScreenKeyboardButton variant="header" />
          <LanguageSwitcher />
          <div
            className="w-9 h-9 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center shadow-sm text-sm shrink-0 select-none"
            aria-hidden
            title={user?.fullName || t('platform.title')}
          >
            {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center transition shrink-0"
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Outlet */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 top-16 z-30 bg-slate-900/50 lg:hidden"
            aria-label={t('nav.closeMenu')}
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        {/* Sidebar Accordion Navigation */}
        <aside
          className={`admin-sidebar bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto fixed top-16 bottom-0 left-0 z-40 w-72 max-w-[85vw] shadow-xl transition-transform duration-200 lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          data-purpose="sidebar"
        >
          {/* Navigation Accordion Groups */}
          <nav className="p-4 space-y-4 overflow-y-auto flex-1" data-purpose="accordion-navigation">
            {groupedLinks.map((group) => {
              const isOpen = openGroups[group.id] ?? true;
              return (
                <div
                  key={group.id}
                  className="accordion-group border-b border-slate-100 dark:border-slate-800/80 pb-3 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="accordion-toggle w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 py-2 px-2 rounded-lg transition"
                    aria-expanded={isOpen}
                    aria-controls={`accordion-group-${group.id}`}
                  >
                    <span>{t(group.key)}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 text-slate-400 dark:text-slate-500 ${
                        isOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>

                  {isOpen ? (
                    <div
                      id={`accordion-group-${group.id}`}
                      role="region"
                      className="accordion-content mt-1 space-y-1 pl-2"
                    >
                      {group.items.map((item) => {
                        const Icon = NAV_ICONS[item.to];
                        const sectionOpen = Boolean(item.children)
                          && (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
                        return (
                          <div key={item.to}>
                            <NavLink
                              to={item.to}
                              onClick={() => setMobileNavOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center space-x-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border-l-[3px] border-emerald-600 dark:border-emerald-400 pl-[9px] pr-3 shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 border-l-[3px] border-transparent pl-[9px] pr-3'
                                }`
                              }
                            >
                              {Icon ? (
                                <span className="w-5 h-5 flex items-center justify-center shrink-0 text-current" aria-hidden="true">
                                  <Icon size={18} />
                                </span>
                              ) : null}
                              <span className="truncate">{t(item.key)}</span>
                            </NavLink>
                            {item.children && sectionOpen ? (
                              <div className="mt-1 space-y-1 pl-8" role="group" aria-label={t(item.key)}>
                                {item.children.map((child) => (
                                  <NavLink
                                    key={child.to}
                                    to={child.to}
                                    end={Boolean(child.end)}
                                    onClick={() => setMobileNavOpen(false)}
                                    className={({ isActive }) =>
                                      `block py-1.5 px-3 rounded-md text-xs font-medium transition ${
                                        isActive
                                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold'
                                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                      }`
                                    }
                                  >
                                    {t(child.key)}
                                  </NavLink>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer / Logout */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="mb-2 px-3 text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
              {user?.fullName || 'Administrator Super'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-sm transition"
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0" aria-hidden="true">
                <LogOut size={18} />
              </span>
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden"
          data-purpose="main-content"
        >
          <div className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

