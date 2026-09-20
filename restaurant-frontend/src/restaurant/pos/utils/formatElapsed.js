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

/** Cleaning / digital timer like mock: 03:45 */
export function formatDigitalTimer(iso, now = Date.now()) {
  if (!iso) return null;
  const started = new Date(iso).getTime();
  if (!Number.isFinite(started)) return null;
  const totalSec = Math.max(0, Math.floor((now - started) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
