import { describe, expect, it } from 'vitest';
import { cashierStoreSet, toStoreIdSet } from './userFormModalUtils';

describe('userFormModalUtils', () => {
  describe('toStoreIdSet', () => {
    it('handles numeric and string arrays', () => {
      const set = toStoreIdSet([1, '2', '3', 'invalid']);
      expect(Array.from(set)).toEqual([1, 2, 3]);
    });

    it('handles array of store objects with .id property', () => {
      const set = toStoreIdSet([
        { id: 10, name: 'Comfort 1' },
        { id: 25, name: 'Comfort 2' },
      ]);
      expect(Array.from(set)).toEqual([10, 25]);
    });

    it('handles single number or string input', () => {
      expect(Array.from(toStoreIdSet(42))).toEqual([42]);
      expect(Array.from(toStoreIdSet('99'))).toEqual([99]);
    });

    it('handles null and undefined gracefully', () => {
      expect(Array.from(toStoreIdSet(null))).toEqual([]);
      expect(Array.from(toStoreIdSet(undefined))).toEqual([]);
    });
  });

  describe('cashierStoreSet', () => {
    it('restricts multi-store selection to at most one store for cashiers', () => {
      const result = cashierStoreSet([10, 20, 30]);
      expect(Array.from(result)).toEqual([10]);
    });

    it('handles empty input', () => {
      expect(Array.from(cashierStoreSet([]))).toEqual([]);
    });
  });
});
