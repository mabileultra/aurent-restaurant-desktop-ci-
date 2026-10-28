import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyQuickDrawer from './PlatformCompanyQuickDrawer';

globalThis.React = React;

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, title }) =>
    React.createElement('a', { href: to, className, title }, children),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PlatformCompanyQuickDrawer', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const mockCompany = {
    id: 62,
    name: '"ANNODENT SS" MCHJ',
    legalName: 'ANNODENT SS MCHJ',
    tin: '305481920',
    phone: '+998901234567',
    address: 'Amir Temur 42',
    regionCode: 'SAM',
    districtCode: 'SAM_SH',
    loginCode: '54157',
    storeCount: 2,
    businessType: 'UNIVERSAL',
    active: true,
  };

  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyQuickDrawer, {
        open: false,
        company: mockCompany,
        t: mockT,
      })
    );
    expect(html).toBe('');
  });

  it('renders company details and quick actions when open is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyQuickDrawer, {
        open: true,
        company: mockCompany,
        t: mockT,
        regionName: () => 'Samarqand viloyati',
        districtName: () => 'Samarqand sh.',
      })
    );

    expect(html).toContain('ANNODENT SS');
    expect(html).toContain('305481920');
    expect(html).toContain('54157');
    expect(html).toContain('Samarqand sh.');
    expect(html).toContain('href="/platform/stores?focusCompany=62#company-62"');
    expect(html).toContain('Filiallar (2)');
  });

  it('renders restaurant contextual branch label and styling', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyQuickDrawer, {
        open: true,
        company: { ...mockCompany, businessType: 'RESTAURANT', storeCount: 5 },
        t: mockT,
      })
    );

    expect(html).toContain('Filiallar (5)');
    expect(html).toContain('Restoran filiallarini ko‘rish');
    expect(html).toContain('bg-emerald-50');
  });
});
