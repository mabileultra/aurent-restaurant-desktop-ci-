/**
 * Resolves KPI numbers for Super Admin stores page.
 * Keeps overall totalStores, activeStores, inactiveStores, and companiesCount stable across status filters (All / Active / Inactive).
 */
export function resolveStoresKpi({
  stats,
  total = 0,
  rawRows = [],
  statusFilter = 'ALL',
  resolvedCompanyId,
  districtCode,
  companiesCountFallback = 0,
}) {
  const isDistrictFiltered = Boolean(districtCode);

  // When server stats are available and no district filter is applied,
  // stats is the single authoritative source for platform-wide counts.
  if (stats && !isDistrictFiltered) {
    const totalStores = stats.totalStores ?? 0;
    const activeStores = stats.activeStores ?? 0;
    const inactiveStores = stats.inactiveStores ?? 0;
    let companiesCount = (stats.companiesCount != null && stats.companiesCount > 0)
      ? stats.companiesCount
      : companiesCountFallback;

    if (resolvedCompanyId) {
      companiesCount = totalStores > 0 ? 1 : 0;
    }

    return {
      totalStores,
      activeStores,
      inactiveStores,
      companiesCount,
    };
  }

  // Fallback when stats is null or districtCode is client-filtered:
  const isInactiveTab = statusFilter === 'INACTIVE';
  const isActiveTab = statusFilter === 'ACTIVE';

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
  } else if (stats) {
    activeStores = stats.activeStores ?? 0;
    inactiveStores = stats.inactiveStores ?? 0;
  } else if (total <= rawRows.length) {
    activeStores = rawActive;
    inactiveStores = rawInactive;
  } else {
    inactiveStores = rawInactive;
    activeStores = Math.max(0, total - inactiveStores);
  }

  const totalStores = isDistrictFiltered
    ? total
    : (stats?.totalStores ?? ((activeStores ?? 0) + (inactiveStores ?? 0)));

  const uniqueCompaniesInRows = new Set(
    rawRows.map((r) => r.companyId).filter((id) => id != null && id !== '')
  ).size;

  let companiesCount = companiesCountFallback;
  if (resolvedCompanyId) {
    companiesCount = totalStores > 0 ? 1 : 0;
  } else if (isDistrictFiltered && uniqueCompaniesInRows > 0) {
    companiesCount = uniqueCompaniesInRows;
  } else if (stats?.companiesCount != null && stats.companiesCount > 0) {
    companiesCount = stats.companiesCount;
  } else if (uniqueCompaniesInRows > 0) {
    companiesCount = uniqueCompaniesInRows;
  }

  return {
    totalStores,
    activeStores,
    inactiveStores,
    companiesCount,
  };
}
