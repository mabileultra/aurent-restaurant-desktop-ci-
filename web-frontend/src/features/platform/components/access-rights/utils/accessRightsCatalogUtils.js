import { isModuleVisibleForBusinessType } from '../../../utils/moduleAccessByBusinessType';
import { PLATFORM_MODULE_KEYS } from './roleDefaultModules';

export const GROUP_TITLES_UZ = {
  platform: 'Super-admin',
  main: 'Asosiy',
  goods: 'Tovarlar',
  products: 'Tovarlar',
  stock: 'Ombor',
  orders: 'Buyurtmalar',
  finance: 'Moliya',
  registers: 'Kassalar',
  reportsSales: 'Hisobotlar — sotuv',
  reportsStock: 'Hisobotlar — ombor',
  reports: 'Hisobotlar',
  restaurant: 'Restoran',
  settings: 'Sozlamalar',
  cashier: 'Kassa oynasi',
};

export const ROLE_LABELS_UZ = {
  ADMIN: 'Admin',
  MANAGER: 'Menejer',
  CASHIER: 'Kassir',
  WAITER: 'Ofitsiant',
  COURIER: 'Kuryer',
  COOK: 'Oshpaz',
  ACCOUNTANT: 'Buxgalter',
};

export const MODULE_NAMES_UZ = {
  dashboard: 'Boshqaruv paneli',
  aiAssistant: 'AI-assistent',
  checkout: 'To‘lov oynasi',
  products: 'Tovarlar katalogi',
  categories: 'Kategoriyalar',
  scalesStation: 'Tarozi stansiyasi',
  scalesPlu: 'PLU kodlari',
  stockProducts: 'Ombor — tovarlar',
  stockSuppliers: 'Yetkazib beruvchilar',
  stockReceipts: 'Kirim (hujjat)',
  stockInventories: 'Inventarizatsiya',
  stockTransfers: 'Ko‘chirish',
  ordersList: 'Buyurtmalar ro‘yxati',
  registersList: 'Kassalar ro‘yxati',
  registersZReports: 'Z-hisobotlar',
  registersTransfer: 'Kassa topshirig‘i',
  registersConfig: 'Kassa sozlamalari',
  reportsSales: 'Sotuvlar jurnali',
  reportsSalesByProducts: 'Tovarlar bo‘yicha sotuv',
  reportsReturns: 'Qaytarishlar',
  reportsSync: 'Sinxronizatsiya hisoboti',
  reportsAnalytics: 'Sotuv analitikasi',
  reportsStockDashboard: 'Ombor — xulosa',
  reportsStockWriteOffs: 'Hisobdan chiqarish',
  reportsStockLow: 'Kam qolgan tovarlar',
  reportsStockTurnover: 'Aylanma qaydnoma',
  reportsStockMovements: 'Harakatlar jurnali',
  reportsStockLifecycle: 'Tovar hayot tsikli',
  reportsStockReceipts: 'Kirimlar hisoboti',
  reportsSalesByCategories: 'Kategoriyalar bo‘yicha',
  reportsSalesByStores: 'Do‘konlar bo‘yicha sotuv',
  reportsSalesPeriodCompare: 'Davrlarni solishtirish',
  reportsSalesDaily: 'Kunlik xulosa',
  reportsCashierPerformance: 'Kassirlar samaradorligi',
  reportsStockBalances: 'Ombor qoldiqlari',
  reportsStockAdjustments: 'Qoldiq tuzatishlar',
  reportsStockDead: 'Sotilmagan tovarlar',
  reportsStockInventories: 'Inventarizatsiya hisoboti',
  reportsStockTransfers: 'Ko‘chirishlar hisoboti',
  stores: 'Do‘konlar va filiallar',
  restaurantFloor: 'Zal va stollar',
  restaurantRequestBill: 'Hisob berish',
  restaurantPickupLabel: 'Berish etiketi',
  restaurantCustomerDisplay: 'Xaridor ekrani',
  restaurantQuickSale: 'Tezkor chek',
  restaurantBooking: 'Bronlash',
  restaurantDelivery: 'Yetkazib berish',
  restaurantKitchen: 'Oshxona (KDS)',
  usersList: 'Xodimlar ro‘yxati',
  usersPrinterSettings: 'Printer sozlamalari',
  usersBrandingSettings: 'Brending sozlamalari',
  usersBarcodePrint: 'Yorliq chop etish',
  cashierPos: 'Kassa — sotuv',
  cashierSales: 'Kassa — cheklarim',
  cashierOffline: 'Kassa — oflayn rejim',
  restaurantPos: 'Restoran — kassa',
  financeDashboard: 'Moliya — boshqaruv paneli',
  financeDebts: 'Moliya — qarzlar',
  financeIncomes: 'Moliya — tushumlar',
  financeExpenses: 'Moliya — xarajatlar',
  financeAccounts: 'Moliya — kassalar va hisoblar',
  financeTransfers: 'Moliya — o‘tkazmalar',
  financeReports: 'Moliya — hisobotlar',
  financeAudit: 'Moliya — audit jurnali',
  financeCategories: 'Moliya — moddalar',
  financeSync: 'Moliya — sinxronizatsiya',
};

export function buildCatalogGroups(rawCatalog = [], businessType = 'RESTAURANT') {
  const map = new Map();

  rawCatalog.forEach((item) => {
    if (PLATFORM_MODULE_KEYS.has(item.id)) return;
    if (!isModuleVisibleForBusinessType(item.id, businessType)) return;

    const groupId = item.group || 'main';
    if (!map.has(groupId)) {
      map.set(groupId, {
        id: groupId,
        title: GROUP_TITLES_UZ[groupId] || groupId,
        modules: [],
      });
    }
    map.get(groupId).modules.push({
      id: item.id,
      name: MODULE_NAMES_UZ[item.id] || item.name || item.id,
    });
  });

  return Array.from(map.values()).filter((g) => g.modules.length > 0);
}

export function buildCatalogMap(rawCatalog = []) {
  const map = {};
  rawCatalog.forEach((item) => {
    map[item.id] = {
      id: item.id,
      name: MODULE_NAMES_UZ[item.id] || item.name || item.id,
      group: item.group || 'main',
    };
  });
  return map;
}

export function resolveModuleName(moduleId, catalogMap = {}) {
  return MODULE_NAMES_UZ[moduleId] || catalogMap[moduleId]?.name || moduleId;
}
