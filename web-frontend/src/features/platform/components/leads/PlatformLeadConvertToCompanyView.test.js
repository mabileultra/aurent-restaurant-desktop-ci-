import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadConvertToCompanyView from './PlatformLeadConvertToCompanyView';

vi.mock('../../../shared/geo/RegionDistrictFields', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-region-district-fields' }, 'GeoFieldsMock'),
}));

describe('PlatformLeadConvertToCompanyView', () => {
  it('renders company convert form pre-filled with lead info and geo fields', () => {
    const lead = {
      id: '1',
      name: 'Nodira Yusupova',
      phone: '+998 94 555 66 77',
      email: 'nodira.y@example.uz',
      message: 'Oziq-ovqat do\'koni, bitta filial',
      status: 'IN_PROGRESS',
      createdAt: '2026-10-27T16:15:00.000Z',
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadConvertToCompanyView, {
        lead,
        onBack: vi.fn(),
        onSubmit: vi.fn(),
      })
    );
    expect(html).toContain('Arizadan kompaniya yaratish');
    expect(html).toContain('Nodira Yusupova');
    expect(html).toContain('GeoFieldsMock');
    expect(html).toContain('xabardan taxmin qilindi');
    expect(html).toContain('Birinchi filial va admin');
    expect(html).toContain('Kompaniya nomini kiriting');
    expect(html).toContain('disabled=""');
  });
});
