/**
 * Единый человекочитаемый номер/метка смены для чека, топбара и «Мои продажи».
 * Порядок: № кассы → время открытия → Z → env. Никогда UUID и не хвост номера чека.
 */
export function formatCashierShiftLabel(source = {}, { envShiftNo } = {}) {
  const reg = source?.registerNumber ?? source?.shiftRegisterNumber;
  if (reg != null && String(reg).trim() !== '') {
    return String(reg).trim();
  }

  const opened = source?.openedAt ?? source?.shiftOpenedAt;
  if (opened) {
    const d = opened instanceof Date ? opened : new Date(opened);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }

  if (source?.shiftZReportId != null && String(source.shiftZReportId).trim()) {
    return String(source.shiftZReportId);
  }
  if (source?.zReportId != null && String(source.zReportId).trim()) {
    return String(source.zReportId);
  }

  const fromEnv = envShiftNo != null ? String(envShiftNo).trim() : '';
  if (fromEnv) return fromEnv;

  return '—';
}
