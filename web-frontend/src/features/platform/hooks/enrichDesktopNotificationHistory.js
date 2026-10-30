export function enrichDesktopNotificationHistory(rawList, allLabel) {
  const now = new Date();
  return (Array.isArray(rawList) ? rawList : []).map((item) => {
    const created = item.createdAt ? new Date(item.createdAt) : null;
    const expires = item.expiresAt ? new Date(item.expiresAt) : null;
    let status = 'ACTIVE';
    if (created && created > now) status = 'SCHEDULED';
    else if (expires && expires < now) status = 'EXPIRED';
    return {
      ...item,
      status,
      deliveredCount: null,
      totalCount: null,
      readCount: null,
      readPercent: null,
      targetLabel: allLabel,
    };
  });
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
