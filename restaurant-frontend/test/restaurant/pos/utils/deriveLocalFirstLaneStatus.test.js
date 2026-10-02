import { describe, expect, it } from 'vitest';
import { deriveLocalFirstLaneStatus } from '../../../../src/restaurant/pos/utils/deriveLocalFirstLaneStatus.js';

describe('deriveLocalFirstLaneStatus', () => {
  it('returns null when local-first is off', () => {
    expect(deriveLocalFirstLaneStatus({
      order: { _localPrinted: true },
      localFirst: false,
    })).toBeNull();
  });

  it('shows print failed and sync waiting separately', () => {
    const lanes = deriveLocalFirstLaneStatus({
      localFirst: true,
      order: { _localPrinted: true, _printFailed: true, _localOnly: true },
      queues: { pendingOutbox: 1 },
    });
    expect(lanes.visible).toBe(true);
    expect(lanes.kitchen).toBe('print_failed');
    expect(lanes.sync).toBe('waiting');
  });

  it('shows printed + synced when flags and queues clear', () => {
    const lanes = deriveLocalFirstLaneStatus({
      localFirst: true,
      order: { _localPrinted: true },
      queues: { pendingPrintJobs: 0, pendingOutbox: 0 },
    });
    expect(lanes.kitchen).toBe('printed');
    expect(lanes.sync).toBe('synced');
  });

  it('print pending while sync waiting', () => {
    const lanes = deriveLocalFirstLaneStatus({
      localFirst: true,
      order: { _localPrinted: true, _localOnly: true },
      queues: { pendingPrintJobs: 2, pendingOutbox: 1 },
    });
    expect(lanes.kitchen).toBe('print_pending');
    expect(lanes.sync).toBe('waiting');
  });
});
