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
  });

  it('remembers sold marks and blocks rescan', () => {
    const mark = '010478001234567821AAAA';
    expect(isPharmacyMarkSoldLocally(1, mark)).toBe(false);
    rememberPharmacySoldMarks(1, [mark]);
    expect(isPharmacyMarkSoldLocally(1, mark)).toBe(true);
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
