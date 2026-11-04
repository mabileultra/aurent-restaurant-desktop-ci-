import { beforeEach, describe, expect, it } from 'vitest';
import { useConnectivityStore } from '../store/connectivityStore';
import { getPharmacyHandoffDrainBlock } from './pharmacyOfflineDrainGate';

describe('getPharmacyHandoffDrainBlock', () => {
  beforeEach(() => {
    useConnectivityStore.setState({ pendingSales: 0, syncing: false });
  });

  it('allows handoff when queue empty', () => {
    expect(getPharmacyHandoffDrainBlock()).toEqual({
      blocked: false,
      reason: null,
      pending: 0,
    });
  });

  it('blocks when pending sales exist', () => {
    useConnectivityStore.setState({ pendingSales: 2 });
    expect(getPharmacyHandoffDrainBlock()).toMatchObject({
      blocked: true,
      reason: 'pending',
      pending: 2,
    });
  });

  it('blocks while syncing', () => {
    useConnectivityStore.setState({ syncing: true });
    expect(getPharmacyHandoffDrainBlock().reason).toBe('syncing');
  });
});
