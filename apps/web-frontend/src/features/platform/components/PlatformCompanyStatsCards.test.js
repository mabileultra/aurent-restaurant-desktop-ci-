import React from 'react';
import { describe, expect, it } from 'vitest';
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

    expect(html).toContain('Ulangan filiallar');
    expect(html).toContain('148');

    expect(html).toContain('Nofaol kompaniyalar');
    expect(html).toContain('4');
  });

  it('renders progress bar and formatted percentage for active companies', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyStatsCards, defaultProps)
    );

    // 98 / 102 = 96.078... -> 96,1%
    expect(html).toContain('faoliyatda');
    expect(html).toContain('aa-kpi__bar');
  });

  it('renders skeleton metric when isPending is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyStatsCards, {
        ...defaultProps,
        isPending: true,
      })
    );

    expect(html).toContain('aa-skel--metric');
  });

  it('renders dash when isError is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformCompanyStatsCards, {
        ...defaultProps,
        isError: true,
      })
    );

    expect(html).toContain('—');
  });
});
