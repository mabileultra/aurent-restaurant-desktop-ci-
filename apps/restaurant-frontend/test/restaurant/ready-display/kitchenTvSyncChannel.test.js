import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  KITCHEN_TV_SYNC_STORAGE_KEY,
  publishKitchenTvBump,
} from '../../../src/restaurant/ready-display/kitchenTvSyncChannel';

describe('kitchenTvSyncChannel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('writes bump to localStorage for cross-window storage events', () => {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      setItem: (k, v) => store.set(k, v),
      getItem: (k) => store.get(k) ?? null,
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    });
    vi.stubGlobal('BroadcastChannel', undefined);

    publishKitchenTvBump(42);
    const raw = store.get(KITCHEN_TV_SYNC_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.storeId).toBe('42');
    expect(typeof parsed.at).toBe('number');
  });
});
