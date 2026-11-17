import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatVersionWithHash,
  getAppVersion,
  getAppVersionInfo,
} from './appVersion.js';
import {
  buildAppVersionDefine,
  resolveGitShortHash,
} from './resolveBuildVersionDefine.mjs';

describe('appVersion helper', () => {
  const originalWindow = globalThis.window;
  const originalAppVersion = globalThis.__APP_VERSION__;
  const originalGitHash = globalThis.__APP_GIT_HASH__;

  beforeEach(() => {
    globalThis.__APP_VERSION__ = '';
    globalThis.__APP_GIT_HASH__ = '';
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
    if (originalGitHash !== undefined) {
      globalThis.__APP_GIT_HASH__ = originalGitHash;
    } else {
      delete globalThis.__APP_GIT_HASH__;
    }
  });

  it('formats version with short git hash when hash is present and omits parens when absent', () => {
    expect(formatVersionWithHash('1.0.0', 'a1b2c3d')).toBe('1.0.0 (a1b2c3d)');
    expect(formatVersionWithHash('1.0.0', '')).toBe('1.0.0');
    expect(formatVersionWithHash('1.0.0 (a1b2c3d)', 'a1b2c3d')).toBe('1.0.0 (a1b2c3d)');
    expect(formatVersionWithHash('', 'a1b2c3d')).toBe('');
  });

  it('resolveGitShortHash and buildAppVersionDefine handle both git-present and git-missing (CI/archive) gracefully', () => {
    const pkgUrl = new URL('../../../apps/web-frontend/package.json', import.meta.url);

    expect(resolveGitShortHash({ exec: () => 'a1b2c3d\n' })).toBe('a1b2c3d');
    expect(
      resolveGitShortHash({
        exec: () => {
          throw new Error('fatal: not a git repository');
        },
      }),
    ).toBe('');

    const withGit = buildAppVersionDefine(pkgUrl, { exec: () => 'a1b2c3d\n' });
    expect(JSON.parse(withGit.__APP_VERSION__)).toBe('1.0.0 (a1b2c3d)');
    expect(JSON.parse(withGit.__APP_GIT_HASH__)).toBe('a1b2c3d');

    const withoutGit = buildAppVersionDefine(pkgUrl, {
      exec: () => {
        throw new Error('git not found');
      },
    });
    expect(JSON.parse(withoutGit.__APP_VERSION__)).toBe('1.0.0');
    expect(JSON.parse(withoutGit.__APP_GIT_HASH__)).toBe('');
  });

  it('resolves version from Electron desktopCashier.appVersion and exposes both desktopVersion and uiVersion', () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        appVersion: '1.3.4',
      },
    };
    globalThis.__APP_VERSION__ = '1.0.0 (a1b2c3d)';

    // Receipt uses desktop version:
    expect(getAppVersion()).toBe('1.3.4');
    // About dialog gets both desktopVersion and uiVersion (with hash):
    expect(getAppVersionInfo()).toEqual({
      version: '1.3.4',
      desktopVersion: '1.3.4',
      uiVersion: '1.0.0 (a1b2c3d)',
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
      desktopVersion: '0.1.37',
      uiVersion: '',
      formatted: 'v0.1.37',
      isDesktop: true,
      platform: 'desktop',
    });
  });

  it('resolves version with short git hash in browser when hash is available', () => {
    globalThis.window = {};
    globalThis.__APP_VERSION__ = '1.0.0';
    globalThis.__APP_GIT_HASH__ = 'a1b2c3d';

    expect(getAppVersion()).toBe('1.0.0 (a1b2c3d)');
    expect(getAppVersionInfo()).toEqual({
      version: '1.0.0 (a1b2c3d)',
      desktopVersion: '',
      uiVersion: '1.0.0 (a1b2c3d)',
      formatted: 'v1.0.0 (a1b2c3d)',
      isDesktop: false,
      platform: 'web',
    });
  });

  it('resolves version without hash in browser when git hash is empty', () => {
    globalThis.window = {};
    globalThis.__APP_VERSION__ = '1.0.0';
    globalThis.__APP_GIT_HASH__ = '';

    expect(getAppVersion()).toBe('1.0.0');
    expect(getAppVersionInfo()).toEqual({
      version: '1.0.0',
      desktopVersion: '',
      uiVersion: '1.0.0',
      formatted: 'v1.0.0',
      isDesktop: false,
      platform: 'web',
    });
  });

  it('returns empty string when no version sources are available', () => {
    expect(getAppVersion()).toBe('');
    expect(getAppVersionInfo()).toEqual({
      version: '',
      desktopVersion: '',
      uiVersion: '',
      formatted: '',
      isDesktop: false,
      platform: 'web',
    });
  });
});
