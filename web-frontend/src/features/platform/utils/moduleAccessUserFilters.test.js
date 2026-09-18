import { describe, expect, it } from 'vitest';
import { filterModuleAccessUsers } from './moduleAccessUserFilters';
import { MODULE_ACCESS_PLATFORM_FILTER } from '../constants';

describe('filterModuleAccessUsers platform staff', () => {
  const users = [
    { userId: '1', role: 'ADMIN', companyId: 4, fullName: 'Tenant' },
    { userId: '2', role: 'PLATFORM_ADMIN', companyId: null, fullName: 'Operator' },
  ];

  it('keeps only platform operators for the platform filter', () => {
    const filtered = filterModuleAccessUsers(users, { companyId: MODULE_ACCESS_PLATFORM_FILTER });
    expect(filtered.map((row) => row.userId)).toEqual(['2']);
  });

  it('keeps operators in the all-companies list', () => {
    const filtered = filterModuleAccessUsers(users, {});
    expect(filtered.map((row) => row.userId).sort()).toEqual(['1', '2']);
  });

  it('keeps a company filter on tenant users', () => {
    const filtered = filterModuleAccessUsers(users, { companyId: 4 });
    expect(filtered.map((row) => row.userId)).toEqual(['1']);
  });
});
