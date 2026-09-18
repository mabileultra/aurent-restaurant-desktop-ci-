/** Бейдж локального статуса КМ (не путать с статусом прихода). */
export default function PharmacyMarkStatusBadge({ status, t }) {
  const key = String(status || '').toUpperCase();
  const label = t(`pharmacyStock.aslMonitor.status.${key}`, {
    defaultValue: key || '—',
  });
  const tone = key === 'SOLD'
    ? 'ok'
    : key === 'PENDING_WITHDRAW'
      ? 'warn'
      : key === 'RETURNED'
        ? 'muted'
        : 'neutral';

  return (
    <span className={`pharmacy-asl-monitor__badge pharmacy-asl-monitor__badge--${tone}`}>
      {label}
    </span>
  );
}
