import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformStoreQuickDrawer from './PlatformStoreQuickDrawer';

globalThis.React = React;

describe('PlatformStoreQuickDrawer', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const mockStore = {
    id: 101,
    name: 'Mega Store Chilonzor',
    companyName: 'Mega Retail MCHJ',
    phone: '+998901234567',
    address: 'Chilonzor 9-mavze, 2-uy',
    regionCode: 'TAS',
    districtCode: 'CHIL',
    businessType: 'RESTAURANT',
    active: true,
  };

  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreQuickDrawer, {
        open: false,
        store: mockStore,
        t: mockT,
      })
    );
    expect(html).toBe('');
  });

  it('renders nothing when store is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreQuickDrawer, {
        open: true,
        store: null,
        t: mockT,
      })
    );
    expect(html).toBe('');
  });

  it('renders store details, formatted phone, avatar initials, and active badge when open is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreQuickDrawer, {
        open: true,
        store: mockStore,
        t: mockT,
        regionName: () => 'Toshkent sh.',
        districtName: () => 'Chilonzor tumani',
        onClose: vi.fn(),
        onEdit: vi.fn(),
        onToggleActive: vi.fn(),
      })
    );

    // Store name & company
    expect(html).toContain('Mega Store Chilonzor');
    expect(html).toContain('Mega Retail MCHJ');

    // Initials avatar
    expect(html).toContain('MS');

    // ID
    expect(html).toContain('#101');

    // Formatted phone
    expect(html).toContain('+998 (90) 123-45-67');

    // Geo & Address
    expect(html).toContain('Toshkent sh., Chilonzor tumani');
    expect(html).toContain('Chilonzor 9-mavze, 2-uy');

    // Status & Action buttons
    expect(html).toContain('Faol');
    expect(html).toContain('Tahrirlash');
    expect(html).toContain('To‘xtatish');
  });

  it('renders pharmacy integration button when businessType is PHARMACY', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreQuickDrawer, {
        open: true,
        store: { ...mockStore, businessType: 'PHARMACY' },
        t: mockT,
        onPharmacyIntegration: vi.fn(),
      })
    );

    expect(html).toContain('Dorixona');
  });

  it('renders clean em-dash when phone or companyName is missing', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreQuickDrawer, {
        open: true,
        store: { ...mockStore, phone: '', companyName: '' },
        t: mockT,
      })
    );

    expect(html).toContain('—');
  });
});
