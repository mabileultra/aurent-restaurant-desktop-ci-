import { describe, expect, it } from 'vitest';
import { MANAGEMENT_ROLES, STAFF_ROLES } from './useUsersPage';

describe('useUsersPage role constants', () => {
  it('includes proper management and staff roles', () => {
    expect(MANAGEMENT_ROLES).toContain('ADMIN');
    expect(MANAGEMENT_ROLES).toContain('MANAGER');
    expect(MANAGEMENT_ROLES).toContain('PLATFORM_ADMIN');
    expect(MANAGEMENT_ROLES).toContain('PLATFORM_ANALYTICS');

    expect(STAFF_ROLES).toContain('CASHIER');
    expect(STAFF_ROLES).toContain('WAITER');
    expect(STAFF_ROLES).toContain('COOK');
    expect(STAFF_ROLES).toContain('COURIER');
    expect(STAFF_ROLES).toContain('ACCOUNTANT');
  });

  it('keeps management and staff mutually exclusive', () => {
    const intersection = MANAGEMENT_ROLES.filter((role) => STAFF_ROLES.includes(role));
    expect(intersection).toEqual([]);
  });
});
