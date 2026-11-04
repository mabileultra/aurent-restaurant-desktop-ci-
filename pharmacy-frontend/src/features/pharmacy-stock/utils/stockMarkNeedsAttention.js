/** Локальный признак «нужно внимание» для UI мониторинга ASL. */
export function stockMarkNeedsAttention(row) {
  if (!row) return false;
  if (String(row.status || '').toUpperCase() === 'PENDING_WITHDRAW') return true;
  return Boolean(String(row.lastWithdrawError || '').trim());
}

export function stockMarkAttentionKind(row) {
  if (!stockMarkNeedsAttention(row)) return 'ok';
  if (String(row.status || '').toUpperCase() === 'PENDING_WITHDRAW') return 'pending';
  return 'error';
}
