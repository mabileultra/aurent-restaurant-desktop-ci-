import { describe, expect, it } from 'vitest';
import { paginateList } from './korxonaPaginationUtils';

describe('korxonaPaginationUtils', () => {
  it('returns empty result when given empty or non-array input', () => {
    const res = paginateList([], 0, 10);
    expect(res.rows).toEqual([]);
    expect(res.totalCount).toBe(0);
    expect(res.from).toBe(0);
    expect(res.to).toBe(0);
    expect(res.totalPages).toBe(1);

    const nonArrayRes = paginateList(null, 0, 10);
    expect(nonArrayRes.totalCount).toBe(0);
  });

  it('paginates 12 items into 2 pages with pageSize 10', () => {
    const items = Array.from({ length: 12 }, (_, i) => `item-${i + 1}`);

    const page0 = paginateList(items, 0, 10);
    expect(page0.rows).toHaveLength(10);
    expect(page0.rows[0]).toBe('item-1');
    expect(page0.rows[9]).toBe('item-10');
    expect(page0.from).toBe(1);
    expect(page0.to).toBe(10);
    expect(page0.totalPages).toBe(2);

    const page1 = paginateList(items, 1, 10);
    expect(page1.rows).toHaveLength(2);
    expect(page1.rows[0]).toBe('item-11');
    expect(page1.rows[1]).toBe('item-12');
    expect(page1.from).toBe(11);
    expect(page1.to).toBe(12);
    expect(page1.totalPages).toBe(2);
  });

  it('clamps out of bounds page numbers safely', () => {
    const items = ['a', 'b', 'c'];
    const underflow = paginateList(items, -5, 10);
    expect(underflow.page).toBe(0);
    expect(underflow.from).toBe(1);
    expect(underflow.to).toBe(3);

    const overflow = paginateList(items, 99, 10);
    expect(overflow.page).toBe(0);
    expect(overflow.from).toBe(1);
    expect(overflow.to).toBe(3);
  });
});
