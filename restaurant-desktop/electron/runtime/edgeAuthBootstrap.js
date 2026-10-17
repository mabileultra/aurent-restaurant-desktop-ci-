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

function cloudBase() {
  return (process.env.RESTAURANT_CLOUD_API_URL || process.env.VITE_API_URL || 'https://r-aurent.uz/api/v1')
    .replace(/\/$/, '');
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
  const login = await requestJson(`${cloud}/auth/login`, {
    method: 'POST',
    body: { username, password },
  });
  const token = login.data?.token;
  if (!token) throw new Error('Cloud login did not return a token');

  const exported = await requestJson(`${cloud}/users/edge-staff-export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

  let catalog = null;
  let catalogError = null;
  let stock = null;
  let stockError = null;
  const storeId = resolveStoreId({ storeId: preferredStoreId, staff, login: login.data });
  if (storeId) {
    try {
      catalog = await bootstrapCatalogFromCloud({
        token,
        storeId,
        companyLoginCode,
        bootstrapSecret: secret,
      });
    } catch (err) {
      catalogError = err.message || String(err);
    }
    try {
      stock = await bootstrapStockFromCloud({
        token,
        companyId,
        storeId,
        bootstrapSecret: secret,
      });
    } catch (err) {
      stockError = err.message || String(err);
    }
  }

  return {
    saved: local.data?.saved ?? staff.length,
    hasStaff: Boolean(local.data?.hasStaff),
    companyId,
    companyLoginCode,
    staffCount: staff.length,
    storeId: storeId || null,
    catalog,
    catalogError,
    stock,
    stockError,
  };
}

function resolveStoreId({ storeId, staff, login }) {
  if (storeId) return Number(storeId);
  const fromLogin = login?.storeIds;
  if (Array.isArray(fromLogin) && fromLogin.length) return Number(fromLogin[0]);
  for (const s of staff || []) {
    if (Array.isArray(s.storeIds) && s.storeIds.length) return Number(s.storeIds[0]);
  }
  return null;
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

module.exports = {
  getLocalAuthStatus,
  getLocalBootstrapStatus,
  bootstrapStaffFromCloud,
  bootstrapCatalogFromCloud,
  bootstrapStockFromCloud,
  cloudBase,
};
