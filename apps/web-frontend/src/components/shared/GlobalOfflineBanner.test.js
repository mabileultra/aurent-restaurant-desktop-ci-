import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalOfflineBanner from './GlobalOfflineBanner';
import { ConnectionStatus } from '../../store/networkStore';

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
      isServerDown: false,
      wasOffline: false,
      isChecking: false,
      status: ConnectionStatus.ONLINE,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toBe('');
  });

  it('renders red offline warning banner with retry button when offline', () => {
    const override = {
      isOffline: true,
      isServerDown: false,
      wasOffline: false,
      isChecking: false,
      status: ConnectionStatus.OFFLINE,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Internet uzildi. Ma’lumotlar saqlanmaydi');
    expect(html).toContain('bg-rose-600');
    expect(html).toContain('Qayta tekshirish');
    expect(html).toContain('role="alert"');
  });

  it('renders thin yellow bar when connection test is in progress', () => {
    const override = {
      isOffline: true,
      isServerDown: false,
      wasOffline: false,
      isChecking: true,
      status: ConnectionStatus.CHECKING,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Aloqa sekin, tekshirilmoqda…');
    expect(html).toContain('bg-amber-400');
    expect(html).toContain('animate-spin');
    expect(html).toContain('role="status"');
  });

  it('renders amber warning banner when server is down', () => {
    const override = {
      isOffline: false,
      isServerDown: true,
      wasOffline: false,
      isChecking: false,
      status: ConnectionStatus.SERVER_DOWN,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Server bilan aloqa yo’q. Biroz kuting');
    expect(html).toContain('bg-amber-600');
    expect(html).toContain('role="alert"');
  });

  it('renders emerald success banner when connection is restored', () => {
    const override = {
      isOffline: false,
      isServerDown: false,
      wasOffline: true,
      isChecking: false,
      status: ConnectionStatus.RECONNECTED,
      checkConnection: vi.fn(),
      dismissReconnected: vi.fn(),
    };

    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('Aloqa tiklandi, ma’lumotlar yangilandi');
    expect(html).toContain('bg-emerald-600');
    expect(html).toContain('role="status"');
  });
});
