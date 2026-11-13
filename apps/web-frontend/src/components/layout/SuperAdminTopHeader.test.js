import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SuperAdminTopHeader from './SuperAdminTopHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'uz',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('../../utils/onScreenKeyboard', () => ({
  showOnScreenKeyboard: vi.fn(),
}));

describe('SuperAdminTopHeader', () => {
  it('renders title, responsive controls, avatar and logout correctly', () => {
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

    // Profile & roles
    expect(html).toContain('Ali Valiyev');
    expect(html).toContain('Super-admin');
    // Avatar first letter
    expect(html).toContain('>A<');
    // ABC button
    expect(html).toContain('ABC');
    // Segmented languages UZ and RU
    expect(html).toContain('UZ');
    expect(html).toContain('RU');
    // Mobile controls: Menu button and Logo
    expect(html).toContain('aria-label="Menyuni ochish"');
    expect(html).toContain('/brand/logonew.png');
    // Logout button (40px desktop control-md, 44px mobile touch)
    expect(html).toContain('aria-label="Chiqish"');
    expect(html).toContain('aa-desktop:h-10 aa-desktop:w-10');
    expect(html).toContain('aa-seg--header');
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
