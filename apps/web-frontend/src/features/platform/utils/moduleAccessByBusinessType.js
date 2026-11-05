/**
 * Какие модули суперадмин видит при выборе типа бизнеса.
 * UNIVERSAL / OTHER — полный список.
 * RESTAURANT / CANTEEN — только ресторанная админка (handbook), без retail POS.
 * PHARMACY — allowlist аптечного SPA (касса + склад + отчёты + финансы).
 */
const RESTAURANT_MODULE_IDS = new Set([
  'restaurantFloor',
  'restaurantBooking',
  'restaurantDelivery',
  'restaurantKitchen',
  'restaurantPos',
  'restaurantRequestBill',
  'restaurantPickupLabel',
  'restaurantCustomerDisplay',
  'restaurantReadyDisplay',
  'restaurantQuickSale',
]);

/** Mirrors shared-kernel ModuleVisibility.RESTAURANT_ADMIN_VISIBLE */
const RESTAURANT_ADMIN_VISIBLE = new Set([
  'dashboard',
  'products',
  'categories',
  'stockProducts',
  'stockSuppliers',
  'stockReceipts',
  'stockInventories',
  'stockTransfers',
  'reportsStockLow',
  'stores',
  'usersList',
  'usersPrinterSettings',
  ...RESTAURANT_MODULE_IDS,
]);

/** Mirrors shared-kernel ModuleVisibility.PHARMACY_VISIBLE */
const PHARMACY_VISIBLE = new Set([
  'dashboard',
  'aiAssistant',
  'stockProducts',
  'stockSuppliers',
  'stockReceipts',
  'stockInventories',
  'stockTransfers',
  'cashierPos',
  'cashierSales',
  'cashierOffline',
  'registersList',
  'registersZReports',
  'registersTransfer',
  'registersConfig',
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
  'financeDashboard',
  'financeDebts',
  'financeIncomes',
  'financeExpenses',
  'financeAccounts',
  'financeTransfers',
  'financeReports',
  'financeAudit',
  'financeCategories',
  'financeSync',
  'stores',
  'usersList',
  'usersPrinterSettings',
  'usersBrandingSettings',
  'usersBarcodePrint',
]);

const RESTAURANT_BUSINESS_TYPES = new Set(['RESTAURANT', 'CANTEEN']);

export function normalizeBusinessTypeCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw || raw === 'RETAIL') return 'UNIVERSAL';
  return raw;
}

export function companyHasBusinessType(company, typeCode) {
  if (!typeCode) return true;
  if (!company) return false;
  const wanted = normalizeBusinessTypeCode(typeCode);
  const primary = normalizeBusinessTypeCode(company.businessType);
  if (primary === wanted) return true;
  const list = company.businessTypeCodes || company.businessTypes || [];
  if (Array.isArray(list)) {
    return list.some((item) => {
      const code = typeof item === 'string' ? item : item?.code;
      return normalizeBusinessTypeCode(code) === wanted;
    });
  }
  return false;
}

export function isModuleVisibleForBusinessType(moduleId, businessTypeCode) {
  const type = normalizeBusinessTypeCode(businessTypeCode);
  const id = String(moduleId || '');
  if (!type || type === 'UNIVERSAL' || type === 'OTHER') return true;

  if (type === 'PHARMACY') {
    return PHARMACY_VISIBLE.has(id);
  }
  if (RESTAURANT_BUSINESS_TYPES.has(type)) {
    return RESTAURANT_ADMIN_VISIBLE.has(id);
  }
  return !RESTAURANT_MODULE_IDS.has(id);
}

export function filterModulesForBusinessType(modules, businessTypeCode) {
  if (!Array.isArray(modules)) return [];
  return modules.filter((row) => isModuleVisibleForBusinessType(row?.id, businessTypeCode));
}
