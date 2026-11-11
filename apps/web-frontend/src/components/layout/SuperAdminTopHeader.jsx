import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut, Keyboard } from 'lucide-react';
import Segmented from '../aa/Segmented';
import Button from '../aa/Button';
import { showOnScreenKeyboard } from '../../utils/onScreenKeyboard';

/**
 * Aurent Admin — Super-admin tepa paneli (Header).
 * 64px, bg-aa-surface, pastda aa-line, px-8 (mobilda px-4).
 */
export default function SuperAdminTopHeader({
  mobileNavOpen,
  onOpenMobileNav,
  onToggleMobileNav,
  menuButtonRef,
  user,
  onLogout,
}) {
  const { i18n } = useTranslation();
  const handleMenuClick = onOpenMobileNav || onToggleMobileNav;

  const handleKeyboardClick = async () => {
    try {
      await showOnScreenKeyboard();
    } catch {
      // noop
    }
  };

  const currentLang = i18n?.language?.startsWith('ru') ? 'ru' : 'uz';
  const handleLangChange = (val) => {
    i18n?.changeLanguage?.(val);
  };

  const userInitial = (user?.fullName || 'A')[0].toUpperCase();

  return (
    <header
      className="h-16 bg-aa-surface border-b border-aa-line px-4 aa-desktop:px-8 flex items-center justify-between shrink-0 select-none"
      data-purpose="top-header"
    >
      {/* Chap tomon: faqat mobilda (<760px) menyuni ochish tugmasi va logotip */}
      <div className="flex items-center gap-2 aa-desktop:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={handleMenuClick}
          aria-expanded={Boolean(mobileNavOpen)}
          aria-label="Menyuni ochish"
          className="w-11 h-11 flex items-center justify-center rounded-aa-md hover:bg-aa-surface-hover text-aa-ink transition cursor-pointer"
        >
          <Menu size={16} />
        </button>
        <img
          src="/brand/logonew.png"
          alt="Aurent"
          className="h-8 w-auto shrink-0"
        />
      </div>

      {/* Desktopda chap bo'sh joy */}
      <div className="hidden aa-desktop:block" />

      {/* O‘ng tomon: ABC, UZ/RU, ajratgich, profil, Chiqish */}
      <div className="flex items-center gap-2 aa-desktop:gap-3 shrink-0">
        {/* 1. ABC tugmasi */}
        <Button
          variant="ghost"
          size="sm"
          icon={<Keyboard size={16} />}
          onClick={handleKeyboardClick}
          className="h-11 px-3 aa-desktop:h-8 aa-desktop:px-2.5 text-aa-ink"
        >
          ABC
        </Button>

        {/* 2. UZ/RU segment tanlovi */}
        <div className="[&_.aa-seg__btn]:h-11 [&_.aa-seg__btn]:px-3 aa-desktop:[&_.aa-seg__btn]:h-[30px]">
          <Segmented
            options={[
              { value: 'uz', label: 'UZ' },
              { value: 'ru', label: 'RU' },
            ]}
            value={currentLang}
            onChange={handleLangChange}
            aria-label="Tilni tanlash"
          />
        </div>

        {/* 3. 1x24px aa-line ajratgich (mobilda yashiriladi) */}
        <div
          className="w-px h-6 bg-aa-line hidden aa-desktop:block shrink-0"
          aria-hidden="true"
        />

        {/* 4. Profil: 32px doira avatar + matn */}
        <div className="flex items-center gap-2">
          <div
            className="w-11 h-11 text-sm aa-desktop:w-8 aa-desktop:h-8 aa-desktop:text-xs rounded-aa-full bg-aa-brand-soft text-aa-brand flex items-center justify-center font-semibold shrink-0 select-none"
            aria-hidden="true"
          >
            {userInitial}
          </div>
          <div className="hidden aa-wide:flex flex-col text-left leading-tight">
            <span className="text-[14px] leading-[20px] font-semibold text-aa-ink truncate">
              {user?.fullName || 'Administrator Super'}
            </span>
            <span className="text-[13px] leading-[18px] text-aa-ink-muted truncate">
              Super-admin
            </span>
          </div>
        </div>

        {/* 5. Chiqish tugmasi */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Chiqish"
          className="aa-btn aa-btn--ghost aa-btn--icon h-11 w-11 aa-desktop:h-8 aa-desktop:w-8 text-aa-ink hover:text-aa-danger cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
