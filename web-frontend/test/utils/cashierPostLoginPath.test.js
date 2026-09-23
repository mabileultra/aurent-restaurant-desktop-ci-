import { describe, expect, it } from 'vitest';
import {
  resolveCashierPostLoginPath,
  isRestaurantCashierPath,
} from '../../src/utils/cashierPostLoginPath';

describe('resolveCashierPostLoginPath', () => {
  it('keeps waiters and cooks on /cashier (access gate denies them)', () => {
    expect(resolveCashierPostLoginPath('WAITER')).toBe('/cashier');
    expect(resolveCashierPostLoginPath('COOK')).toBe('/cashier');
  });

  it('routes cashier by business type without /rst', () => {
    expect(resolveCashierPostLoginPath('CASHIER', 'RESTAURANT')).toBe('/cashier/pos');
    expect(resolveCashierPostLoginPath('CASHIER', 'CANTEEN')).toBe('/cashier/pos');
    expect(resolveCashierPostLoginPath('CASHIER', 'PHARMACY')).toBe('/pharm/pos');
    expect(resolveCashierPostLoginPath('CASHIER', 'GROCERY')).toBe('/cashier/pos');
    expect(resolveCashierPostLoginPath('CASHIER')).toBe('/cashier/pos');
  });

  it('detects restaurant spa paths', () => {
    expect(isRestaurantCashierPath('/rst/pos')).toBe(true);
    expect(isRestaurantCashierPath('/cashier/pos')).toBe(false);
  });
});
