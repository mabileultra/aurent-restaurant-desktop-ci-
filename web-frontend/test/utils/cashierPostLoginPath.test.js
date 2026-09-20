import { describe, expect, it } from 'vitest';
import {
  resolveCashierPostLoginPath,
  isRestaurantCashierPath,
} from '../../src/utils/cashierPostLoginPath';

describe('resolveCashierPostLoginPath', () => {
  it('sends waiters and cooks to restaurant floor/kitchen', () => {
    expect(resolveCashierPostLoginPath('WAITER')).toBe('/rst/pos');
    expect(resolveCashierPostLoginPath('COOK')).toBe('/rst/kitchen');
  });

  it('routes cashier by business type', () => {
    expect(resolveCashierPostLoginPath('CASHIER', 'RESTAURANT')).toBe('/rst/pos');
    expect(resolveCashierPostLoginPath('CASHIER', 'CANTEEN')).toBe('/rst/pos');
    expect(resolveCashierPostLoginPath('CASHIER', 'PHARMACY')).toBe('/pharm/pos');
    expect(resolveCashierPostLoginPath('CASHIER', 'GROCERY')).toBe('/cashier/pos');
    expect(resolveCashierPostLoginPath('CASHIER')).toBe('/cashier/pos');
  });

  it('detects restaurant spa paths', () => {
    expect(isRestaurantCashierPath('/rst/pos')).toBe(true);
    expect(isRestaurantCashierPath('/cashier/pos')).toBe(false);
  });
});
