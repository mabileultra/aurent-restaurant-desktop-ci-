const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');

/** Pull stock product categories into local edge_stock_categories. */
async function bootstrapCategoriesFromCloud({ token, companyId, bootstrapSecret: secret } = {}) {
  if (!token || !companyId) {
    throw new Error('token and companyId required for categories bootstrap');
  }
  const { data } = await requestJson(`${cloudBase()}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rows = Array.isArray(data) ? data : (data?.content || []);
  const categories = rows
    .filter((c) => c?.id != null && c?.name)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      businessTypeId: c.businessTypeId,
      businessTypeCode: c.businessTypeCode,
      businessTypeName: c.businessTypeName,
    }));
  if (!categories.length) return { saved: 0, skipped: true };
  const local = await requestJson(`${localBase()}/edge/bootstrap/categories`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret(secret),
      companyId,
      categories,
    },
  });
  return local.data;
}

/** Pull cash registers into local edge_cash_registers. */
async function bootstrapCashRegistersFromCloud({
  token,
  companyId,
  storeIds,
  bootstrapSecret: secret,
} = {}) {
  if (!token || !companyId) {
    throw new Error('token and companyId required for cash-registers bootstrap');
  }
  const ids = Array.isArray(storeIds) ? storeIds : [];
  const cashRegisters = [];
  const seen = new Set();
  for (const storeId of ids.length ? ids : [null]) {
    const q = new URLSearchParams({ page: '0', size: '100' });
    if (storeId != null) q.set('storeId', String(storeId));
    const { data } = await requestJson(`${cloudBase()}/cash-registers?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const content = data?.content || (Array.isArray(data) ? data : []);
    for (const r of content) {
      if (r?.id == null || seen.has(r.id)) continue;
      seen.add(r.id);
      cashRegisters.push({
        id: r.id,
        storeId: r.storeId,
        registerNumber: r.registerNumber,
        equipmentModel: r.equipmentModel,
        equipmentSerial: r.equipmentSerial,
        fiscalCardId: r.fiscalCardId,
        deviceId: r.deviceId,
        workstationName: r.workstationName,
        status: r.status || 'ACTIVE',
      });
    }
  }
  if (!cashRegisters.length) return { saved: 0, skipped: true };
  const local = await requestJson(`${localBase()}/edge/bootstrap/cash-registers`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret(secret),
      companyId,
      cashRegisters,
    },
  });
  return local.data;
}

module.exports = {
  bootstrapCategoriesFromCloud,
  bootstrapCashRegistersFromCloud,
};
