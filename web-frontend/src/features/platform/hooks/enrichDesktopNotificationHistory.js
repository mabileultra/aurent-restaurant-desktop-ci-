export function enrichDesktopNotificationHistory(rawList, allLabel) {
  const now = Date.now();
  return (Array.isArray(rawList) ? rawList : []).map((item) => {
    const created = item.createdAt ? new Date(item.createdAt).getTime() : null;
    const scheduled = item.scheduledAt ? new Date(item.scheduledAt).getTime() : null;
    const expires = item.expiresAt ? new Date(item.expiresAt).getTime() : null;

    let status = item.status || 'ACTIVE';
    if (status !== 'ACTIVE' && status !== 'SCHEDULED' && status !== 'EXPIRED') {
      status = 'ACTIVE';
    }
    if (expires != null && expires <= now) {
      status = 'EXPIRED';
    } else if (status === 'SCHEDULED' || (scheduled != null && scheduled > now)) {
      status = 'SCHEDULED';
    } else if (scheduled != null && scheduled <= now && status === 'SCHEDULED') {
      status = 'ACTIVE';
    } else if (!item.status && created != null && created > now) {
      status = 'SCHEDULED';
    } else if (!item.status && expires != null && expires < now) {
      status = 'EXPIRED';
    }

    const targetLabel = buildTargetLabel(item, allLabel);

    return {
      ...item,
      status,
      deliveredCount: item.deliveredCount ?? null,
      totalCount: item.totalCount ?? null,
      readCount: item.readCount ?? null,
      readPercent: item.readPercent ?? null,
      targetLabel,
    };
  });
}

function buildTargetLabel(item, allLabel) {
  if (item.targetLabel) return item.targetLabel;
  if (item.targetType === 'COMPANIES') {
    const n = Array.isArray(item.companyIds) ? item.companyIds.length : 0;
    return n > 0 ? `Kompaniyalar: ${n}` : allLabel;
  }
  if (item.targetType === 'STORES') {
    const n = Array.isArray(item.storeIds) ? item.storeIds.length : 0;
    return n > 0 ? `Filiallar: ${n}` : allLabel;
  }
  return allLabel;
}

export function filterDesktopNotificationHistory(items, searchQuery, statusFilter) {
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (q) {
      const tMatch = item.title?.toLowerCase().includes(q);
      const bMatch = item.body?.toLowerCase().includes(q);
      if (!tMatch && !bMatch) return false;
    }
    return true;
  });
}
