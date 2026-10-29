import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useNetworkStatus } from './useNetworkStatus';
import GlobalOfflineBanner from '../components/shared/GlobalOfflineBanner';

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
    expect(hookResult.wasOffline).toBe(false);
  });
});
