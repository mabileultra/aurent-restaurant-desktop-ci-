import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SuperAdminTopHeader from './SuperAdminTopHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const dict = {
        'platform.title': 'Super-admin',
        'platform.subtitle': 'Platform boshqaruvi',
        'nav.expandMenu': 'Menyuni ochish',
        'nav.logout': 'Chiqish',
      };
      return dict[key] || key;
    },
  }),
}));

vi.mock('../shared/BrandMark', () => ({
  default: ({ variant, className }) =>
    React.createElement('div', { 'data-testid': `brand-mark-${variant}`, className }),
}));

vi.mock('../shared/LanguageSwitcher', () => ({
  default: () => React.createElement('div', { 'data-testid': 'language-switcher' }),
}));

vi.mock('../shared/OnScreenKeyboardButton', () => ({
  default: () => React.createElement('div', { 'data-testid': 'onscreen-keyboard-btn' }),
}));

describe('SuperAdminTopHeader', () => {
  it('renders title, responsive logos and triggers correctly', () => {
    const onToggleMobileNav = vi.fn();
    const onLogout = vi.fn();
    const user = { fullName: 'Ali Valiyev' };

    const html = renderToStaticMarkup(
      React.createElement(SuperAdminTopHeader, {
        onToggleMobileNav,
        onLogout,
        user,
      })
    );

    expect(html).toContain('Super-admin');
    expect(html).toContain('Platform boshqaruvi');
    // Mobile icon logo present with sm:hidden
    expect(html).toContain('brand-mark-icon');
    expect(html).toContain('sm:hidden');
    // Desktop full logo present with hidden sm:block
    expect(html).toContain('brand-mark-full');
    expect(html).toContain('hidden sm:block');
    // OnScreenKeyboard hidden on mobile
    expect(html).toContain('hidden sm:flex');
    expect(html).toContain('onscreen-keyboard-btn');
    // Avatar first letter
    expect(html).toContain('>A<');
    expect(html).toContain('aria-expanded="false"');

    const htmlOpen = renderToStaticMarkup(
      React.createElement(SuperAdminTopHeader, {
        mobileNavOpen: true,
        onToggleMobileNav,
        onLogout,
        user,
      })
    );
    expect(htmlOpen).toContain('aria-expanded="true"');
  });
});
