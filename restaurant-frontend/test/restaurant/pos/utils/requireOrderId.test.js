import { describe, expect, it } from 'vitest';
import { isUsableOrderId, requireOrderId } from '../../../../src/restaurant/pos/utils/requireOrderId.js';

describe('requireOrderId', () => {
  it('rejects null-like ids that become Invalid UUID string: null', () => {
    expect(isUsableOrderId(null)).toBe(false);
    expect(isUsableOrderId(undefined)).toBe(false);
    expect(isUsableOrderId('null')).toBe(false);
    expect(isUsableOrderId('undefined')).toBe(false);
    expect(isUsableOrderId('')).toBe(false);
  });

  it('accepts real ids and picks first usable candidate', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    expect(isUsableOrderId(id)).toBe(true);
    expect(requireOrderId(null, 'null', id)).toBe(id);
    expect(() => requireOrderId(null, 'null')).toThrow(/order_required/);
  });
});
