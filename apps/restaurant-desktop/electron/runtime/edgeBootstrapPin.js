const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');
const { bootstrapStoresFromCloud, resolveRestaurantStoreIds } = require('./edgeBootstrapStores');
const { bootstrapCatalogFromCloud } = require('./edgeBootstrapCatalog');
const { bootstrapStockFromCloud } = require('./edgeBootstrapStock');
const { rememberLiveCloudSession } = require('./edgeLiveSync');

/** Public cloud PIN roster — show staff as soon as company code is entered. */
async function fetchCloudPinRoster(companyLoginCode) {
  const code = String(companyLoginCode || '').trim();
  if (!code) return [];
  const { data } = await requestJson(
    `${cloudBase()}/auth/cashier-pin/roster?companyLoginCode=${encodeURIComponent(code)}`
  );
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r) => ({
    id: r.id || r.userId,
    displayName: r.displayName || r.fullName || r.username || '—',
    role: r.role || 'WAITER',
  }));
}

/**
 * Online PIN: verify on cloud → upsert local row → return local JWT payload.
 * Admin/manager also refreshes staff+stock+catalog best-effort.
 */
async function ensureStaffViaCloudPin({
  companyLoginCode,
  pin,
  userId,
  bootstrapSecret: secretIn,
} = {}) {
  const code = String(companyLoginCode || '').trim();
  const pinNorm = String(pin || '').replace(/\D/g, '');
  if (!code || !pinNorm || !userId) {
    throw new Error('companyLoginCode, pin and userId required');
  }
  const cloud = cloudBase();
  const secret = bootstrapSecret(secretIn);

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

  const role = String(profile.role || '').toUpperCase();
  let pulledStoreIds = resolveRestaurantStoreIds({ login: profile, staff: [], stores: [] });
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
        pulledStoreIds = resolveRestaurantStoreIds({
          staff,
          login: profile,
          stores: storeRows,
        });
        for (const storeId of pulledStoreIds) {
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

  for (const storeId of pulledStoreIds) {
    await bootstrapCatalogFromCloud({
      token,
      storeId,
      companyLoginCode: code,
      bootstrapSecret: secret,
    }).catch(() => {});
  }
  rememberLiveCloudSession({
    token,
    companyId: profile.companyId,
    companyLoginCode: code,
    storeIds: pulledStoreIds,
    bootstrapSecret: secret,
  });

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
  fetchCloudPinRoster,
  ensureStaffViaCloudPin,
};
