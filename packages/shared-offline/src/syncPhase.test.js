import { describe, expect, it } from 'vitest';
import { SYNC_PHASE, isActiveSyncPhase } from './syncPhase.js';

describe('@aurent/shared-offline syncPhase', () => {
  it('marks catalog/sales as active', () => {
    expect(isActiveSyncPhase(SYNC_PHASE.CATALOG)).toBe(true);
    expect(isActiveSyncPhase(SYNC_PHASE.IDLE)).toBe(false);
    expect(isActiveSyncPhase(SYNC_PHASE.DONE)).toBe(false);
  });
});
