import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearPharmacySoldMarksForTests,
  collectMarksFromCartItems,
  isPharmacyMarkSoldLocally,
  rememberPharmacySoldMarks,
} from './pharmacySoldMarksStore';

describe('pharmacySoldMarksStore', () => {
  beforeEach(() => {
    clearPharmacySoldMarksForTests(1);
    clearPharmacySoldMarksForTests(7);
  });

  it('remembers sold marks and blocks rescan', () => {
    const mark = '010478001234567821AAAA';
    expect(isPharmacyMarkSoldLocally(1, mark)).toBe(false);
    rememberPharmacySoldMarks(1, [mark]);
    expect(isPharmacyMarkSoldLocally(1, mark)).toBe(true);
  });

  it('treats a different crypto tail of the same pack as already sold', () => {
    const base = '010307797292003921U=HqEW=YAVhNqy/Uasgl';
    rememberPharmacySoldMarks(1, [`${base}91EE11`]);
    expect(isPharmacyMarkSoldLocally(1, `${base}\u001d91FFFF\u001d92ZZZZ`)).toBe(true);
  });

  it('blocks the same pack after sale even if storeId type or GS separators differ', () => {
    const base = '010307797292003921U=HqEW=YAVhNqy/Uasgl';
    rememberPharmacySoldMarks(7, [`${base}91EE1192ABCDEF`]);
    expect(isPharmacyMarkSoldLocally('7', `${base}\u001d91FFFF\u001d92ZZZZ`)).toBe(true);
    expect(isPharmacyMarkSoldLocally(7, `${base}91AAAA`)).toBe(true);
  });

  it('collects a single mark when the marks array is empty', () => {
    expect(collectMarksFromCartItems([{ productMarks: [], productMark: 'km-1' }])).toEqual(['km-1']);
  });

  it('collects marks from cart lines', () => {
    expect(
      collectMarksFromCartItems([
        { productMarks: ['a', 'b'] },
        { productMark: 'c' },
      ]),
    ).toEqual(['a', 'b', 'c']);
  });
});
