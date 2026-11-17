import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getAppVersion, getAppVersionInfo } from './appVersion.js';

describe('appVersion helper', () => {
  const originalWindow = globalThis.window;
  const originalAppVersion = globalThis.__APP_VERSION__;

  beforeEach(() => {
    delete globalThis.__APP_VERSION__;
    delete globalThis.window;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete globalThis.window;
    }
    if (originalAppVersion !== undefined) {
      globalThis.__APP_VERSION__ = originalAppVersion;
    } else {
      delete globalThis.__APP_VERSION__;
    }
  });

  it('resolves version from Electron desktopCashier.appVersion', () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        appVersion: '1.3.4',
      },
    };

    expect(getAppVersion()).toBe('1.3.4');
    expect(getAppVersionInfo()).toEqual({
      version: '1.3.4',
      formatted: 'v1.3.4',
      isDesktop: true,
      platform: 'desktop',
    });
  });

  it('resolves version from desktopCashier.getAppVersionSync if appVersion string is missing', () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        getAppVersionSync: () => '0.1.37',
      },
    };

    expect(getAppVersion()).toBe('0.1.37');
    expect(getAppVersionInfo()).toEqual({
      version: '0.1.37',
      formatted: 'v0.1.37',
      isDesktop: true,
      platform: 'desktop',
    });
  });

  it('resolves version from Vite define __APP_VERSION__ in browser', () => {
    globalThis.window = {};
    globalThis.__APP_VERSION__ = '1.0.0';

    expect(getAppVersion()).toBe('1.0.0');
    expect(getAppVersionInfo()).toEqual({
      version: '1.0.0',
      formatted: 'v1.0.0',
      isDesktop: false,
      platform: 'web',
    });
  });

  it('prefers Electron desktopCashier version over browser __APP_VERSION__', () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        appVersion: '2.0.0',
      },
    };
    globalThis.__APP_VERSION__ = '1.0.0';

    expect(getAppVersion()).toBe('2.0.0');
    expect(getAppVersionInfo().isDesktop).toBe(true);
  });

  it('returns empty string when no version sources are available', () => {
    expect(getAppVersion()).toBe('');
    expect(getAppVersionInfo()).toEqual({
      version: '',
      formatted: '',
      isDesktop: false,
      platform: 'web',
    });
  });
});
