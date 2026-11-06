import { describe, expect, it } from 'vitest';
import { resolveOfflineDockBadge } from './resolveOfflineDockBadge';

const base = {
  hasBridge: true,
  isDesktopShell: true,
  offlineAllowed: true,
  forceOfflineMode: false,
  networkOffline: false,
  hasCatalog: true,
};

describe('resolveOfflineDockBadge', () => {
  it('stays online while catalog would be syncing', () => {
    expect(resolveOfflineDockBadge(base)).toEqual({
      tone: 'ok',
      labelKey: 'offline.topbarOnline',
    });
  });

  it('shows offline when the network is down', () => {
    expect(resolveOfflineDockBadge({ ...base, networkOffline: true })).toEqual({
      tone: 'offline',
      labelKey: 'offline.topbarOffline',
    });
  });

  it('warns when offline without a local catalog', () => {
    expect(
      resolveOfflineDockBadge({
        ...base,
        networkOffline: true,
        hasCatalog: false,
      }),
    ).toEqual({
      tone: 'warn',
      labelKey: 'offline.topbarNoCatalog',
    });
  });

  it('warns when desktop has no offline bridge', () => {
    expect(resolveOfflineDockBadge({ ...base, hasBridge: false })).toEqual({
      tone: 'warn',
      labelKey: 'offline.topbarDenied',
    });
  });
});
