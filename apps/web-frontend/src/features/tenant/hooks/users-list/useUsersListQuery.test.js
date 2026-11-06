import { describe, expect, it } from 'vitest';
import { normalizeUsersPage } from './useUsersListQuery';

describe('normalizeUsersPage', () => {
  it('returns EMPTY_PAGE when data is null or undefined', () => {
    const resNull = normalizeUsersPage(null);
    expect(resNull.content).toEqual([]);
    expect(resNull.totalElements).toBe(0);
    expect(resNull.totalUsers).toBe(0);

    const resUndefined = normalizeUsersPage(undefined);
    expect(resUndefined.content).toEqual([]);
    expect(resUndefined.totalElements).toBe(0);
  });

  it('normalizes array response into page structure with derived stats', () => {
    const rawArray = [
      { id: 1, role: 'ADMIN', active: true },
      { id: 2, role: 'CASHIER', active: true },
      { id: 3, role: 'WAITER', active: false },
    ];

    const page = normalizeUsersPage(rawArray);

    expect(page.content).toHaveLength(3);
    expect(page.totalElements).toBe(3);
    expect(page.totalUsers).toBe(3);
    expect(page.activeUsers).toBe(2);
    expect(page.inactiveUsers).toBe(1);
    expect(page.adminUsers).toBe(1);
    expect(page.staffUsers).toBe(2);
  });

  it('preserves existing server stats when provided on page object', () => {
    const serverPage = {
      content: [{ id: 1, role: 'ADMIN', active: true }],
      totalElements: 50,
      totalPages: 3,
      number: 0,
      totalUsers: 50,
      activeUsers: 45,
      inactiveUsers: 5,
      adminUsers: 10,
      staffUsers: 40,
    };

    const page = normalizeUsersPage(serverPage);

    expect(page.totalUsers).toBe(50);
    expect(page.activeUsers).toBe(45);
    expect(page.inactiveUsers).toBe(5);
    expect(page.adminUsers).toBe(10);
    expect(page.staffUsers).toBe(40);
  });

  it('derives fallback stats when page object lacks custom stat fields', () => {
    const rawPageWithoutStats = {
      content: [
        { id: 1, role: 'ADMIN', active: true },
        { id: 2, role: 'CASHIER', active: false },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
    };

    const page = normalizeUsersPage(rawPageWithoutStats);

    expect(page.totalUsers).toBe(2);
    expect(page.activeUsers).toBe(1);
    expect(page.inactiveUsers).toBe(1);
    expect(page.adminUsers).toBe(1);
    expect(page.staffUsers).toBe(1);
  });
});
