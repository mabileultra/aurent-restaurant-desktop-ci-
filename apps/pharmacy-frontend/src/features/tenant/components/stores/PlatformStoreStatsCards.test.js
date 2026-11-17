import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformStoreStatsCards from './PlatformStoreStatsCards';

globalThis.React = React;

describe('PlatformStoreStatsCards', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const defaultProps = {
    t: mockT,
    totalStores: 12,
    activeStores: 10,
    inactiveStores: 2,
    companiesCount: 4,
    statusFilter: 'ALL',
    onStatusFilterChange: vi.fn(),
    isPending: false,
  };

  it('renders 4 KPI stats cards with correct titles and formatted numbers', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreStatsCards, defaultProps)
    );

    expect(html).toContain('Jami filiallar');
    expect(html).toContain('Faol filiallar');
    expect(html).toContain('Kompaniyalar');
    expect(html).toContain('Nofaol filiallar');

    expect(html).toContain('12');
    expect(html).toContain('10');
    expect(html).toContain('4');
    expect(html).toContain('2');
  });

  it('shows active ring on selected filter card', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreStatsCards, {
        ...defaultProps,
        statusFilter: 'ACTIVE',
      })
    );

    expect(html).toContain('ring-2 ring-primary-500/70');
  });

  it('shows warning alert styling for inactive branches when inactiveStores > 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreStatsCards, {
        ...defaultProps,
        inactiveStores: 3,
      })
    );

    expect(html).toContain('ui-kpi-icon-warning');
  });

  it('shows neutral styling for inactive branches when inactiveStores is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreStatsCards, {
        ...defaultProps,
        inactiveStores: 0,
      })
    );

    expect(html).toContain('text-ink-disabled');
    expect(html).toContain('bg-canvas');
  });

  it('renders em-dash placeholder when isPending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformStoreStatsCards, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('—');
  });
});
