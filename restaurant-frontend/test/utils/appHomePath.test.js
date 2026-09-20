import { describe, expect, it } from 'vitest';
import { resolveAppHomePath, isRestaurantWorldBusiness } from '../../src/utils/appHomePath';

describe('resolveAppHomePath (restaurant SPA)', () => {
  it('routes restaurant roles into /rst', () => {
    expect(resolveAppHomePath('WAITER')).toBe('/rst/pos');
    expect(resolveAppHomePath('CASHIER')).toBe('/rst/pos');
    expect(resolveAppHomePath('COOK')).toBe('/rst/kitchen');
    expect(resolveAppHomePath('ADMIN', 'RESTAURANT')).toBe('/rst/admin/dashboard');
    expect(resolveAppHomePath('MANAGER', 'CANTEEN')).toBe('/rst/admin/dashboard');
  });

  it('does not send anyone to pharmacy / finance / platform', () => {
    expect(resolveAppHomePath('ADMIN', 'PHARMACY')).toBe('/rst/pos');
    expect(resolveAppHomePath('ACCOUNTANT')).toBe('/rst/pos');
    expect(resolveAppHomePath('SUPER_ADMIN')).toBe('/rst/pos');
  });

  it('detects restaurant business types', () => {
    expect(isRestaurantWorldBusiness('RESTAURANT')).toBe(true);
    expect(isRestaurantWorldBusiness('CANTEEN')).toBe(true);
    expect(isRestaurantWorldBusiness('PHARMACY')).toBe(false);
  });
});
