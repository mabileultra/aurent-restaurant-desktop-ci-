export function formatElapsed(iso, now = Date.now()) {
  if (!iso) return null;
  const started = new Date(iso).getTime();
  if (!Number.isFinite(started)) return null;
  const minutes = Math.max(0, Math.floor((now - started) / 60000));
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}ч ${String(rest).padStart(2, '0')}м`;
}

export function formatShiftOpenDuration(iso, now = Date.now()) {
  if (!iso) return null;
  const started = new Date(iso).getTime();
  if (!Number.isFinite(started)) return null;
  const total = Math.max(0, Math.floor((now - started) / 60000));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}ч ${String(minutes).padStart(2, '0')}м`;
}
