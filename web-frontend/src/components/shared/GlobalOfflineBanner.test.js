import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalOfflineBanner from './GlobalOfflineBanner';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue || key,
  }),
}));

describe('GlobalOfflineBanner', () => {
  it('renders nothing when user is online and was not previously offline', () => {
    const override = {
      isOffline: false,
      wasOffline: false,
      isChecking: false,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toBe('');
  });

  it('renders amber warning banner with retry button when offline', () => {
    const override = {
      isOffline: true,
      wasOffline: false,
      isChecking: false,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Internet aloqasi uzildi');
    expect(html).toContain('bg-amber-600');
    expect(html).toContain('Qayta tekshirish');
    expect(html).toContain('role="alert"');
  });

  it('renders checking state when connection test is in progress', () => {
    const override = {
      isOffline: true,
      wasOffline: false,
      isChecking: true,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Tekshirilmoqda…');
    expect(html).toContain('animate-spin');
  });

  it('renders emerald success banner when connection is restored', () => {
    const override = {
      isOffline: false,
      wasOffline: true,
      isChecking: false,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Internet aloqasi tiklandi');
    expect(html).toContain('bg-emerald-600');
    expect(html).toContain('Barcha ma’lumotlar sinxronlanmoqda');
  });
});
