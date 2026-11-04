import { describe, expect, it } from 'vitest';
import {
  shouldFailAdminBootstrapHard,
  shouldRefreshEdgeFromCloud,
} from '../../../src/features/cashier/utils/edgeAdminCloudRefreshGate';

describe('shouldRefreshEdgeFromCloud', () => {
  it('skips cloud when offline and local hall is ready', () => {
    expect(shouldRefreshEdgeFromCloud({
      needsBootstrap: false,
      liveSession: false,
      offline: true,
    })).toBe(false);
  });

  it('requires cloud when offline but local hall empty', () => {
    expect(shouldRefreshEdgeFromCloud({
      needsBootstrap: true,
      liveSession: false,
      offline: true,
    })).toBe(true);
  });

  it('refreshes online when live session missing', () => {
    expect(shouldRefreshEdgeFromCloud({
      needsBootstrap: false,
      liveSession: false,
      offline: false,
    })).toBe(true);
  });
});

describe('shouldFailAdminBootstrapHard', () => {
  it('fails hard only when local edge is empty', () => {
    expect(shouldFailAdminBootstrapHard({ needsBootstrap: true })).toBe(true);
    expect(shouldFailAdminBootstrapHard({ needsBootstrap: false })).toBe(false);
  });
});
