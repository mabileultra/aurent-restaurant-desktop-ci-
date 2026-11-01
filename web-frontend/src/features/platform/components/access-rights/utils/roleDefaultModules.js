import { isModuleVisibleForBusinessType } from '../../../utils/moduleAccessByBusinessType';

export const BUSINESS_TYPE_NAMES_UZ = {
  RESTAURANT: 'Restoran',
  PHARMACY: 'Dorixona',
  GROCERY: 'Oziq-ovqat',
  CONSTRUCTION: 'Qurilish materiallari',
  CLOTHING: 'Kiyim-kechak',
  CANTEEN: 'Oshxona / bufet',
  AUTO_PARTS: 'Avto ehtiyot qismlari',
  UNIVERSAL: 'Universal',
  OTHER: 'Boshqa',
};

export const PLATFORM_MODULE_KEYS = new Set([
  'platformCompanies',
  'platformStores',
  'platformUsers',
  'platformBusinessTypes',
  'platformReferenceBooks',
  'platformLeads',
  'platformBilling',
  'platformAnalytics',
  'platformMonitoring',
  'platformEmail',
  'platformDesktopNotifications',
]);

const ROLE_DEFAULT_MODULE_KEYS = {
  ADMIN: new Set([
    'dashboard', 'aiAssistant', 'checkout', 'products', 'categories', 'scalesStation', 'scalesPlu',
    'stockProducts', 'stockSuppliers', 'stockReceipts', 'stockInventories', 'stockTransfers',
    'ordersList', 'registersList', 'registersZReports', 'registersTransfer', 'registersConfig',
    'reportsSales', 'reportsSalesByProducts', 'reportsReturns', 'reportsSync', 'reportsAnalytics',
    'reportsStockDashboard', 'reportsStockWriteOffs', 'reportsStockLow', 'reportsStockTurnover',
    'reportsStockMovements', 'reportsStockLifecycle', 'reportsStockReceipts', 'reportsSalesByCategories',
    'reportsSalesByStores', 'reportsSalesPeriodCompare', 'reportsSalesDaily', 'reportsCashierPerformance',
    'reportsStockBalances', 'reportsStockAdjustments', 'reportsStockDead', 'reportsStockInventories',
    'reportsStockTransfers', 'stores', 'restaurantFloor', 'restaurantRequestBill', 'restaurantBooking',
    'restaurantDelivery', 'restaurantKitchen', 'usersList', 'usersPrinterSettings', 'usersBrandingSettings',
    'usersBarcodePrint', 'cashierPos', 'cashierSales', 'cashierOffline', 'restaurantPos',
    'financeDashboard', 'financeDebts', 'financeIncomes', 'financeExpenses', 'financeAccounts',
    'financeTransfers', 'financeReports', 'financeAudit', 'financeCategories', 'financeSync',
  ]),
  MANAGER: new Set([
    'dashboard', 'checkout', 'products', 'categories', 'scalesStation', 'scalesPlu',
    'stockProducts', 'stockSuppliers', 'stockReceipts', 'stockInventories', 'stockTransfers',
    'ordersList', 'registersList', 'registersZReports', 'registersTransfer', 'registersConfig',
    'reportsSales', 'reportsSalesByProducts', 'reportsReturns', 'reportsAnalytics',
    'reportsStockDashboard', 'reportsStockWriteOffs', 'reportsStockLow', 'reportsStockTurnover',
    'reportsStockMovements', 'reportsStockLifecycle', 'reportsStockReceipts', 'reportsSalesByCategories',
    'reportsSalesByStores', 'reportsSalesPeriodCompare', 'reportsSalesDaily', 'reportsStockBalances',
    'reportsStockAdjustments', 'reportsStockDead', 'reportsStockInventories', 'reportsStockTransfers',
    'restaurantFloor', 'restaurantRequestBill', 'restaurantBooking', 'restaurantDelivery',
    'restaurantKitchen', 'usersBarcodePrint', 'cashierPos', 'cashierSales', 'cashierOffline',
    'restaurantPos', 'financeDashboard', 'financeDebts', 'financeIncomes', 'financeExpenses',
    'financeAccounts', 'financeTransfers', 'financeReports', 'financeAudit',
  ]),
  CASHIER: new Set([
    'scalesStation', 'restaurantRequestBill', 'restaurantBooking', 'restaurantDelivery',
    'restaurantKitchen', 'cashierPos', 'cashierSales', 'cashierOffline', 'restaurantPos',
  ]),
  WAITER: new Set([
    'restaurantBooking', 'restaurantDelivery', 'restaurantKitchen',
    'cashierPos', 'cashierSales', 'cashierOffline', 'restaurantPos',
  ]),
  COOK: new Set(['restaurantKitchen']),
  ACCOUNTANT: new Set([
    'financeDashboard', 'financeDebts', 'financeIncomes', 'financeExpenses',
    'financeAccounts', 'financeTransfers', 'financeReports', 'financeAudit',
  ]),
};

export function getDefaultModulesForRole(roleCode, businessType) {
  const code = String(roleCode || '').toUpperCase();
  const allowedForRole = ROLE_DEFAULT_MODULE_KEYS[code] || new Set();
  const result = new Set();

  allowedForRole.forEach((modId) => {
    if (PLATFORM_MODULE_KEYS.has(modId)) return;
    if (isModuleVisibleForBusinessType(modId, businessType)) {
      result.add(modId);
    }
  });

  return result;
}
