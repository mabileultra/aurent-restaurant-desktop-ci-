import { Menu, X } from 'lucide-react';
import OnScreenKeyboardButton from '../shared/OnScreenKeyboardButton';
import BrandMark from '../shared/BrandMark';
import LanguageSwitcher from '../shared/LanguageSwitcher';

export default function AppTopHeader({
  t,
  user,
  roleLabel,
  displayAppName,
  isDesktop,
  sidebarOpen,
  mobileNavOpen,
  onToggleSidebar,
}) {
  return (
    <header className="admin-topbar print:hidden flex shrink-0 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-deep)] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={mobileNavOpen || sidebarOpen ? t('nav.closeMenu') : t('nav.expandMenu')}
        >
          {isDesktop ? (sidebarOpen ? <X size={20} /> : <Menu size={20} />) : <Menu size={20} />}
        </button>
        <div className="app-top-header__brand hidden sm:block">
          <BrandMark variant="full" height={28} />
        </div>
        <div className="min-w-0 lg:hidden">
          <p className="admin-page-title truncate text-sm">{displayAppName()}</p>
          <p className="admin-page-subtitle truncate text-xs">{user?.fullName}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
        <OnScreenKeyboardButton variant="header" />
        <LanguageSwitcher />
        <div className="flex items-center gap-2 text-sm">
          <div className="admin-topbar__avatar">
            {user?.fullName?.[0] ?? 'U'}
          </div>
          <div className="hidden md:block">
            <div className="font-medium text-[color:var(--admin-ink)] dark:text-white">{user?.fullName}</div>
            <div className="admin-page-subtitle text-xs">{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

