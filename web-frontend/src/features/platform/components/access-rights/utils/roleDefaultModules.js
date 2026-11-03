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

export const BUSINESS_TYPE_NAMES_RU = {
  RESTAURANT: 'Ресторан',
  PHARMACY: 'Аптека',
  GROCERY: 'Продукты питания',
  CONSTRUCTION: 'Стройматериалы',
  CLOTHING: 'Одежда',
  CANTEEN: 'Столовая / буфет',
  AUTO_PARTS: 'Автозапчасти',
  UNIVERSAL: 'Универсальный',
  OTHER: 'Другое',
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
  'platformAccess',
]);

/**
 * Backend AdminModule.java ga 100% mos keluvchi modullar, guruhlar va standart ruxsat berilgan rollar.
 */
const MODULE_SPECS = [
  { id: 'dashboard', group: 'main', roles: ['ADMIN', 'MANAGER'] },
  { id: 'aiAssistant', group: 'main', roles: ['ADMIN'] },
  { id: 'checkout', group: 'main', roles: ['ADMIN', 'MANAGER'] },
  { id: 'products', group: 'goods', roles: ['ADMIN', 'MANAGER'] },
  { id: 'categories', group: 'goods', roles: ['ADMIN', 'MANAGER'] },
  { id: 'scalesStation', group: 'goods', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { id: 'scalesPlu', group: 'goods', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockProducts', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockSuppliers', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockReceipts', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockInventories', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockTransfers', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'ordersList', group: 'orders', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersList', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersZReports', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersTransfer', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersConfig', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSales', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesByProducts', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsReturns', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSync', group: 'reportsSales', roles: ['ADMIN'] },
  { id: 'reportsAnalytics', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockDashboard', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockWriteOffs', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockLow', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockTurnover', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockMovements', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockLifecycle', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockReceipts', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesByCategories', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesByStores', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesPeriodCompare', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesDaily', group: 'reportsSales', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsCashierPerformance', group: 'reportsSales', roles: ['ADMIN'] },
  { id: 'reportsStockBalances', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockAdjustments', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockDead', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockInventories', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockTransfers', group: 'reportsStock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stores', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersList', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersPrinterSettings', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersBrandingSettings', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersBarcodePrint', group: 'settings', roles: ['ADMIN', 'MANAGER'] },
  { id: 'restaurantFloor', group: 'restaurant', roles: ['ADMIN', 'MANAGER'] },
  { id: 'restaurantRequestBill', group: 'restaurant', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { id: 'restaurantPickupLabel', group: 'restaurant', roles: [] },
  { id: 'restaurantCustomerDisplay', group: 'restaurant', roles: [] },
  { id: 'restaurantReadyDisplay', group: 'restaurant', roles: [] },
  { id: 'restaurantQuickSale', group: 'restaurant', roles: [] },
  { id: 'restaurantBooking', group: 'restaurant', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { id: 'restaurantDelivery', group: 'restaurant', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { id: 'restaurantKitchen', group: 'restaurant', roles: ['CASHIER', 'WAITER', 'COOK', 'MANAGER', 'ADMIN'] },
  { id: 'cashierPos', group: 'cashier', roles: ['CASHIER', 'WAITER', 'ADMIN', 'MANAGER'] },
  { id: 'cashierSales', group: 'cashier', roles: ['CASHIER', 'WAITER', 'ADMIN', 'MANAGER'] },
  { id: 'cashierOffline', group: 'cashier', roles: ['CASHIER', 'WAITER', 'ADMIN', 'MANAGER'] },
  { id: 'restaurantPos', group: 'cashier', roles: ['CASHIER', 'WAITER', 'MANAGER', 'ADMIN'] },
  { id: 'financeDashboard', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeDebts', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeIncomes', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeExpenses', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeAccounts', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeTransfers', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeReports', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeAudit', group: 'finance', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { id: 'financeCategories', group: 'finance', roles: ['ADMIN'] },
  { id: 'financeSync', group: 'finance', roles: ['ADMIN'] },
];

/**
 * Backend ModuleAccessScopeResolver.java ga muvofiq rolning amaldagi doirasi (scope).
 */
export function getScopeForRole(roleCode, businessType) {
  const role = String(roleCode || '').toUpperCase();
  if (role === 'PLATFORM_ANALYTICS') {
    return new Set(['platformAnalytics']);
  }
  if (role === 'PLATFORM_ADMIN' || businessType === 'PLATFORM_STAFF') {
    return new Set(PLATFORM_MODULE_KEYS);
  }

  const isCashierScope = role === 'CASHIER' || role === 'WAITER';
  const isFinanceScope = role === 'ACCOUNTANT';

  return new Set(
    MODULE_SPECS.filter((m) => {
      if (PLATFORM_MODULE_KEYS.has(m.id)) return false;
      if (!isModuleVisibleForBusinessType(m.id, businessType)) return false;

      if (isCashierScope) return m.group === 'cashier' || m.group === 'restaurant';
      if (isFinanceScope) return m.group === 'finance';
      return m.group !== 'cashier'; // Admin, Manager, etc.
    }).map((m) => m.id)
  );
}

/**
 * Backend AdminModule.java ga muvofiq rolning standart yoqilgan modullari.
 */
export function getDefaultModulesForRole(roleCode, businessType) {
  const role = String(roleCode || '').toUpperCase();
  if (role === 'PLATFORM_ADMIN') {
    return new Set();
  }
  if (role === 'PLATFORM_ANALYTICS') {
    return new Set(['platformAnalytics']);
  }

  const scope = getScopeForRole(role, businessType);
  const result = new Set();

  MODULE_SPECS.forEach((m) => {
    if (scope.has(m.id) && m.roles.includes(role)) {
      result.add(m.id);
    }
  });

  return result;
}
