import { describe, expect, it } from 'vitest';
import { resolveAppHomePath } from '../../src/utils/appHomePath';

describe('resolveAppHomePath', () => {
  it('sends both platform roles to super-admin shell', () => {
    expect(resolveAppHomePath('SUPER_ADMIN')).toBe('/platform');
    expect(resolveAppHomePath('PLATFORM_ADMIN')).toBe('/platform');
    expect(resolveAppHomePath('PLATFORM_ADMIN', 'PHARMACY')).toBe('/platform');
  });

  it('does not send tenant roles to platform', () => {
    expect(resolveAppHomePath('ADMIN')).toBe('/dashboard');
    expect(resolveAppHomePath('MANAGER')).toBe('/dashboard');
    expect(resolveAppHomePath('CASHIER')).toBe('/cashier/pos');
  });

  it('routes restaurant world cashiers and staff to /rst', () => {
    expect(resolveAppHomePath('CASHIER', 'RESTAURANT')).toBe('/rst/pos');
    expect(resolveAppHomePath('CASHIER', 'CANTEEN')).toBe('/rst/pos');
    expect(resolveAppHomePath('WAITER')).toBe('/rst/pos');
    expect(resolveAppHomePath('COOK')).toBe('/rst/kitchen');
    expect(resolveAppHomePath('ADMIN', 'RESTAURANT')).toBe('/rst/admin/dashboard');
  });
});
