import { describe, expect, it } from 'vitest';
import { buildRoleSummaries } from './accessRightsRoleSummaryUtils';

describe('buildRoleSummaries', () => {
  it('builds role summaries for restaurant roles', () => {
    const users = [
      { id: 1, role: 'CASHIER', customAccess: false },
      { id: 2, role: 'CASHIER', customAccess: true },
      { id: 3, role: 'MANAGER', customAccess: false },
    ];
    const rawCatalog = [
      { id: 'pos_cashier', group: 'pos', nameUz: 'Kassa' },
      { id: 'pos_waiter', group: 'pos', nameUz: 'Ofitsiant' },
    ];

    const summaries = buildRoleSummaries({
      businessType: 'RESTAURANT',
      users,
      rawCatalog,
      roleDefaultsFromBackend: {},
      t: (k) => k,
    });

    expect(Array.isArray(summaries)).toBe(true);
    const cashier = summaries.find((r) => r.code === 'CASHIER');
    expect(cashier).toBeDefined();
    expect(cashier.totalEmployees).toBe(2);
    expect(cashier.exceptionCount).toBe(1);

    const manager = summaries.find((r) => r.code === 'MANAGER');
    expect(manager).toBeDefined();
    expect(manager.totalEmployees).toBe(1);
    expect(manager.exceptionCount).toBe(0);
  });

  it('handles empty users and empty catalog safely', () => {
    const summaries = buildRoleSummaries({
      businessType: 'PHARMACY',
      users: [],
      rawCatalog: [],
    });
    expect(Array.isArray(summaries)).toBe(true);
    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries[0].totalEmployees).toBe(0);
    expect(summaries[0].exceptionCount).toBe(0);
  });
});
