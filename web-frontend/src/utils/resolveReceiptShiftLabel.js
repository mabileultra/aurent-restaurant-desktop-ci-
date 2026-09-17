/**
 * Подпись «Смена» на чеке.
 * Не брать хвост номера чека (PHR-…-0001 → «001») — это не номер смены.
 */
export function resolveReceiptShiftLabel(sale, { envShiftNo } = {}) {
  const opened = sale?.shiftOpenedAt;
  if (opened) {
    const d = opened instanceof Date ? opened : new Date(opened);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
    }
  }

  if (sale?.shiftZReportId != null && String(sale.shiftZReportId).trim()) {
    return String(sale.shiftZReportId);
  }

  const fromEnv = envShiftNo != null ? String(envShiftNo).trim() : '';
  if (fromEnv) return fromEnv;

  return '—';
}
