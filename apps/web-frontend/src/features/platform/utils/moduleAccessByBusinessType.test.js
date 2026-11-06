import { describe, it, expect } from 'vitest';
import { isModuleVisibleForBusinessType } from './moduleAccessByBusinessType';

describe('isModuleVisibleForBusinessType', () => {
  it('pharmacy allowlist: cashier+stock+finance, hides grocery/restaurant/legacy reports', () => {
    expect(isModuleVisibleForBusinessType('restaurantPos', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('scalesStation', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('products', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('categories', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('ordersList', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('checkout', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('reportsStockDead', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('stockTransfers', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('stockReceipts', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('cashierSales', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('cashierPos', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('reportsPriceRegistry', 'PHARMACY')).toBe(true);
    expect(isModuleVisibleForBusinessType('financeDashboard', 'PHARMACY')).toBe(true);
  });

  it('shows only restaurant admin allowlist for restaurant', () => {
    expect(isModuleVisibleForBusinessType('restaurantKitchen', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantRequestBill', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantPickupLabel', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantCustomerDisplay', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantReadyDisplay', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantQuickSale', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('products', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('stockProducts', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('stockTransfers', 'RESTAURANT')).toBe(true);
    expect(isModuleVisibleForBusinessType('restaurantRequestBill', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantPickupLabel', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantCustomerDisplay', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantReadyDisplay', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantQuickSale', 'PHARMACY')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantRequestBill', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantPickupLabel', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantCustomerDisplay', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantReadyDisplay', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantQuickSale', 'CLOTHING')).toBe(false);
    expect(isModuleVisibleForBusinessType('cashierPos', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('cashierSales', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('financeDashboard', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('registersList', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('reportsSales', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('checkout', 'RESTAURANT')).toBe(false);
    expect(isModuleVisibleForBusinessType('restaurantPos', 'UNIVERSAL')).toBe(true);
  });
});
