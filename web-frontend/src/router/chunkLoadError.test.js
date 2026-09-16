import { describe, expect, it } from 'vitest';
import { isChunkLoadError } from './chunkLoadError';

describe('isChunkLoadError', () => {
  it('detects a failed dynamic import', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
  });

  it('detects a circular chunk initialization error', () => {
    expect(isChunkLoadError(new TypeError("Cannot access 'X' before initialization"))).toBe(true);
  });

  it('ignores a normal render error', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false);
  });
});
