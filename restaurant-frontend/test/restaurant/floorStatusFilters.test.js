import { describe, expect, it } from 'vitest';
import {
  ALL_HALLS_ID,
  collectHallTables,
  filterTablesByStatus,
  freeTablesForTransfer,
  occupiedTablesForMerge,
} from '../../src/restaurant/pos/utils/floorStatusFilters.js';

const halls = [
  {
    id: 1,
    tables: [
      { id: 10, status: 'FREE', seatCount: 4 },
      { id: 11, status: 'OCCUPIED', activeOrder: { id: 'a' }, seatCount: 4 },
    ],
  },
  {
    id: 2,
    tables: [
      { id: 20, status: 'RESERVED', seatCount: 2 },
      { id: 21, status: 'CLEANING', seatCount: 6 },
    ],
  },
];

describe('floorStatusFilters', () => {
  it('collects all halls', () => {
    expect(collectHallTables(halls, ALL_HALLS_ID)).toHaveLength(4);
    expect(collectHallTables(halls, 2)).toHaveLength(2);
  });

  it('filters by status', () => {
    const all = collectHallTables(halls, ALL_HALLS_ID);
    expect(filterTablesByStatus(all, 'FREE').map((t) => t.id)).toEqual([10]);
    expect(filterTablesByStatus(all, 'OCCUPIED').map((t) => t.id)).toEqual([11]);
    expect(filterTablesByStatus(all, 'ALL')).toHaveLength(4);
  });

  it('lists transfer and merge candidates', () => {
    expect(freeTablesForTransfer(halls, 11).map((t) => t.id)).toEqual([10, 21]);
    expect(occupiedTablesForMerge(halls, 10).map((t) => t.id)).toEqual([11]);
  });
});
