import { describe, expect, it } from 'vitest';
import { canDeleteUser } from './userDeletePolicy';

describe('canDeleteUser', () => {
  it('never deletes platform staff', () => {
    expect(canDeleteUser('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(false);
    expect(canDeleteUser('SUPER_ADMIN', 'PLATFORM_ADMIN')).toBe(false);
    expect(canDeleteUser('PLATFORM_ADMIN', 'SUPER_ADMIN')).toBe(false);
    expect(canDeleteUser('PLATFORM_ADMIN', 'PLATFORM_ADMIN')).toBe(false);
  });

  it('lets platform operators delete tenant staff', () => {
    expect(canDeleteUser('PLATFORM_ADMIN', 'ADMIN')).toBe(true);
    expect(canDeleteUser('PLATFORM_ADMIN', 'CASHIER')).toBe(true);
    expect(canDeleteUser('SUPER_ADMIN', 'MANAGER')).toBe(true);
    expect(canDeleteUser('PLATFORM_ADMIN', 'WAITER')).toBe(false);
  });

  it('keeps company admin limited to cashiers', () => {
    expect(canDeleteUser('ADMIN', 'CASHIER')).toBe(true);
    expect(canDeleteUser('ADMIN', 'MANAGER')).toBe(false);
    expect(canDeleteUser('MANAGER', 'CASHIER')).toBe(false);
  });
});
