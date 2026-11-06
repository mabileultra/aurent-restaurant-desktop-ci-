import React from 'react';
import BrandMark from '../shared/BrandMark';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut } from 'lucide-react';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import OnScreenKeyboardButton from '../shared/OnScreenKeyboardButton';

export default function SuperAdminTopHeader({ mobileNavOpen, onToggleMobileNav, user, onLogout }) {
  const { t } = useTranslation();

  return (
    <header
      className="admin-topbar border-b border-slate-200 dark:border-slate-800 dark:!bg-slate-900 h-16 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 gap-2"
      data-purpose="top-header"
    >
      {/* Top Left: Hamburger for mobile + Logo & Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden transition shrink-0 cursor-pointer"
          onClick={onToggleMobileNav}
          aria-expanded={Boolean(mobileNavOpen)}
          aria-label={t('nav.expandMenu')}
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <BrandMark variant="icon" size={26} className="shrink-0 sm:hidden" />
          <BrandMark variant="full" height={28} className="shrink-0 hidden sm:block" />
          <div className="min-w-0 truncate">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 leading-tight text-xs sm:text-base truncate">
              {t('platform.title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {t('platform.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Top Right: ABC keyboard, RU/UZ switcher, avatar, logout */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        <div className="hidden sm:flex items-center">
          <OnScreenKeyboardButton variant="header" />
        </div>
        <LanguageSwitcher />
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center shadow-sm text-xs sm:text-sm shrink-0 select-none"
          aria-hidden
          title={user?.fullName || t('platform.title')}
        >
          {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center transition shrink-0"
          aria-label={t('nav.logout')}
          title={t('nav.logout')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
