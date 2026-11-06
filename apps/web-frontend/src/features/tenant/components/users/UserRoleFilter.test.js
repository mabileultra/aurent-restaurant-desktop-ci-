import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import UserRoleFilter, { PLATFORM_FILTER_ROLES } from './UserRoleFilter';

globalThis.React = React;

describe('UserRoleFilter', () => {
  const mockT = (key, fallback) => {
    if (typeof fallback === 'string') return fallback;
    if (fallback?.defaultValue) return fallback.defaultValue;
    if (key === 'roles.ADMIN') return 'Admin';
    if (key === 'roles.COOK') return 'Oshpaz';
    if (key === 'roles.CASHIER') return 'Kassir';
    return key;
  };

  it('renders all filter roles including COOK and CASHIER', () => {
    const html = renderToStaticMarkup(
      React.createElement(UserRoleFilter, {
        t: mockT,
        role: '',
        onChange: vi.fn(),
      })
    );

    expect(PLATFORM_FILTER_ROLES).toContain('COOK');
    expect(PLATFORM_FILTER_ROLES).toContain('CASHIER');
    expect(PLATFORM_FILTER_ROLES).toContain('ADMIN');
    expect(html).toContain('users-filters__role');
  });

  it('reflects selected role value in rendered select', () => {
    const html = renderToStaticMarkup(
      React.createElement(UserRoleFilter, {
        t: mockT,
        role: 'ADMIN',
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('value="ADMIN"');
  });
});
