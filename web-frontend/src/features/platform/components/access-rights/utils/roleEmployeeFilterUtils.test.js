import { describe, it, expect } from 'vitest';
import { filterRoleEmployees } from './roleEmployeeFilterUtils';

describe('filterRoleEmployees', () => {
  const users = [
    { id: 1, role: 'CASHIER', fullName: 'Ali Valiyev', moduleAccessCustom: false },
    { id: 2, role: 'CASHIER', fullName: 'Vali Aliyev', moduleAccessCustom: true },
    { id: 3, role: 'ADMIN', fullName: 'Hasan H', moduleAccessCustom: false },
  ];

  it('filters users by role and computes exceptions count correctly', () => {
    const role = { code: 'CASHIER', name: 'Kassir' };
    const { allRoleUsers, totalCount, exceptionsCount } = filterRoleEmployees(users, role, 'ALL', '');

    expect(allRoleUsers).toHaveLength(2);
    expect(totalCount).toBe(2);
    expect(exceptionsCount).toBe(1);
  });

  it('filters by EXCEPTIONS', () => {
    const role = { code: 'CASHIER', name: 'Kassir' };
    const { filteredUsers } = filterRoleEmployees(users, role, 'EXCEPTIONS', '');
    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0].fullName).toBe('Vali Aliyev');
  });

  it('filters by search query', () => {
    const role = { code: 'CASHIER', name: 'Kassir' };
    const { filteredUsers } = filterRoleEmployees(users, role, 'ALL', 'ali valiyev');
    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0].id).toBe(1);
  });
});
