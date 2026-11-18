import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatVersionWithDate,
  formatVersionWithHash,
  getAppVersion,
  getAppVersionInfo,
  getLicenseNumber,
  getReceiptVersionRows,
} from './appVersion.js';
import {
  buildAppVersionDefine,
  resolveBuildLicenseNumber,
  resolveGitCommitDate,
  resolveGitShortHash,
} from './resolveBuildVersionDefine.mjs';

describe('appVersion helper', () => {
  const originalWindow = globalThis.window;
  const originalAppVersion = globalThis.__APP_VERSION__;
  const originalCommitDate = globalThis.__APP_COMMIT_DATE__;
  const originalGitHash = globalThis.__APP_GIT_HASH__;
  const originalLicenseNumber = globalThis.__APP_LICENSE_NUMBER__;

  beforeEach(() => {
    globalThis.__APP_VERSION__ = '';
    globalThis.__APP_COMMIT_DATE__ = '';
    globalThis.__APP_GIT_HASH__ = '';
    globalThis.__APP_LICENSE_NUMBER__ = '';
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
    if (originalCommitDate !== undefined) {
      globalThis.__APP_COMMIT_DATE__ = originalCommitDate;
    } else {
      delete globalThis.__APP_COMMIT_DATE__;
    }
    if (originalGitHash !== undefined) {
      globalThis.__APP_GIT_HASH__ = originalGitHash;
    } else {
      delete globalThis.__APP_GIT_HASH__;
    }
    if (originalLicenseNumber !== undefined) {
      globalThis.__APP_LICENSE_NUMBER__ = originalLicenseNumber;
    } else {
      delete globalThis.__APP_LICENSE_NUMBER__;
    }
  });

  it('formats receipt version with commit date and About version with date + 7-char hash', () => {
    expect(formatVersionWithDate('1.0.0', '2026-11-18')).toBe('1.0.0 (2026-11-18)');
    expect(formatVersionWithDate('1.0.0', '')).toBe('1.0.0');
    expect(formatVersionWithDate('1.0.0 (2026-11-18)', '2026-11-18')).toBe('1.0.0 (2026-11-18)');

    expect(formatVersionWithHash('1.0.0', 'a1b2c3d', '2026-11-18')).toBe('1.0.0 (2026-11-18, a1b2c3d)');
    expect(formatVersionWithHash('1.0.0 (2026-11-18)', 'a1b2c3d89')).toBe('1.0.0 (2026-11-18, a1b2c3d)');
    expect(formatVersionWithHash('1.0.0', '', '')).toBe('1.0.0');
  });

  it('resolveGitCommitDate, resolveGitShortHash, and buildAppVersionDefine handle git-present and git-missing gracefully', () => {
    const pkgUrl = new URL('../../../apps/web-frontend/package.json', import.meta.url);

    expect(resolveGitCommitDate({ exec: () => '2026-11-18\n' })).toBe('2026-11-18');
    expect(resolveGitShortHash({ exec: () => 'a1b2c3d89\n' })).toBe('a1b2c3d');
    expect(
      resolveGitCommitDate({
        exec: () => {
          throw new Error('fatal: not a git repository');
        },
      }),
    ).toBe('');

    const withGit = buildAppVersionDefine(pkgUrl, {
      exec: (cmd) => (cmd.includes('%cs') ? '2026-11-18\n' : 'a1b2c3d\n'),
    });
    expect(JSON.parse(withGit.__APP_VERSION__)).toBe('1.0.0 (2026-11-18)');
    expect(JSON.parse(withGit.__APP_COMMIT_DATE__)).toBe('2026-11-18');
    expect(JSON.parse(withGit.__APP_GIT_HASH__)).toBe('a1b2c3d');

    const withoutGit = buildAppVersionDefine(pkgUrl, {
      exec: () => {
        throw new Error('git not found');
      },
    });
    expect(JSON.parse(withoutGit.__APP_VERSION__)).toBe('1.0.0');
    expect(JSON.parse(withoutGit.__APP_COMMIT_DATE__)).toBe('');
    expect(JSON.parse(withoutGit.__APP_GIT_HASH__)).toBe('');
  });

  it('returns 1 row (appVersion with date, empty desktopVersion) in browser mode', () => {
    globalThis.window = {};
    globalThis.__APP_VERSION__ = '1.0.0';
    globalThis.__APP_COMMIT_DATE__ = '2026-11-18';
    globalThis.__APP_GIT_HASH__ = 'a1b2c3d';

    expect(getReceiptVersionRows()).toEqual({
      appVersion: '1.0.0 (2026-11-18)',
      desktopVersion: '',
    });
    expect(getAppVersionInfo()).toEqual({
      version: '1.0.0 (2026-11-18, a1b2c3d)',
      desktopVersion: '',
      uiVersion: '1.0.0 (2026-11-18, a1b2c3d)',
      formatted: 'v1.0.0 (2026-11-18, a1b2c3d)',
      isDesktop: false,
      platform: 'web',
    });
  });

  it('returns 1 row without date/hash in browser mode when git is absent', () => {
    globalThis.window = {};
    globalThis.__APP_VERSION__ = '1.0.0';
    globalThis.__APP_COMMIT_DATE__ = '';
    globalThis.__APP_GIT_HASH__ = '';

    expect(getReceiptVersionRows()).toEqual({
      appVersion: '1.0.0',
      desktopVersion: '',
    });
    expect(getAppVersionInfo().uiVersion).toBe('1.0.0');
  });

  it('returns 2 rows (appVersion with date + desktopVersion) on receipts and date+hash in About info in Electron mode', () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        appVersion: '1.3.4',
      },
    };
    globalThis.__APP_VERSION__ = '1.0.0 (2026-11-18)';
    globalThis.__APP_COMMIT_DATE__ = '2026-11-18';
    globalThis.__APP_GIT_HASH__ = 'a1b2c3d';

    expect(getReceiptVersionRows()).toEqual({
      appVersion: '1.0.0 (2026-11-18)',
      desktopVersion: '1.3.4',
    });
    expect(getAppVersionInfo()).toEqual({
      version: '1.3.4',
      desktopVersion: '1.3.4',
      uiVersion: '1.0.0 (2026-11-18, a1b2c3d)',
      formatted: 'v1.3.4',
      isDesktop: true,
      platform: 'desktop',
    });
  });

  it('resolves desktopVersion from desktopCashier.getAppVersionSync if appVersion string is missing', () => {
    globalThis.window = {
      desktopCashier: {
        isDesktop: true,
        getAppVersionSync: () => '0.1.37',
      },
    };
    globalThis.__APP_VERSION__ = '1.0.0 (2026-11-18)';
    globalThis.__APP_COMMIT_DATE__ = '2026-11-18';

    expect(getReceiptVersionRows()).toEqual({
      appVersion: '1.0.0 (2026-11-18)',
      desktopVersion: '0.1.37',
    });
  });

  it('returns empty strings when no version sources are available', () => {
    expect(getAppVersion()).toBe('');
    expect(getReceiptVersionRows()).toEqual({
      appVersion: '',
      desktopVersion: '',
    });
  });

  it('resolves getLicenseNumber() as string when present and null when empty', () => {
    globalThis.__APP_LICENSE_NUMBER__ = '1.3';
    expect(getLicenseNumber()).toBe('1.3');
    expect(getLicenseNumber('  1.3  ')).toBe('1.3');

    globalThis.__APP_LICENSE_NUMBER__ = '   ';
    expect(getLicenseNumber()).toBeNull();
    expect(getLicenseNumber('')).toBeNull();
    expect(getLicenseNumber(null)).toBeNull();

    const pkgUrl = new URL('../../../apps/web-frontend/package.json', import.meta.url);
    expect(resolveBuildLicenseNumber(pkgUrl, { env: {} })).toBe('1.3');
    expect(resolveBuildLicenseNumber(pkgUrl, { env: { VITE_LICENSE_NUMBER: '2.0' } })).toBe('2.0');
  });
});
