const http = require('http');
const https = require('https');
const { URL } = require('url');
const { SERVICE_HOST, SERVICE_PORT } = require('../config');

function requestJson(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = body == null ? null : JSON.stringify(body);
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: `${u.pathname}${u.search}`,
        method,
        headers: {
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = { raw };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data });
          } else {
            const err = new Error(data?.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.data = data;
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function localBase() {
  return `http://${SERVICE_HOST}:${SERVICE_PORT}/api/v1`;
}

const DEFAULT_CLOUD_API = 'https://r-aurent.uz/api/v1';

function cloudBase() {
  const raw = process.env.RESTAURANT_CLOUD_API_URL
    || process.env.RESTAURANT_CLOUD_SYNC_URL
    || '';
  // Never use relative VITE_API_URL (/api/v1) — that would hit localhost, not the cloud.
  const candidate = String(raw || DEFAULT_CLOUD_API).trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(candidate)) return DEFAULT_CLOUD_API;
  return candidate;
}

async function getLocalAuthStatus() {
  const { data } = await requestJson(`${localBase()}/edge/auth/status`);
  return data;
}

/**
 * One-time online bootstrap:
 * 1) login to cloud identity
 * 2) GET /users/edge-staff-export
 * 3) POST hashes into local /edge/auth/bootstrap-staff
 */
async function bootstrapStaffFromCloud({ username, password, bootstrapSecret, storeId: preferredStoreId } = {}) {
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

  const secret = bootstrapSecret || process.env.RESTAURANT_EDGE_BOOTSTRAP_SECRET || 'edge-dev-bootstrap';
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
    stores = await bootstrapStoresFromCloud({
      token,
      companyId,
      bootstrapSecret: secret,
    });
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
      const catalog = await bootstrapCatalogFromCloud({
        token,
        storeId,
        companyLoginCode,
        bootstrapSecret: secret,
      });
      catalogs.push({ storeId, ...catalog });
    } catch (err) {
      catalogErrors.push({ storeId, error: err.message || String(err) });
    }
    try {
      const stock = await bootstrapStockFromCloud({
        token,
        companyId,
        storeId,
        bootstrapSecret: secret,
      });
      stocks.push({ storeId, ...stock });
    } catch (err) {
      stockErrors.push({ storeId, error: err.message || String(err) });
    }
  }

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
    err.detail = {
      storesError,
      catalogErrors,
      storeIds,
    };
    throw err;
  }

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
    hasCatalog: true,
  };
}

function asList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
}

function isRestaurantBusinessType(type) {
  const code = String(type || '').trim().toUpperCase();
  return code === 'RESTAURANT' || code === 'CANTEEN';
}

