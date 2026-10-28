import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformCompanyStatsCards from './PlatformCompanyStatsCards';

globalThis.React = React;

describe('PlatformCompanyStatsCards', () => {
  const mockT = (key, opts) => opts?.defaultValue || key;

  const defaultProps = {
    t: mockT,
    totalCompanies: 102,
    activeCompanies: 98,
    inactiveCompanies: 4,
    totalStores: 148,
    statusFilter: 'ALL',
    onStatusFilterChange: vi.fn(),
    isPending: false,
  };

  it('renders all four metric cards with correct values and titles', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyStatsCards, defaultProps)
    );

    expect(html).toContain('Jami kompaniyalar');
    expect(html).toContain('102');

    expect(html).toContain('Faol kompaniyalar');
    expect(html).toContain('98');

    expect(html).toContain('Ulangan do‘konlar');
    expect(html).toContain('148');

    expect(html).toContain('Nofaollar');
    expect(html).toContain('4');
  });

  it('renders all cards with hover lift styling and role button', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyStatsCards, {
        ...defaultProps,
        onStoresClick: vi.fn(),
      })
    );

    // All cards should have hover lift and cursor pointer
    expect(html).toContain('hover:-translate-y-0.5');
    expect(html).toContain('cursor-pointer');
    expect(html).toContain('role="button"');
  });

  it('renders pending state dash when isPending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyStatsCards, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('—');
  });
});
