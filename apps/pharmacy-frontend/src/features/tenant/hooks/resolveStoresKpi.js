/**
 * Resolves KPI numbers for Super Admin stores page.
 * Reconciles backend stats with client totals when districtCode or inactive status is filtered.
 */
export function resolveStoresKpi({
  stats,
  total,
  rawRows = [],
  statusFilter = 'ALL',
  resolvedCompanyId,
  districtCode,
  companiesCountFallback = 0,
}) {
  const isDistrictFiltered = Boolean(districtCode);
  const isInactiveTab = statusFilter === 'INACTIVE';
  const isActiveTab = statusFilter === 'ACTIVE';

  if (stats && !isDistrictFiltered && !isInactiveTab) {
    return {
      totalStores: stats.totalStores ?? 0,
      activeStores: stats.activeStores ?? 0,
      inactiveStores: stats.inactiveStores ?? 0,
      companiesCount: stats.companiesCount ?? 0,
    };
  }

  const rawActive = rawRows.filter((s) => s.active).length;
  const rawInactive = rawRows.filter((s) => !s.active).length;
  let activeStores;
  let inactiveStores;

  if (isActiveTab) {
    activeStores = total;
    inactiveStores = isDistrictFiltered ? 0 : (stats?.inactiveStores ?? 0);
  } else if (isInactiveTab) {
    inactiveStores = total;
    activeStores = isDistrictFiltered ? 0 : (stats?.activeStores ?? 0);
  } else if (total <= rawRows.length) {
    activeStores = rawActive;
    inactiveStores = rawInactive;
  } else {
    inactiveStores = rawInactive;
    activeStores = Math.max(0, total - inactiveStores);
  }

  const uniqueCompaniesInRows = new Set(
    rawRows.map((r) => r.companyId).filter((id) => id != null && id !== '')
  ).size;

  let companiesCount = companiesCountFallback;
  if (resolvedCompanyId) {
    companiesCount = total > 0 ? 1 : 0;
  } else if (isDistrictFiltered && uniqueCompaniesInRows > 0) {
    companiesCount = uniqueCompaniesInRows;
  } else if (stats?.companiesCount != null && !isDistrictFiltered) {
    companiesCount = stats.companiesCount;
  } else if (uniqueCompaniesInRows > 0) {
    companiesCount = uniqueCompaniesInRows;
  }

  return {
    totalStores: total,
    activeStores,
    inactiveStores,
    companiesCount,
  };
}
