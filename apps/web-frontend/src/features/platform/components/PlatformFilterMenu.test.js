import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformFilterMenu from './PlatformFilterMenu';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
  }),
}));

describe('PlatformFilterMenu', () => {
  it('renders nothing when options are empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformFilterMenu, {
        options: [],
        value: '',
        onChange: vi.fn(),
      })
    );
    expect(html).toBe('');
  });

  it('renders filter button with options', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformFilterMenu, {
        options: [
          { value: 'ALL', label: 'Barchasi' },
          { value: 'ACTIVE', label: 'Faol' },
        ],
        value: 'ACTIVE',
        onChange: vi.fn(),
      })
    );
    expect(html).toContain('platform-filter-bar__filter');
    expect(html).toContain('is-active');
    expect(html).toContain('platform-filter-bar__dot');
  });
});
