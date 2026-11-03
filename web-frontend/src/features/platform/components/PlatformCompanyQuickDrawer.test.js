import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformCompanyQuickDrawer from './PlatformCompanyQuickDrawer';

globalThis.React = React;

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className }) => React.createElement('a', { href: to, className }, children),
}));

vi.mock('../../shared/geo/useGeoNameLookup', () => ({
  useGeoNameLookup: () => ({
    regionName: () => 'Toshkent viloyati',
    districtName: () => 'Chirchiq sh.',
  }),
}));

vi.mock('../../../api/companyBusinessType.api', () => ({
  companyBusinessTypeApi: {
    getForCompany: vi.fn().mockResolvedValue({
      data: {
        businessTypes: [
          { id: 1, name: 'Chakana savdo', code: 'RETAIL' },
          { id: 2, name: 'Restoran', code: 'RESTAURANT' },
        ],
      },
    }),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PlatformCompanyQuickDrawer', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  it('renders company details, clean STIR, formatted phone, and toggle active button', () => {
    const qc = new QueryClient();
    const html = renderToStaticMarkup(
      React.createElement(QueryClientProvider, { client: qc },
        React.createElement(PlatformCompanyQuickDrawer, {
          open: true,
          company: {
            id: 88,
            name: 'Quick Test Corp',
            legalName: 'Quick Test LLC',
            loginCode: 'QTC-88',
            tin: '987654321',
            phone: '998901112233',
            storeCount: 3,
            businessType: 'UNIVERSAL',
            active: true,
            regionCode: 'TAS',
            districtCode: 'CHIR',
          },
          t: mockT,
        })
      )
    );

    expect(html).toContain('Quick Test Corp');
    expect(html).toContain('QTC-88');
    expect(html).toContain('987654321');
    expect(html).toContain('+998 (90) 111-22-33');
    expect(html).toContain('Chirchiq sh., Toshkent viloyati');
    expect(html).toContain('Faolsizlantirish');
    expect(html).toContain('href="/platform/stores?companyId=88&amp;focusCompany=88#company-88"');
  });
});
