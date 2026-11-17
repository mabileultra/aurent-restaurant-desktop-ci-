import { describe, expect, it } from 'vitest';
import {
  mapUsersWithCompanyAndBT,
  buildBusinessTypeList,
} from './accessRightsV2Helpers';

describe('accessRightsV2Helpers', () => {
  const t = (k) => k;

  it('mapUsersWithCompanyAndBT maps users correctly', () => {
    const rawUsers = [
      { id: 'u1', companyId: 'c1', role: 'CASHIER' },
      { id: 'u2', role: 'PLATFORM_ADMIN' },
    ];
    const companiesMap = new Map([['c1', { name: 'Acme', businessType: 'RESTAURANT' }]]);

    const result = mapUsersWithCompanyAndBT({
      rawUsers,
      companiesMap,
      effectiveBT: 'RESTAURANT',
      selectedBT: 'RESTAURANT',
      t,
    });

    expect(result).toHaveLength(1);
    expect(result[0].companyName).toBe('Acme');
    expect(result[0].businessType).toBe('RESTAURANT');
  });

  it('buildBusinessTypeList includes platform staff when allowed', () => {
    const rawBusinessTypes = [{ code: 'RESTAURANT' }];
    const statsByCode = new Map();

    const list = buildBusinessTypeList({
      rawBusinessTypes,
      canManagePlatformStaff: true,
      visitedCounts: {},
      effectiveBT: 'RESTAURANT',
      usersTotalElements: 5,
      isUnfilteredQuery: true,
      isSearching: false,
      statsByCode,
      currentLang: 'uz',
      t,
    });

    expect(list.some((bt) => bt.code === 'PLATFORM_STAFF')).toBe(true);
    expect(list.some((bt) => bt.code === 'RESTAURANT')).toBe(true);
  });
});
