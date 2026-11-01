import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformDesktopTargetStep from './PlatformDesktopTargetStep';

globalThis.React = React;

describe('PlatformDesktopTargetStep', () => {
  const mockProps = {
    t: (key, fallback) => {
      if (typeof fallback === 'string') return fallback;
      if (fallback?.defaultValue) return fallback.defaultValue;
      if (key === 'platform.desktopNotifications.stepTarget') return 'Kimga';
      if (key === 'platform.desktopNotifications.targetAll') return 'Barcha kassalar';
      if (key === 'platform.desktopNotifications.targetSelect') return 'Tanlab yuborish';
      if (key === 'platform.desktopNotifications.allCompaniesOfflineNote')
        return 'Barcha kompaniyalar · oflayn kassalar internetga ulanganda oladi';
      return key;
    },
    targetScope: 'ALL',
    setTargetScope: vi.fn(),
    targetType: 'COMPANIES',
    setTargetType: vi.fn(),
    activeCount: 132,
    onlineRegistersCount: 15,
    companies: [{ id: 1, name: 'Company Alpha' }],
    stores: [{ id: 10, name: 'Store Central' }],
    selectedCompanyIds: [],
    selectedStoreIds: [],
    toggleCompanyId: vi.fn(),
    toggleStoreId: vi.fn(),
  };

  it('renders ALL scope without error and displays active count note', () => {
    const html = renderToStaticMarkup(React.createElement(PlatformDesktopTargetStep, { p: mockProps }));

    expect(html).toContain('Barcha kassalar');
    expect(html).toContain('Tanlab yuborish');
    expect(html).toContain('Barcha kompaniyalar');
  });

  it('renders SELECT scope with companies and stores buttons', () => {
    const selectProps = { ...mockProps, targetScope: 'SELECT' };
    const html = renderToStaticMarkup(React.createElement(PlatformDesktopTargetStep, { p: selectProps }));

    expect(html).toContain("Kompaniyalar bo&#x27;yicha");
    expect(html).toContain("Filiallar bo&#x27;yicha");
    expect(html).toContain('Company Alpha');
  });
});
