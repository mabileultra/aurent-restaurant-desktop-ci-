import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';
import {
  invalidateStorePrintProfile,
  loadStorePrintProfile,
} from '../../../../src/restaurant/shared/printProfile/loadStorePrintProfile';
import { rstKitchenApi } from '../../../../src/restaurant/api/kitchen.api';

vi.mock('../../../../src/restaurant/api/kitchen.api', () => ({
  rstKitchenApi: {
    getPrintProfile: vi.fn(),
  },
}));

describe('loadStorePrintProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateStorePrintProfile(null);
  });

  afterEach(() => {
    invalidateStorePrintProfile(null);
  });

  it('returns factory default profile when storeId is null or undefined without API call', async () => {
    const profile = await loadStorePrintProfile(null);
    expect(profile).toEqual(factoryPrintProfile());
    expect(rstKitchenApi.getPrintProfile).not.toHaveBeenCalled();

    const profileUndef = await loadStorePrintProfile(undefined);
    expect(profileUndef).toEqual(factoryPrintProfile());
    expect(rstKitchenApi.getPrintProfile).not.toHaveBeenCalled();
  });

  it('fetches profile from API and caches result within TTL', async () => {
    const mockProfile = { ...factoryPrintProfile(), storeName: 'Test Cafe' };
    rstKitchenApi.getPrintProfile.mockResolvedValueOnce({ data: { profile: mockProfile } });

    const first = await loadStorePrintProfile(101);
    expect(first.storeName).toBe('Test Cafe');
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledTimes(1);
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledWith(101);

    // Second call should hit the in-memory cache
    const second = await loadStorePrintProfile(101);
    expect(second.storeName).toBe('Test Cafe');
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledTimes(1);
  });

  it('invalidateStorePrintProfile clears cache and forces a fresh API call', async () => {
    const profileA = { ...factoryPrintProfile(), storeName: 'Store A' };
    const profileB = { ...factoryPrintProfile(), storeName: 'Store B Updated' };

    rstKitchenApi.getPrintProfile
      .mockResolvedValueOnce({ data: { profile: profileA } })
      .mockResolvedValueOnce({ data: { profile: profileB } });

    const first = await loadStorePrintProfile(202);
    expect(first.storeName).toBe('Store A');
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledTimes(1);

    // Invalidate specifically for store 202
    invalidateStorePrintProfile(202);

    const second = await loadStorePrintProfile(202);
    expect(second.storeName).toBe('Store B Updated');
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledTimes(2);
  });

  it('returns factory default and does not cache when API throws an error', async () => {
    rstKitchenApi.getPrintProfile.mockRejectedValueOnce(new Error('Network error'));

    const profile = await loadStorePrintProfile(303);
    expect(profile).toEqual(factoryPrintProfile());
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledTimes(1);

    // On subsequent call after recovery, it should retry rather than returning a cached empty profile
    const recoveredProfile = { ...factoryPrintProfile(), storeName: 'Recovered Store' };
    rstKitchenApi.getPrintProfile.mockResolvedValueOnce({ data: { profile: recoveredProfile } });

    const retry = await loadStorePrintProfile(303);
    expect(retry.storeName).toBe('Recovered Store');
    expect(rstKitchenApi.getPrintProfile).toHaveBeenCalledTimes(2);
  });

  it('safe when window.addEventListener is not a function', async () => {
    vi.stubGlobal('window', { addEventListener: undefined });
    try {
      const profile = await loadStorePrintProfile(null);
      expect(profile).toEqual(factoryPrintProfile());
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
