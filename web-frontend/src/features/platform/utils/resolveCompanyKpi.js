/**
 * Pure function to compute scalable KPI stats for platform companies.
 */
export function resolveCompanyKpi({
  total = 0,
  rawRows = [],
  statusFilter = 'ALL',
  isFiltered = false,
  storeCountData,
}) {
  const totalCompanies = total;
  const rawActive = rawRows.filter((r) => r.active).length;
  const rawInactive = rawRows.filter((r) => !r.active).length;

  let activeCompanies;
  let inactiveCompanies;

  if (total <= rawRows.length) {
    // Current page contains entire dataset: exact counts
    activeCompanies = rawActive;
    inactiveCompanies = rawInactive;
  } else if (statusFilter === 'ACTIVE') {
    activeCompanies = total;
    inactiveCompanies = 0;
  } else if (statusFilter === 'INACTIVE') {
    inactiveCompanies = total;
    activeCompanies = 0;
  } else {
    // Multi-page dataset: derive from page ratio / known inactive count
    inactiveCompanies = rawInactive;
    activeCompanies = Math.max(0, totalCompanies - inactiveCompanies);
  }

  const filteredStoreCount = rawRows.reduce((acc, r) => acc + (r.storeCount || 0), 0);
  const totalStores = isFiltered
    ? filteredStoreCount
    : (storeCountData ?? filteredStoreCount);

  return {
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalStores,
  };
}
