import { filterStoresForGroupedView } from '../../../utils/buildStoresGroupedGroups';

/** Legacy/client grouping for tests when server groups are not provided. */
export function buildClientCompanyGroups({
  stores = [],
  companies = [],
  companyId = '',
  search = '',
  businessType = '',
  regionCode = '',
  districtCode = '',
  statusFilter = 'ALL',
  orphanLabel = 'Umumiy / Biriktirilmagan',
} = {}) {
  const filteredStores = filterStoresForGroupedView(stores, {
    companyId,
    search,
    businessType,
    regionCode,
    districtCode,
    statusFilter,
  });

  const companyMap = new Map();
  const cIdNum = companyId ? Number(companyId) : null;

  companies.forEach((comp) => {
    companyMap.set(Number(comp.id), { company: comp, stores: [] });
  });

  const orphanStores = [];
  filteredStores.forEach((store) => {
    const cId = store.companyId ? Number(store.companyId) : null;
    if (cId && companyMap.has(cId)) {
      companyMap.get(cId).stores.push(store);
    } else if (cId) {
      companyMap.set(cId, {
        company: { id: cId, name: store.companyName || `Kompaniya #${cId}` },
        stores: [store],
      });
    } else {
      orphanStores.push(store);
    }
  });

  const groups = [];
  const hasFilters = Boolean(
    search || businessType || regionCode || districtCode || statusFilter !== 'ALL' || companyId
  );

  companyMap.forEach((entry, cId) => {
    if (cIdNum && cId !== cIdNum) return;
    if (entry.stores.length > 0 || !hasFilters || (cIdNum && cId === cIdNum)) {
      const total = entry.stores.length;
      const active = entry.stores.filter((s) => s.active).length;
      groups.push({
        id: cId,
        company: entry.company,
        stores: entry.stores,
        total,
        active,
        inactive: total - active,
      });
    }
  });

  groups.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return (a.company.name || '').localeCompare(b.company.name || '', undefined, { numeric: true });
  });

  if (!cIdNum && orphanStores.length > 0) {
    groups.push({
      id: 'orphan',
      company: { id: 'orphan', name: orphanLabel },
      stores: orphanStores,
      total: orphanStores.length,
      active: orphanStores.filter((s) => s.active).length,
      inactive: orphanStores.filter((s) => !s.active).length,
    });
  }

  return { groups, filteredStores };
}
