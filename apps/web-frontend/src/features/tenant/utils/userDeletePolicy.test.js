import { describe, expect, it } from 'vitest';
import { canDeleteUser } from './userDeletePolicy';

describe('canDeleteUser', () => {
  it('never deletes platform staff', () => {
    expect(canDeleteUser('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(false);
    expect(canDeleteUser('SUPER_ADMIN', 'PLATFORM_ADMIN')).toBe(false);
    expect(canDeleteUser('PLATFORM_ADMIN', 'SUPER_ADMIN')).toBe(false);
    expect(canDeleteUser('PLATFORM_ADMIN', 'PLATFORM_ADMIN')).toBe(false);
  });

  it('lets platform operators delete tenant staff including waiter, cook, courier', () => {
    expect(canDeleteUser('PLATFORM_ADMIN', 'ADMIN')).toBe(true);
    expect(canDeleteUser('PLATFORM_ADMIN', 'CASHIER')).toBe(true);
    expect(canDeleteUser('SUPER_ADMIN', 'MANAGER')).toBe(true);
    expect(canDeleteUser('PLATFORM_ADMIN', 'WAITER')).toBe(true);
    expect(canDeleteUser('SUPER_ADMIN', 'COOK')).toBe(true);
    expect(canDeleteUser('PLATFORM_ADMIN', 'COURIER')).toBe(true);
    expect(canDeleteUser('PLATFORM_ADMIN', 'ACCOUNTANT')).toBe(true);
  });

  it('allows company admin to delete operational staff but not managers', () => {
    expect(canDeleteUser('ADMIN', 'CASHIER')).toBe(true);
    expect(canDeleteUser('ADMIN', 'WAITER')).toBe(true);
    expect(canDeleteUser('ADMIN', 'COOK')).toBe(true);
    expect(canDeleteUser('ADMIN', 'COURIER')).toBe(true);
    expect(canDeleteUser('ADMIN', 'MANAGER')).toBe(false);
    expect(canDeleteUser('ADMIN', 'ACCOUNTANT')).toBe(false);
    expect(canDeleteUser('MANAGER', 'CASHIER')).toBe(false);
  });
});
