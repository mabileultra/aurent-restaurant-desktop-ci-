import { describe, expect, it } from 'vitest';
import { usesCashierPos, isCashierHallTab, CASHIER_TABS } from '../../src/restaurant/pos/cashier/utils/cashierNav';
import { CASHIER_TAB_ICONS } from '../../src/restaurant/pos/cashier/config/cashierNavIcons';

describe('cashierNav', () => {
  it('routes cashier/admin/manager to cashier shell', () => {
    expect(usesCashierPos('CASHIER')).toBe(true);
    expect(usesCashierPos('ADMIN')).toBe(true);
    expect(usesCashierPos('MANAGER')).toBe(true);
    expect(usesCashierPos('WAITER')).toBe(false);
    expect(usesCashierPos('COOK')).toBe(false);
  });

  it('has hall as default workspace tab', () => {
    expect(CASHIER_TABS[0].key).toBe('hall');
    expect(isCashierHallTab('hall')).toBe(true);
    expect(isCashierHallTab('sales')).toBe(false);
  });

  it('menu offers discount with an icon and the shared discount label', () => {
    const discount = CASHIER_TABS.find((row) => row.key === 'discount');
    expect(discount).toBeTruthy();
    expect(discount.labelKey).toBe('rst.order.discount');
    expect(CASHIER_TAB_ICONS.discount).toBeTruthy();
  });

  it('every menu entry has an icon and a unique key', () => {
    const keys = CASHIER_TABS.map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(CASHIER_TAB_ICONS[key], key).toBeTruthy();
    }
  });
});
