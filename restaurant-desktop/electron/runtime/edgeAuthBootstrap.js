/**
 * Facade for edge online bootstrap + live sync.
 * Heavy steps live in sibling modules — keep this file under ~250 lines.
 */
const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');
const {
  rememberLiveCloudSession,
  getLiveCloudSession,
  refreshLiveFromCloud,
  pushLiveToCloud,
} = require('./edgeLiveSync');
const {
  bootstrapStoresFromCloud,
  resolveRestaurantStoreIds,
} = require('./edgeBootstrapStores');
const { bootstrapCatalogFromCloud } = require('./edgeBootstrapCatalog');
const { bootstrapStockFromCloud } = require('./edgeBootstrapStock');
const {
  bootstrapCategoriesFromCloud,
  bootstrapCashRegistersFromCloud,
} = require('./edgeBootstrapAdmin');
const { bootstrapSuppliersFromCloud } = require('./edgeBootstrapSuppliers');
const {
  fetchCloudPinRoster,
  ensureStaffViaCloudPin,
} = require('./edgeBootstrapPin');

async function getLocalAuthStatus() {
  const { data } = await requestJson(`${localBase()}/edge/auth/status`);
  return data;
}

async function getLocalBootstrapStatus() {
  const auth = await getLocalAuthStatus().catch(() => ({ hasStaff: false }));
  let catalog = { hasCatalog: false, hasStock: false };
  try {
    const { data } = await requestJson(`${localBase()}/edge/bootstrap/status`);
    catalog = data || catalog;
  } catch {
    /* ignore */
  }
  return { ...auth, ...catalog };
}

/**
 * One-time online bootstrap: cloud login → staff → stores → catalog/stock/admin.
 */