/** Pull company store list from cloud web-backend so local GET /stores is non-empty. */
async function bootstrapStoresFromCloud({ token, companyId, bootstrapSecret } = {}) {
  if (!token || !companyId) {
    throw new Error('token and companyId required for stores bootstrap');
  }
  const cloud = cloudBase();
  const exported = await requestJson(`${cloud}/stores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const raw = asList(exported.data);
  const stores = raw
    .filter((s) => s && s.id != null)
    .map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      address: s.address,
      // Blank type: treat as restaurant on hall PC so FE filter is not empty.
      businessType: String(s.businessType || 'RESTAURANT').trim().toUpperCase() || 'RESTAURANT',
      active: s.active !== false,
    }));
  if (!stores.length) {
    throw new Error('Cloud /stores returned empty list');
  }
  const local = await requestJson(`${localBase()}/edge/bootstrap/stores`, {
    method: 'POST',
    body: {
      companyId,
      bootstrapSecret: bootstrapSecret || process.env.RESTAURANT_EDGE_BOOTSTRAP_SECRET || 'edge-dev-bootstrap',
      stores,
    },
  });
  return {
    saved: local.data?.saved ?? stores.length,
    count: stores.length,
    rows: stores,
  };
}

/** Prefer RESTAURANT/CANTEEN ids; fall back to staff/login storeIds. Cap at 5. */
function resolveRestaurantStoreIds({ storeId, staff, login, stores }) {
  const out = [];
  const push = (id) => {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0 || out.includes(n)) return;
    out.push(n);
  };
  if (storeId) push(storeId);

  const restaurantFromCloud = (stores || [])
    .filter((s) => isRestaurantBusinessType(s.businessType) && s.active !== false)
    .map((s) => s.id);
  for (const id of restaurantFromCloud) push(id);

  if (!out.length) {
    for (const s of stores || []) push(s.id);
  }

  const fromLogin = login?.storeIds;
  if (Array.isArray(fromLogin)) {
    for (const id of fromLogin) push(id);
  }
  for (const s of staff || []) {
    if (Array.isArray(s.storeIds)) {
      for (const id of s.storeIds) push(id);
    }
  }
  return out.slice(0, 5);
}

/**
 * Pull halls/tables/menu/stations/modifiers/print profile from cloud restaurant-service
 * into local edge DB (preserve ids).
 */
async function bootstrapCatalogFromCloud({ token, storeId, companyLoginCode, bootstrapSecret } = {}) {
  if (!token || !storeId) {
    throw new Error('token and storeId required for catalog bootstrap');
  }
  const cloud = cloudBase();
  const q = new URLSearchParams({ storeId: String(storeId) });
  if (companyLoginCode) q.set('companyLoginCode', companyLoginCode);
  const exported = await requestJson(`${cloud}/rst/edge/catalog-export?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const snapshot = exported.data;
  if (!snapshot?.companyId || !snapshot?.storeId) {
    throw new Error('Cloud catalog export returned empty snapshot');
  }
  const local = await requestJson(`${localBase()}/edge/bootstrap/catalog`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret || process.env.RESTAURANT_EDGE_BOOTSTRAP_SECRET || 'edge-dev-bootstrap',
      snapshot,
    },
  });
  return local.data;
}

/**
 * Pull nomenclature + stock quantities from cloud /products into local edge_products.
 */
