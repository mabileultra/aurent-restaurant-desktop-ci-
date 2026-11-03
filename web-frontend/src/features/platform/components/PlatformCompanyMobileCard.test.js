import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyMobileCard from './PlatformCompanyMobileCard';

globalThis.React = React;

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className }) => React.createElement('a', { href: to, className }, children),
}));

describe('PlatformCompanyMobileCard', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  it('renders mobile card with company details and clean formatting', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyMobileCard, {
        row: {
          id: 12,
          name: 'Mobile Cafe',
          tin: '123456789',
          phone: '998901234567',
          active: true,
          storeCount: 2,
          businessType: 'RESTAURANT',
        },
        t: mockT,
      })
    );

    expect(html).toContain('Mobile Cafe');
    expect(html).toContain('ID: #12');
    expect(html).toContain('STIR: 123456789');
    expect(html).toContain('+998 (90) 123-45-67');
    expect(html).toContain('Faolsiz');
    expect(html).toContain('O‘chirish');
  });

  it('hides dirty STIR like "_" or "-"', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyMobileCard, {
        row: {
          id: 13,
          name: 'Dirty TIN Cafe',
          tin: '_',
          active: false,
          storeCount: 0,
          businessType: 'RETAIL',
        },
        t: mockT,
      })
    );

    expect(html).toContain('Dirty TIN Cafe');
    expect(html).not.toContain('STIR: _');
    expect(html).toContain('Faol');
  });
});
