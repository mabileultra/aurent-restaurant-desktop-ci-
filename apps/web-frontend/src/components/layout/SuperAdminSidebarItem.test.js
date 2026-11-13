import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import SuperAdminSidebarItem from './SuperAdminSidebarItem';

const mockIcons = {};

describe('SuperAdminSidebarItem', () => {
  it('renders simple NavLink when item has no children', () => {
    const item = { to: '/platform/companies', key: 'platform.companies' };
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/companies'] },
        React.createElement(SuperAdminSidebarItem, {
          item,
          location: { pathname: '/platform/companies' },
          onCloseMobileNav: () => {},
          NAV_ICONS: mockIcons,
        })
      )
    );

    expect(html).toContain('href="/platform/companies"');
    expect(html).toContain('platform.companies');
  });

  it('renders collapsible accordion with children when active', () => {
    const item = {
      to: '/platform/analytics',
      key: 'platform.analytics.nav',
      children: [
        { to: '/platform/analytics', key: 'platform.analytics.currentNav', end: true },
        { to: '/platform/analytics/viloyatlar', key: 'platform.analytics.viloyatlarNav' },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/analytics'] },
        React.createElement(SuperAdminSidebarItem, {
          item,
          location: { pathname: '/platform/analytics' },
          onCloseMobileNav: () => {},
          NAV_ICONS: mockIcons,
        })
      )
    );

    expect(html).toContain('platform.analytics.nav');
    expect(html).toContain('role="group"');
    expect(html).toContain('href="/platform/analytics"');
    expect(html).toContain('href="/platform/analytics/viloyatlar"');
    expect(html).toContain('h-9');

    const htmlMobile = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/analytics'] },
        React.createElement(SuperAdminSidebarItem, {
          item,
          location: { pathname: '/platform/analytics' },
          onCloseMobileNav: () => {},
          NAV_ICONS: mockIcons,
          isMobile: true,
        })
      )
    );
    expect(htmlMobile).toContain('h-11');
  });
});