async function bootstrapStockFromCloud({ token, companyId, storeId, bootstrapSecret } = {}) {
  if (!token || !companyId || !storeId) {
    throw new Error('token, companyId and storeId required for stock bootstrap');
  }
  const cloud = cloudBase();
  const products = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 40) {
    const q = new URLSearchParams({
      storeId: String(storeId),
      activeOnly: 'false',
      page: String(page),
      size: '100',
    });
    const { data } = await requestJson(`${cloud}/products?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const content = data?.content || (Array.isArray(data) ? data : []);
    for (const p of content) {
      if (!p?.id || !p?.name) continue;
      products.push({
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode,
        unitCode: p.unitCode || p.unit_code,
        taxRate: p.taxRate,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity ?? p.stock_qty ?? 0,
        lowStockAlert: p.lowStockAlert ?? 0,
        ikpu: p.ikpu,
        packageCode: p.packageCode,
        unitOfMeasure: p.unitOfMeasure,
        unitMeasureCode: p.unitMeasureCode,
        markedProduct: Boolean(p.markedProduct),
        active: p.active !== false,
      });
    }
    totalPages = Number(data?.totalPages || 1);
    page += 1;
    if (!content.length) break;
  }
  if (!products.length) {
    return { saved: 0, hasStock: false, skipped: true };
  }
  const local = await requestJson(`${localBase()}/edge/bootstrap/stock`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret || process.env.RESTAURANT_EDGE_BOOTSTRAP_SECRET || 'edge-dev-bootstrap',
      companyId,
      storeId,
      products,
    },
  });
  return local.data;
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

/** Public cloud PIN roster — show staff as soon as company code is entered. */
async function fetchCloudPinRoster(companyLoginCode) {
  const code = String(companyLoginCode || '').trim();
  if (!code) return [];
  const cloud = cloudBase();
  const { data } = await requestJson(
    `${cloud}/auth/cashier-pin/roster?companyLoginCode=${encodeURIComponent(code)}`
  );
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r) => ({
    id: r.id || r.userId,
    displayName: r.displayName || r.fullName || r.username || '—',
    role: r.role || 'WAITER',
  }));
}

/**
 * Online PIN: verify on cloud → upsert local row with locally hashed PIN → return local JWT payload.
 * Also tries full staff export when the cloud user is ADMIN/MANAGER.
 */
async function ensureStaffViaCloudPin({
  companyLoginCode,
  pin,
  userId,
  bootstrapSecret,
} = {}) {
  const code = String(companyLoginCode || '').trim();
  const pinNorm = String(pin || '').replace(/\D/g, '');
  if (!code || !pinNorm || !userId) {
    throw new Error('companyLoginCode, pin and userId required');
  }
  const cloud = cloudBase();
  const secret = bootstrapSecret || process.env.RESTAURANT_EDGE_BOOTSTRAP_SECRET || 'edge-dev-bootstrap';

  let login;
  try {
    login = await requestJson(`${cloud}/auth/cashier-pin/login`, {
      method: 'POST',
      body: { companyLoginCode: code, pin: pinNorm, userId },
    });
  } catch (err) {
    const detail = err.status
      ? `HTTP ${err.status}${err.data?.message ? `: ${err.data.message}` : ''}`
      : (err.message || err);
    throw new Error(`Облако: неверный PIN или нет сети (${detail})`);
  }
  const profile = login.data || {};
  const token = profile.token;
  if (!token) throw new Error('Cloud PIN login did not return a token');

  // Best-effort full staff+catalog pull when this user can export.
  const role = String(profile.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_ADMIN') {
    try {
      const exported = await requestJson(`${cloud}/users/edge-staff-export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const companyId = exported.data?.companyId;
      const companyLoginCodeExport = exported.data?.companyLoginCode || code;
      const staff = exported.data?.staff || [];
      if (companyId && staff.length) {
        await requestJson(`${localBase()}/edge/auth/bootstrap-staff`, {
          method: 'POST',
          body: {
            companyId,
            companyLoginCode: companyLoginCodeExport,
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
              companyLoginCode: s.companyLoginCode || companyLoginCodeExport,
            })),
          },
        });
        let storeRows = [];
        try {
          const storesResult = await bootstrapStoresFromCloud({
            token,
            companyId,
            bootstrapSecret: secret,
          });
          storeRows = storesResult?.rows || [];
        } catch {
          /* continue with staff storeIds */
        }
        const storeIds = resolveRestaurantStoreIds({
          staff,
          login: profile,
          stores: storeRows,
        });
        for (const storeId of storeIds) {
          await bootstrapCatalogFromCloud({
            token,
            storeId,
            companyLoginCode: companyLoginCodeExport,
            bootstrapSecret: secret,
          }).catch(() => {});
          await bootstrapStockFromCloud({
            token,
            companyId,
            storeId,
            bootstrapSecret: secret,
          }).catch(() => {});
        }
      }
    } catch {
      /* PIN upsert below is enough for this user */
    }
  }

  const local = await requestJson(`${localBase()}/edge/auth/upsert-cloud-pin`, {
    method: 'POST',
    body: {
      bootstrapSecret: secret,
      userId: profile.id || userId,
      username: profile.username || String(userId),
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role || 'WAITER',
      companyId: profile.companyId,
      companyLoginCode: profile.companyLoginCode || code,
      pin: pinNorm,
      storeIds: profile.storeIds || [],
      allowedModules: profile.allowedModules || [],
      canRequestBill: false,
    },
  });
  return local.data;
}

module.exports = {
  getLocalAuthStatus,
  getLocalBootstrapStatus,
  bootstrapStaffFromCloud,
  bootstrapStoresFromCloud,
  bootstrapCatalogFromCloud,
  bootstrapStockFromCloud,
  fetchCloudPinRoster,
  ensureStaffViaCloudPin,
  cloudBase,
};
