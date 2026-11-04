/**
 * Build accordion groups from /stores/by-company rows + lazily loaded branches.
 * Counts come from API summaries until branches for that company are loaded.
 */
export function buildStoresGroupedGroups(companyRows = [], branchesByCompanyId = {}, statusFilter = 'ALL') {
  return (companyRows || []).map((row) => {
    const id = Number(row.companyId ?? row.id);
    const loaded = branchesByCompanyId[id];
    const hasLoaded = Array.isArray(loaded);

    let stores = hasLoaded ? loaded : [];
    if (hasLoaded && statusFilter === 'ACTIVE') {
      stores = stores.filter((s) => s.active);
    } else if (hasLoaded && statusFilter === 'INACTIVE') {
      stores = stores.filter((s) => !s.active);
    }

    const storeCount = Number(row.storeCount ?? 0);
    const activeStoreCount = Number(row.activeStoreCount ?? 0);
    const total = hasLoaded ? stores.length : storeCount;
    const active = hasLoaded
      ? stores.filter((s) => s.active).length
      : activeStoreCount;
    const inactive = Math.max(0, total - active);

    return {
      id,
      company: {
        id,
        name: row.companyName ?? row.name,
        loginCode: row.loginCode,
        businessType: row.businessType,
        regionCode: row.regionCode,
        districtCode: row.districtCode,
        active: row.active !== false,
        tin: row.tin,
        phone: row.phone,
        storeCount,
        activeStoreCount,
      },
      stores,
      branchesLoaded: hasLoaded,
      total,
      active,
      inactive,
    };
  });
}

export function filterStoresForGroupedView(stores, {
  companyId,
  search = '',
  businessType = '',
  regionCode = '',
  districtCode = '',
  statusFilter = 'ALL',
} = {}) {
  const q = search.trim().toLowerCase();
  const cIdNum = companyId ? Number(companyId) : null;
  return (stores || []).filter((store) => {
    if (cIdNum && Number(store.companyId) !== cIdNum) return false;
    if (statusFilter === 'ACTIVE' && !store.active) return false;
    if (statusFilter === 'INACTIVE' && store.active) return false;
    if (businessType && store.businessType !== businessType) return false;
    if (regionCode && store.regionCode !== regionCode) return false;
    if (districtCode && store.districtCode !== districtCode) return false;
    if (q) {
      const matchName = store.name?.toLowerCase().includes(q);
      const matchCode = store.code?.toLowerCase().includes(q);
      const matchAddr = store.address?.toLowerCase().includes(q);
      const matchComp = store.companyName?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchAddr && !matchComp) return false;
    }
    return true;
  });
}
