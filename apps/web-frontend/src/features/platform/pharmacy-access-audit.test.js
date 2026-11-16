import { describe, it, expect } from 'vitest';
import { getScopeForRole, getDefaultModulesForRole } from './components/access-rights/utils/roleDefaultModules.js';
import { isModuleVisibleForBusinessType } from './utils/moduleAccessByBusinessType.js';

/** Keys that pharmacy SPA actually gates (nav + POS offline/sales). */
const PHARMACY_SPA_KEYS = [
  'dashboard',
  'aiAssistant',
  'stockProducts',
  'stockReceipts',
  'stockInventories',
  'stockTransfers',
  'stockSuppliers',
  'reportsSalesDaily',
  'reportsSalesByProducts',
  'reportsSalesByStores',
  'reportsCashierPerformance',
  'reportsReturns',
  'reportsStockBalances',
  'reportsStockLow',
  'reportsStockReceipts',
  'reportsStockInventories',
  'reportsStockTransfers',
  'reportsPriceRegistry',
  'reportsDrugRegistry',
  'financeDashboard',
  'financeIncomes',
  'financeDebts',
  'financeExpenses',
  'financeAccounts',
  'financeTransfers',
  'financeReports',
  'financeAudit',
  'financeCategories',
  'financeSync',
  'registersList',
  'registersZReports',
  'registersTransfer',
  'registersConfig',
  'usersList',
  'usersPrinterSettings',
  'usersBrandingSettings',
  'usersBarcodePrint',
  'stores',
  'cashierPos',
  'cashierSales',
  'cashierOffline',
];

const JUNK = [
  'products',
  'categories',
  'scalesStation',
  'scalesPlu',
  'ordersList',
  'checkout',
  'restaurantFloor',
  'restaurantPos',
  'restaurantKitchen',
  'reportsStockDead',
  'reportsSales',
  'reportsAnalytics',
];

describe('pharmacy access matrix', () => {
  it('allowlist covers every SPA key and hides grocery/restaurant junk', () => {
    expect(PHARMACY_SPA_KEYS.filter((id) => !isModuleVisibleForBusinessType(id, 'PHARMACY'))).toEqual([]);
    expect(JUNK.filter((id) => isModuleVisibleForBusinessType(id, 'PHARMACY'))).toEqual([]);
  });

  it('ADMIN scope equals SPA keys', () => {
    const scope = [...getScopeForRole('ADMIN', 'PHARMACY')].sort();
    expect(scope).toEqual([...PHARMACY_SPA_KEYS].sort());
  });

  it('role scopes and defaults are correct for pharmacy', () => {
    const admin = getDefaultModulesForRole('ADMIN', 'PHARMACY');
    const manager = getDefaultModulesForRole('MANAGER', 'PHARMACY');
    const cashier = getDefaultModulesForRole('CASHIER', 'PHARMACY');
    const accountant = getDefaultModulesForRole('ACCOUNTANT', 'PHARMACY');

    expect(getScopeForRole('CASHIER', 'PHARMACY').size).toBe(3);
    expect([...cashier].sort()).toEqual(['cashierOffline', 'cashierPos', 'cashierSales']);

    expect(getScopeForRole('ACCOUNTANT', 'PHARMACY').size).toBe(10);
    expect(accountant.has('financeDashboard')).toBe(true);
    expect(accountant.has('cashierPos')).toBe(false);

    expect(admin.has('cashierPos')).toBe(true);
    expect(admin.has('reportsDrugRegistry')).toBe(true);
    expect(admin.has('stores')).toBe(true);
    expect(manager.has('stores')).toBe(false);
    expect(manager.has('usersList')).toBe(false);
    expect(manager.has('cashierPos')).toBe(true);
    expect(manager.has('reportsCashierPerformance')).toBe(false);
  });
});
