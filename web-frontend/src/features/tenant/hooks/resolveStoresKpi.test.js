import { describe, expect, it } from 'vitest';
import { resolveStoresKpi } from './resolveStoresKpi';

describe('resolveStoresKpi', () => {
  it('uses stats directly when no districtCode or inactive status is filtered', () => {
    const res = resolveStoresKpi({
      stats: { totalStores: 114, activeStores: 113, inactiveStores: 1, companiesCount: 65 },
      total: 114,
      rawRows: [],
      statusFilter: 'ALL',
    });
    expect(res).toEqual({
      totalStores: 114,
      activeStores: 113,
      inactiveStores: 1,
      companiesCount: 65,
    });
  });

  it('reconciles total and companies count when districtCode is filtered', () => {
    const res = resolveStoresKpi({
      stats: { totalStores: 48, activeStores: 48, inactiveStores: 0, companiesCount: 63 },
      total: 33,
      rawRows: [
        { id: 1, companyId: 10, active: true },
        { id: 2, companyId: 10, active: true },
        { id: 3, companyId: 11, active: true },
      ],
      statusFilter: 'ALL',
      districtCode: 'SAM_SH',
    });
    expect(res.totalStores).toBe(33);
    expect(res.companiesCount).toBe(2);
  });

  it('correctly sets inactiveStores = total when statusFilter is INACTIVE', () => {
    const res = resolveStoresKpi({
      stats: { totalStores: 114, activeStores: 113, inactiveStores: 1, companiesCount: 65 },
      total: 1,
      rawRows: [{ id: 99, companyId: 20, active: false }],
      statusFilter: 'INACTIVE',
    });
    expect(res.totalStores).toBe(1);
    expect(res.inactiveStores).toBe(1);
    expect(res.activeStores).toBe(113);
  });

  it('returns companiesCount = 1 when resolvedCompanyId is provided and total > 0', () => {
    const res = resolveStoresKpi({
      stats: null,
      total: 5,
      rawRows: [{ id: 1, companyId: 10, active: true }],
      statusFilter: 'ALL',
      resolvedCompanyId: 10,
    });
    expect(res.companiesCount).toBe(1);
  });
});
