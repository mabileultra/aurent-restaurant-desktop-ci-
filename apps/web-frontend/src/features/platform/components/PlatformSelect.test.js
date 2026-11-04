import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformSelect from './PlatformSelect';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'uz' },
  }),
}));

describe('PlatformSelect', () => {
  it('renders correctly with normalized options and cleans apostrophes', () => {
    const options = [
      { value: '1', label: "Qoraqalpog''iston Respublikasi" },
      { value: '2', label: "Farg''ona viloyati" },
      { value: '3', label: 'Toshkent shahri' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(PlatformSelect, {
        value: '1',
        options,
        placeholder: 'Barcha viloyatlar',
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('platform-select');
    expect(html).toContain('platform-select--active');
    expect(html).toContain('base-select--active-filter');
    // Sanitized apostrophe should be present
    expect(html).toContain('Qoraqalpog‘iston Respublikasi');
    expect(html).not.toContain("Qoraqalpog''iston");
  });

  it('handles placeholder prepending when not in options', () => {
    const options = [
      { value: 'ACTIVE', label: 'Faol' },
      { value: 'INACTIVE', label: 'Nofaol' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(PlatformSelect, {
        value: '',
        options,
        placeholder: 'Hammasi',
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('Hammasi');
    expect(html).not.toContain('platform-select--active');
  });

  it('supports size md and disabled state', () => {
    const html = renderToStaticMarkup(
      React.createElement(PlatformSelect, {
        value: '',
        options: [{ value: '1', label: 'One' }],
        size: 'md',
        disabled: true,
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('platform-select--md');
    expect(html).toContain('base-select--disabled');
  });
});
