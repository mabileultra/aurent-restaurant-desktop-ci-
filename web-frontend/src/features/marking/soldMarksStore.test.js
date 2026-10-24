import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearSoldMarks,
  collectMarksFromCartItems,
  isMarkSoldLocally,
  rememberSoldMarks,
} from './soldMarksStore';

describe('soldMarksStore', () => {
  beforeEach(() => {
    clearSoldMarks(1);
    clearSoldMarks(7);
  });

  it('remembers sold marks and blocks rescan', () => {
    const mark = '010478001234567821AAAA';
    expect(isMarkSoldLocally(1, mark)).toBe(false);
    rememberSoldMarks(1, [mark]);
    expect(isMarkSoldLocally(1, mark)).toBe(true);
  });

  it('treats a different crypto tail of the same pack as already sold', () => {
    const base = '010307797292003921U=HqEW=YAVhNqy/Uasgl';
    rememberSoldMarks(1, [`${base}91EE11`]);
    expect(isMarkSoldLocally(1, `${base}\u001d91FFFF\u001d92ZZZZ`)).toBe(true);
  });

  it('blocks the same pack after sale even if storeId type or GS separators differ', () => {
    const base = '010307797292003921U=HqEW=YAVhNqy/Uasgl';
    rememberSoldMarks(7, [`${base}91EE1192ABCDEF`]);
    expect(isMarkSoldLocally('7', `${base}\u001d91FFFF\u001d92ZZZZ`)).toBe(true);
    expect(isMarkSoldLocally(7, `${base}91AAAA`)).toBe(true);
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
