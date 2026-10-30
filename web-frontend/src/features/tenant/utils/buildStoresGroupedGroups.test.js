import { describe, expect, it } from 'vitest';
import { buildStoresGroupedGroups } from './buildStoresGroupedGroups';

describe('buildStoresGroupedGroups', () => {
  it('uses API counts when branches are not loaded yet', () => {
    const groups = buildStoresGroupedGroups(
      [{ companyId: 1, companyName: 'EVOS', storeCount: 5, activeStoreCount: 3 }],
      {},
      'ALL'
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].total).toBe(5);
    expect(groups[0].active).toBe(3);
    expect(groups[0].stores).toEqual([]);
    expect(groups[0].branchesLoaded).toBe(false);
  });

  it('uses loaded branches once accordion fetched them', () => {
    const groups = buildStoresGroupedGroups(
      [{ companyId: 1, companyName: 'EVOS', storeCount: 5, activeStoreCount: 3 }],
      {
        1: [
          { id: 10, active: true, name: 'A' },
          { id: 11, active: false, name: 'B' },
        ],
      },
      'ALL'
    );
    expect(groups[0].branchesLoaded).toBe(true);
    expect(groups[0].total).toBe(2);
    expect(groups[0].active).toBe(1);
    expect(groups[0].inactive).toBe(1);
    expect(groups[0].stores).toHaveLength(2);
  });
});
