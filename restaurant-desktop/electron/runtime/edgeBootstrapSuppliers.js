const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');

/** Pull suppliers into local edge_suppliers (справочники offline). */
async function bootstrapSuppliersFromCloud({ token, companyId, bootstrapSecret: secret } = {}) {
  if (!token || !companyId) {
    throw new Error('token and companyId required for suppliers bootstrap');
  }
  const suppliers = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 20) {
    const q = new URLSearchParams({ page: String(page), size: '100' });
    const { data } = await requestJson(`${cloudBase()}/suppliers?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const content = data?.content || (Array.isArray(data) ? data : []);
    totalPages = Number(data?.totalPages) > 0 ? Number(data.totalPages) : 1;
    for (const s of content) {
      if (!s?.id || !s?.name) continue;
      suppliers.push({
        id: s.id,
        name: s.name,
        taxId: s.taxId ?? s.inn ?? null,
        address: s.address ?? null,
        phone: s.phone ?? null,
        active: s.active !== false,
        createdAt: s.createdAt ?? null,
      });
    }
    page += 1;
    if (!content.length) break;
  }
  if (!suppliers.length) return { saved: 0, skipped: true };
  const local = await requestJson(`${localBase()}/edge/bootstrap/suppliers`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret(secret),
      companyId,
      suppliers,
    },
  });
  return local.data;
}

module.exports = { bootstrapSuppliersFromCloud };
