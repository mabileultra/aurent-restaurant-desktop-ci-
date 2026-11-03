import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Store,
  Users,
  LogOut,
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

export default function SuperAdminSidebar({
  mobileNavOpen,
  onCloseMobileNav,
  groupedLinks,
  openGroups,
  toggleGroup,
  location,
  user,
  onLogout,
}) {
  const { t } = useTranslation();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e) => e.key === 'Escape' && onCloseMobileNav();
    window.addEventListener('keydown', onKey);
    sidebarRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, onCloseMobileNav]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-slate-900/50 lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={onCloseMobileNav}
        />
      ) : null}

      {/* Sidebar Accordion Navigation */}
      <aside
        ref={sidebarRef}
        tabIndex={mobileNavOpen ? -1 : undefined}
        role={mobileNavOpen ? 'dialog' : undefined}
        aria-modal={mobileNavOpen ? true : undefined}
        aria-label={mobileNavOpen ? t('nav.menu', { defaultValue: 'Menyu' }) : undefined}
        className={`admin-sidebar dark:!bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto fixed top-16 bottom-0 left-0 z-40 w-72 max-w-[85vw] shadow-xl transition-transform duration-200 lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none focus:outline-hidden ${
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
                  className="accordion-toggle w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 py-2 px-2 rounded-lg transition cursor-pointer"
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
                            onClick={onCloseMobileNav}
                            className={({ isActive }) =>
                              `flex items-center space-x-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border-l-[3px] border-emerald-600 dark:border-emerald-400 pl-[9px] pr-3 shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white border-l-[3px] border-transparent pl-[9px] pr-3'
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
                                  onClick={onCloseMobileNav}
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
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-sm transition cursor-pointer"
          >
            <span className="w-5 h-5 flex items-center justify-center shrink-0" aria-hidden="true">
              <LogOut size={18} />
            </span>
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
