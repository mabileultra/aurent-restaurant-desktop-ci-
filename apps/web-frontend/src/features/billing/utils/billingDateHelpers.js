export function periodStart(paidUntil) {
  if (!paidUntil) return null;
  const end = new Date(paidUntil);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return start;
}

export function getTabTone(tab) {
  if (tab === 'TOP_UP') return 'billing-tab--blue';
  if (tab === 'MODULE') return 'billing-tab--violet';
  if (tab === 'CHARGE') return 'billing-tab--amber';
  return '';
}
