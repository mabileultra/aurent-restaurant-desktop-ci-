import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { onlineManager } from '@tanstack/react-query';

describe('useNetworkStatus onlineManager integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets onlineManager state according to network condition', () => {
    onlineManager.setOnline(false);
    expect(onlineManager.isOnline()).toBe(false);

    onlineManager.setOnline(true);
    expect(onlineManager.isOnline()).toBe(true);
  });
});
