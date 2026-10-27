import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ThemeToggle from './ThemeToggle';
import { useAdminThemeStore } from '../../store/themeStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
    i18n: { language: 'uz' },
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    useAdminThemeStore.setState({ theme: 'light', effectiveTheme: 'light' });
  });

  it('renders 3 theme options in segmented mode', () => {
    const html = renderToStaticMarkup(React.createElement(ThemeToggle));
    expect(html).toContain('role="radiogroup"');
    // Light option (HTML escapes ' to &#x27;)
    expect(html).toContain('Yorug');
    // System option
    expect(html).toContain('Tizim');
    // Dark option
    expect(html).toContain('Tungi');
  });

  it('highlights active theme option', () => {
    useAdminThemeStore.setState({ theme: 'dark', effectiveTheme: 'dark' });
    const html = renderToStaticMarkup(React.createElement(ThemeToggle));
    expect(html).toContain('bg-emerald-500 text-white');
  });

  it('renders compact mode with button', () => {
    const html = renderToStaticMarkup(React.createElement(ThemeToggle, { compact: true }));
    expect(html).toContain('<button type="button"');
    expect(html).not.toContain('role="radiogroup"');
  });
});
