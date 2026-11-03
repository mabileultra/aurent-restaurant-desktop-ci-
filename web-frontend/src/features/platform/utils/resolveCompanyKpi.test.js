import { describe, expect, it } from 'vitest';
import { resolveCompanyKpi } from './resolveCompanyKpi';

describe('resolveCompanyKpi', () => {
  it('correctly calculates KPIs when searching (e.g. 9 active companies matching "market")', () => {
    const rawRows = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      name: `Market ${i + 1}`,
      active: true,
      storeCount: 2,
    }));

    const result = resolveCompanyKpi({
      total: 9,
      rawRows,
      statusFilter: 'ALL',
      isFiltered: true,
      storeCountData: 150,
    });

    expect(result.totalCompanies).toBe(9);
    expect(result.activeCompanies).toBe(9);
    expect(result.inactiveCompanies).toBe(0);
    // When filtered, store count is derived from matching companies
    expect(result.totalStores).toBe(18);
  });

  it('correctly calculates KPIs for unfiltered multi-page dataset', () => {
    const rawRows = [
      { id: 1, active: true, storeCount: 5 },
      { id: 2, active: false, storeCount: 1 },
    ];

    const result = resolveCompanyKpi({
      total: 109,
      rawRows,
      statusFilter: 'ALL',
      isFiltered: false,
      storeCountData: 150,
    });

    expect(result.totalCompanies).toBe(109);
    expect(result.inactiveCompanies).toBe(1);
    expect(result.activeCompanies).toBe(108);
    expect(result.totalStores).toBe(150);
  });

  it('correctly calculates KPIs when knownInactiveCount is provided on INACTIVE tab', () => {
    const result = resolveCompanyKpi({
      total: 116,
      rawRows: [{ id: 10, active: false, storeCount: 1 }],
      statusFilter: 'INACTIVE',
      isFiltered: false,
      storeCountData: 150,
      knownInactiveCount: 1,
    });

    expect(result.totalCompanies).toBe(116);
    expect(result.inactiveCompanies).toBe(1);
    expect(result.activeCompanies).toBe(115);
  });

  it('returns null for totalStores when storeCountData is null and not filtered to avoid flicker', () => {
    const result = resolveCompanyKpi({
      total: 114,
      rawRows: Array.from({ length: 14 }, (_, i) => ({ id: i + 1, active: true, storeCount: 1 })),
      statusFilter: 'ALL',
      isFiltered: false,
      storeCountData: null,
    });

    expect(result.totalStores).toBeNull();
  });
});
