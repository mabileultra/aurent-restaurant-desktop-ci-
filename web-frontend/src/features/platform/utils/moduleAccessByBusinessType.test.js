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
    expect(isModuleVisibleForBusinessType('restaurantRequestBill', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantPickupLabel', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantCustomerDisplay', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantQuickSale', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantRequestBill', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantPickupLabel', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantCustomerDisplay', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantQuickSale', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantRequestBill', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantPickupLabel', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantCustomerDisplay', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantQuickSale', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('cashierPos', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('stockTransfers', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantPos', 'UNIVERSAL')).toBe(true);
  });
});