async function bootstrapStaffFromCloud({
  username,
  password,
  bootstrapSecret: secretIn,
  storeId: preferredStoreId,
} = {}) {
  if (!username || !password) {
    throw new Error('username and password required');
  }
  const cloud = cloudBase();
  let login;
  try {
    login = await requestJson(`${cloud}/auth/login`, {
      method: 'POST',
      body: { username, password },
    });
  } catch (err) {
    const detail = err.status
      ? `HTTP ${err.status}${err.data?.message ? `: ${err.data.message}` : ''}`
      : (err.message || err);
    throw new Error(
      `Облако недоступно или неверный логин (${cloud}/auth/login): ${detail}. `
      + 'Нужны логин/пароль админа с r-aurent.uz, не код компании. Проверьте HTTPS/фильтр школы.'
    );
  }
  const token = login.data?.token;
  if (!token) throw new Error('Cloud login did not return a token');

  let exported;
  try {
    exported = await requestJson(`${cloud}/users/edge-staff-export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    const detail = err.status
      ? `HTTP ${err.status}${err.data?.message ? `: ${err.data.message}` : ''}`
      : (err.message || err);
    throw new Error(`Экспорт сотрудников с облака не удался: ${detail}`);
  }
  const companyId = exported.data?.companyId;
  const companyLoginCode = exported.data?.companyLoginCode;
  const staff = exported.data?.staff || [];
  if (!companyId || !staff.length) {
    throw new Error('Cloud export returned no staff');
  }

  const secret = bootstrapSecret(secretIn);
  const local = await requestJson(`${localBase()}/edge/auth/bootstrap-staff`, {
    method: 'POST',
    body: {
      companyId,
      companyLoginCode,
      bootstrapSecret: secret,
      staff: staff.map((s) => ({
        userId: s.userId,
        username: s.username,
        email: s.email,
        fullName: s.fullName,
        role: s.role,
        passwordHash: s.passwordHash,
        pinHash: s.pinHash,
        storeIds: s.storeIds,
        allowedModules: s.allowedModules,
        canRequestBill: s.canRequestBill,
        active: s.active,
        companyLoginCode: s.companyLoginCode || companyLoginCode,
      })),
    },
  });

  let stores = null;
  let storesError = null;
  let storeRows = [];
  try {
    stores = await bootstrapStoresFromCloud({ token, companyId, bootstrapSecret: secret });
    storeRows = stores?.rows || [];
  } catch (err) {
    storesError = err.message || String(err);
  }

  const storeIds = resolveRestaurantStoreIds({
    storeId: preferredStoreId,
    staff,
    login: login.data,
    stores: storeRows,
  });

  const catalogs = [];
  const catalogErrors = [];
  const stocks = [];
  const stockErrors = [];
  for (const storeId of storeIds) {
    try {
      catalogs.push({
        storeId,
        ...(await bootstrapCatalogFromCloud({
          token, storeId, companyLoginCode, bootstrapSecret: secret,
        })),
      });
    } catch (err) {
      catalogErrors.push({ storeId, error: err.message || String(err) });
    }
    try {
      stocks.push({
        storeId,
        ...(await bootstrapStockFromCloud({
          token, companyId, storeId, bootstrapSecret: secret,
        })),
      });
    } catch (err) {
      stockErrors.push({ storeId, error: err.message || String(err) });
    }
  }

  let categoriesBootstrap = null;
  let cashRegistersBootstrap = null;
  let suppliersBootstrap = null;
  try {
    categoriesBootstrap = await bootstrapCategoriesFromCloud({
      token, companyId, bootstrapSecret: secret,
    });
  } catch { /* optional */ }
  try {
    cashRegistersBootstrap = await bootstrapCashRegistersFromCloud({
      token, companyId, storeIds, bootstrapSecret: secret,
    });
  } catch { /* optional */ }
  try {
    suppliersBootstrap = await bootstrapSuppliersFromCloud({
      token, companyId, bootstrapSecret: secret,
    });
  } catch { /* optional */ }

  const hasCatalog = catalogs.some((c) => c?.hasCatalog || Number(c?.halls) > 0 || Number(c?.items) > 0);
  const catalogError = !storeIds.length
    ? (storesError || 'Нет storeId для каталога — проверьте точки RESTAURANT/CANTEEN в облаке')
    : (!hasCatalog
      ? (catalogErrors.map((e) => `#${e.storeId}: ${e.error}`).join('; ')
        || 'Каталог с облака пустой (нет залов/меню). Создайте залы на r-aurent.uz.')
      : (catalogErrors.length ? catalogErrors.map((e) => `#${e.storeId}: ${e.error}`).join('; ') : null));

  if (!hasCatalog) {
    const err = new Error(catalogError || 'Не удалось загрузить каталог ресторана с облака');
    err.bootstrapPartial = true;
    err.detail = { storesError, catalogErrors, storeIds };
    throw err;
  }

  rememberLiveCloudSession({
    token, companyId, companyLoginCode, storeIds, bootstrapSecret: secret,
  });

  return {
    saved: local.data?.saved ?? staff.length,
    hasStaff: Boolean(local.data?.hasStaff),
    companyId,
    companyLoginCode,
    staffCount: staff.length,
    storeId: storeIds[0] || null,
    storeIds,
    stores,
    storesError,
    catalog: catalogs[0] || null,
    catalogs,
    catalogError,
    stock: stocks[0] || null,
    stocks,
    stockError: stockErrors.length
      ? stockErrors.map((e) => `#${e.storeId}: ${e.error}`).join('; ')
      : null,
    categories: categoriesBootstrap,
    cashRegisters: cashRegistersBootstrap,
    suppliers: suppliersBootstrap,
    hasCatalog: true,
    openOrders: Number(catalogs[0]?.openOrders || 0),
    kitchenTickets: Number(catalogs[0]?.kitchenTickets || 0),
  };
}

module.exports = {
  getLocalAuthStatus,
  getLocalBootstrapStatus,
  bootstrapStaffFromCloud,
  bootstrapStoresFromCloud,
  bootstrapCatalogFromCloud,
  bootstrapStockFromCloud,
  bootstrapCategoriesFromCloud,
  bootstrapCashRegistersFromCloud,
  bootstrapSuppliersFromCloud,
  fetchCloudPinRoster,
  ensureStaffViaCloudPin,
  refreshLiveFromCloud,
  pushLiveToCloud,
  getLiveCloudSession,
  rememberLiveCloudSession,
  cloudBase,
};
