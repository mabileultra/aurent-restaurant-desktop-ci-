import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AnalyticsFiltersBar from './components/AnalyticsFiltersBar';
import AnalyticsRegionDrilldownHeader from './components/AnalyticsRegionDrilldownHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'uz' },
  }),
}));

describe('Analytics selects standardization', () => {
  it('renders PlatformSelect in AnalyticsFiltersBar and does not render raw select tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnalyticsFiltersBar, {
        regionCode: '',
        onRegionChange: vi.fn(),
        regions: [{ code: '1726', nameUz: 'Samarqand viloyati' }],
      })
    );

    // Must use platform-select with blue theme and custom base-select trigger
    expect(html).toContain('platform-select');
    expect(html).toContain('platform-select--blue');
    expect(html).toContain('base-select__trigger');
    // Must NOT contain raw HTML <select class="f"
    expect(html).not.toContain('<select class="f"');
  });

  it('renders PlatformSelect in AnalyticsRegionDrilldownHeader and does not render raw select tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnalyticsRegionDrilldownHeader, {
        activeView: 'cards',
        sort: 'turnover_desc',
        fiscalStatus: 'all',
      })
    );

    expect(html).toContain('platform-select');
    expect(html).toContain('platform-select--blue');
    expect(html).toContain('base-select__trigger');
    expect(html).not.toContain('<select class="f"');
  });
});
