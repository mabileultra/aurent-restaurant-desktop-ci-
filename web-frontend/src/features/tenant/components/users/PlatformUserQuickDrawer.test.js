import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformUserQuickDrawer from './PlatformUserQuickDrawer';

globalThis.React = React;

describe('PlatformUserQuickDrawer', () => {
  const mockT = (key, fallback) => {
    if (typeof fallback === 'string') return fallback;
    if (fallback?.defaultValue) return fallback.defaultValue;
    return key;
  };

  const sampleUser = {
    id: 'u-12345-uuid',
    fullName: 'Javohir Toshmatov',
    username: 'javohir_pos',
    email: 'javohir@aurent.uz',
    phone: '+998901234567',
    role: 'CASHIER',
    active: true,
    companyName: 'Grand Cafe',
    companyLoginCode: '7777',
    storeNames: ['Filial Markaziy', 'Filial Chilonzor'],
    regionCode: 'TOSHKENT',
    districtCode: 'YUNUSOBOD',
  };

  it('renders user details when open is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserQuickDrawer, {
        open: true,
        user: sampleUser,
        onClose: vi.fn(),
        onEdit: vi.fn(),
        onToggleActive: vi.fn(),
        onDelete: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toContain('Javohir Toshmatov');
    expect(html).toContain('javohir_pos');
    expect(html).toContain('javohir@aurent.uz');
    expect(html).toContain('+998901234567');
    expect(html).toContain('Grand Cafe');
    expect(html).toContain('Filial Markaziy');
    expect(html).toContain('#7777');
    expect(html).toContain('Faol');
  });

  it('returns null when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformUserQuickDrawer, {
        open: false,
        user: sampleUser,
        onClose: vi.fn(),
        t: mockT,
      })
    );

    expect(html).toBe('');
  });
});
