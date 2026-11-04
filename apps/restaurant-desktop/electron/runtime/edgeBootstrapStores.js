const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');

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

/** Pull company store list from cloud so local GET /stores is non-empty. */
async function bootstrapStoresFromCloud({ token, companyId, bootstrapSecret: secret } = {}) {
  if (!token || !companyId) {
    throw new Error('token and companyId required for stores bootstrap');
  }
  const exported = await requestJson(`${cloudBase()}/stores`, {
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
      bootstrapSecret: bootstrapSecret(secret),
      stores,
    },
  });
  return {
    saved: local.data?.saved ?? stores.length,
    count: stores.length,
    rows: stores,
  };
}

module.exports = {
  asList,
  isRestaurantBusinessType,
  resolveRestaurantStoreIds,
  bootstrapStoresFromCloud,
};
