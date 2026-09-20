import { describe, expect, it } from 'vitest';
import { canRunOnlineSync } from './canRunOnlineSync';

describe('canRunOnlineSync', () => {
  it('requires apiOnline and rejects force/offline mode', () => {
    expect(canRunOnlineSync({
      apiOnline: true,
      offlineMode: false,
      forceOfflineMode: false,
    })).toBe(true);

    expect(canRunOnlineSync({
      apiOnline: false,
      offlineMode: true,
      forceOfflineMode: false,
    })).toBe(false);

    expect(canRunOnlineSync({
      apiOnline: true,
      offlineMode: false,
      forceOfflineMode: true,
    })).toBe(false);
  });

  it('does not treat navigator.onLine alone as enough (passed via state)', () => {
    // browserOnline without apiOnline must not sync
    expect(canRunOnlineSync({
      apiOnline: false,
      offlineMode: false,
      forceOfflineMode: false,
    })).toBe(false);
  });
});
