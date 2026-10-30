/** Prefer backend /stores/stats; fallback to current manage page totals. */
export function resolveStoresKpi({
  stats,
  total,
  rawRows,
  statusFilter,
  resolvedCompanyId,
  companiesCountFallback = 0,
}) {
  if (stats) {
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

  if (statusFilter === 'ACTIVE') {
    activeStores = total;
    inactiveStores = Math.max(0, total - activeStores);
  } else if (statusFilter === 'INACTIVE') {
    inactiveStores = total;
    activeStores = Math.max(0, total - inactiveStores);
  } else if (total <= rawRows.length) {
    activeStores = rawActive;
    inactiveStores = rawInactive;
  } else {
    inactiveStores = rawInactive;
    activeStores = Math.max(0, total - inactiveStores);
  }

  return {
    totalStores: total,
    activeStores,
    inactiveStores,
    companiesCount: resolvedCompanyId
      ? (total > 0 ? 1 : 0)
      : companiesCountFallback,
  };
}
