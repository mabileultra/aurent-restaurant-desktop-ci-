import { describe, it, expect } from 'vitest';
import { isModuleVisibleForBusinessType } from './moduleAccessByBusinessType';

describe('isModuleVisibleForBusinessType', () => {
  it('hides restaurant and grocery catalog for pharmacy, keeps stock transfers', () => {
    expect(isModuleVisibleForBusinessType('restaurantPos', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('scalesStation', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('products', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('stockTransfers', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('stockReceipts', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('cashierSales', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('cashierPos', 'PHARMACY')).toBe(true);
  });

  it('shows restaurant modules only for restaurant, not grocery POS', () => {
    expect(isModuleVisibleForBusinessType('restaurantKitchen', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('cashierPos', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('stockTransfers', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantPos', 'UNIVERSAL')).toBe(true);
  });
});
