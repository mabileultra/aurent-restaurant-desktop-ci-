import { describe, expect, it } from 'vitest';
import { resolveOrderHallName } from '../../../../src/restaurant/pos/utils/floorPosDerivations';

const halls = [
  { id: 1, name: 'Основной зал', tables: [{ id: 10, code: '1' }, { id: 11, code: '2' }] },
  { id: 2, name: 'Терраса', tables: [{ id: 20, code: '1' }] },
];

describe('resolveOrderHallName (cashier table tile)', () => {
  it('tells apart tables with the same number in different halls', () => {
    expect(resolveOrderHallName(halls, { tableId: 10 })).toBe('Основной зал');
    expect(resolveOrderHallName(halls, { tableId: 20 })).toBe('Терраса');
  });

  it('matches string and number ids', () => {
    expect(resolveOrderHallName(halls, { tableId: '20' })).toBe('Терраса');
  });

  it('falls back to the provided hall name when the table is unknown', () => {
    expect(resolveOrderHallName(halls, { tableId: 99 }, 'VIP')).toBe('VIP');
    expect(resolveOrderHallName(halls, { tableId: 99 })).toBeNull();
    expect(resolveOrderHallName([], { tableId: 10 }, undefined)).toBeNull();
  });
});
