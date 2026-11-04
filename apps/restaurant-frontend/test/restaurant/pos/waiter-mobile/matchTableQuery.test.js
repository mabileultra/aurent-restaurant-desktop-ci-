import { describe, expect, it } from 'vitest';
import { matchTableQuery } from '../../../../src/restaurant/pos/waiter-mobile/utils/matchTableQuery';

describe('matchTableQuery', () => {
  const waiterNameById = new Map([['u1', 'Ali']]);

  it('matches empty query', () => {
    expect(matchTableQuery({ code: 'T1' }, '', waiterNameById)).toBe(true);
    expect(matchTableQuery({ code: 'T1' }, null, waiterNameById)).toBe(true);
  });

  it('matches code and waiter', () => {
    const table = {
      code: 'A12',
      label: 'Window',
      activeOrder: { waiterUserId: 'u1' },
    };
    expect(matchTableQuery(table, 'a12', waiterNameById)).toBe(true);
    expect(matchTableQuery(table, 'ali', waiterNameById)).toBe(true);
    expect(matchTableQuery(table, 'zzz', waiterNameById)).toBe(false);
  });
});
