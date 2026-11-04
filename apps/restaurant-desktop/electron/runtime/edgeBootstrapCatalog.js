const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');

/** Pull halls/tables/menu into local edge DB (preserve ids). */
async function bootstrapCatalogFromCloud({
  token,
  storeId,
  companyLoginCode,
  bootstrapSecret: secret,
} = {}) {
  if (!token || !storeId) {
    throw new Error('token and storeId required for catalog bootstrap');
  }
  const q = new URLSearchParams({ storeId: String(storeId) });
  if (companyLoginCode) q.set('companyLoginCode', companyLoginCode);
  const exported = await requestJson(`${cloudBase()}/rst/edge/catalog-export?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const snapshot = exported.data;
  if (!snapshot?.companyId || !snapshot?.storeId) {
    throw new Error('Cloud catalog export returned empty snapshot');
  }
  const local = await requestJson(`${localBase()}/edge/bootstrap/catalog`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret(secret),
      snapshot,
    },
  });
  return local.data;
}

module.exports = { bootstrapCatalogFromCloud };
