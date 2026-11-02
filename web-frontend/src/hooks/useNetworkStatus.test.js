import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useNetworkStatus } from './useNetworkStatus';
import GlobalOfflineBanner from '../components/shared/GlobalOfflineBanner';
import { ConnectionStatus } from '../store/networkStore';

describe('useNetworkStatus and GlobalOfflineBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sets onlineManager state according to network condition', () => {
    onlineManager.setOnline(false);
    expect(onlineManager.isOnline()).toBe(false);

    onlineManager.setOnline(true);
    expect(onlineManager.isOnline()).toBe(true);
  });

  it('does not render banner on initial mount when online', () => {
    vi.stubGlobal('navigator', { onLine: true });

    let hookResult;
    function TestComponent() {
      hookResult = useNetworkStatus();
      return React.createElement(GlobalOfflineBanner);
    }

    const html = renderToStaticMarkup(React.createElement(TestComponent));
    expect(html).toBe('');
    expect(hookResult.isOnline).toBe(true);
    expect(hookResult.isOffline).toBe(false);
  });

  it('renders yellow thin bar when checking connection', () => {
    const override = {
      isChecking: true,
      isOffline: false,
      isServerDown: false,
      wasOffline: false,
      status: ConnectionStatus.CHECKING,
    };
    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('bg-amber-400');
    expect(html).toContain('Aloqa sekin, tekshirilmoqda…');
  });

  it('renders red offline banner when offline with role alert', () => {
    const override = {
      isChecking: false,
      isOffline: true,
      isServerDown: false,
      wasOffline: false,
      status: ConnectionStatus.OFFLINE,
    };
    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('bg-rose-600');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Internet uzildi. Ma’lumotlar saqlanmaydi');
    expect(html).toContain('Qayta tekshirish');
  });

  it('renders amber banner when server is down', () => {
    const override = {
      isChecking: false,
      isOffline: false,
      isServerDown: true,
      wasOffline: false,
      status: ConnectionStatus.SERVER_DOWN,
    };
    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('bg-amber-600');
    expect(html).toContain('Server bilan aloqa yo’q');
  });

  it('renders emerald banner when reconnected with role status', () => {
    const override = {
      isChecking: false,
      isOffline: false,
      isServerDown: false,
      wasOffline: true,
      status: ConnectionStatus.RECONNECTED,
    };
    const html = renderToStaticMarkup(
      React.createElement(GlobalOfflineBanner, { networkStatusOverride: override })
    );
    expect(html).toContain('bg-emerald-600');
    expect(html).toContain('role="status"');
    expect(html).toContain('Aloqa tiklandi, ma’lumotlar yangilandi');
  });
});
