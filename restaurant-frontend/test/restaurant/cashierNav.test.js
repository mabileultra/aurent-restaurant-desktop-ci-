import { describe, expect, it } from 'vitest';
import { usesCashierPos, isCashierHallTab, CASHIER_TABS } from '../../src/restaurant/pos/cashier/utils/cashierNav';

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
});
