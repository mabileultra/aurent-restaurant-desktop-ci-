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

  it('hides quiet printed+synced state (no permanent Hub strip)', () => {
    const lanes = deriveLocalFirstLaneStatus({
      localFirst: true,
      order: { _localPrinted: true },
      queues: { pendingPrintJobs: 0, pendingOutbox: 0 },
    });
    expect(lanes.kitchen).toBe('printed');
    expect(lanes.sync).toBe('synced');
    expect(lanes.visible).toBe(false);
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

  it('localOnly without pending outbox stays hidden', () => {
    const lanes = deriveLocalFirstLaneStatus({
      localFirst: true,
      order: { _localOnly: true, _localPrinted: false },
      queues: { pendingOutbox: 0 },
    });
    expect(lanes.sync).toBe('synced');
    expect(lanes.kitchen).toBe('idle');
    expect(lanes.visible).toBe(false);
  });
});
