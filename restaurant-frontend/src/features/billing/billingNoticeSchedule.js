/** Слоты мягкого напоминания об оплате (Asia/Tashkent, UTC+5). */
export const BILLING_NOTICE_HOURS = Object.freeze([10, 15, 21]);
export const BILLING_NOTICE_ZONE = 'Asia/Tashkent';
export const BILLING_NOTICE_DURATION_MS = 12_000;
const TASHKENT_UTC_OFFSET_HOURS = 5;

/**
 * @param {Date} now
 * @param {string} [timeZone]
 * @returns {{ dayKey: string, hour: number, minute: number }}
 */
export function localPartsInZone(now = new Date(), timeZone = BILLING_NOTICE_ZONE) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/**
 * Слоты, которые уже наступили сегодня (с :00 включительно).
 * @param {Date} now
 * @param {readonly number[]} [hours]
 */
export function passedSlotsToday(now = new Date(), hours = BILLING_NOTICE_HOURS) {
  const { dayKey, hour } = localPartsInZone(now);
  return { dayKey, passed: hours.filter((h) => hour >= h) };
}

/**
 * Слоты при входе, которые ещё не отмечали в storage.
 * @param {string[]|number[]} shownHours
 * @param {Date} now
 */
export function pendingCatchUpSlots(shownHours = [], now = new Date()) {
  const shown = new Set((shownHours || []).map(String));
  const { dayKey, passed } = passedSlotsToday(now);
  return {
    dayKey,
    hours: passed.filter((h) => !shown.has(String(h))),
  };
}

export function storageKey(companyId, dayKey) {
  return `aurent.billingNotice.${companyId}.${dayKey}`;
}

export function readShownHours(companyId, dayKey) {
  if (companyId == null || !dayKey) return [];
  try {
    const raw = localStorage.getItem(storageKey(companyId, dayKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function markHoursShown(companyId, dayKey, hours) {
  if (companyId == null || !dayKey || !hours?.length) return;
  try {
    const prev = new Set(readShownHours(companyId, dayKey));
    hours.forEach((h) => prev.add(String(h)));
    localStorage.setItem(storageKey(companyId, dayKey), JSON.stringify([...prev].sort()));
  } catch {
    // private mode / quota — ignore; notice may repeat same day
  }
}

/**
 * ms до следующего слота сегодня или до 10:00 завтра (Tashkent = UTC+5).
 * @param {Date} now
 * @param {readonly number[]} [hours]
 */
export function msUntilNextSlot(now = new Date(), hours = BILLING_NOTICE_HOURS) {
  const { dayKey, hour } = localPartsInZone(now);
  const [y, m, d] = dayKey.split('-').map(Number);
  const upcoming = hours.find((h) => hour < h);
  if (upcoming != null) {
    const target = Date.UTC(y, m - 1, d, upcoming - TASHKENT_UTC_OFFSET_HOURS, 0, 0);
    return Math.max(0, target - now.getTime());
  }
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  const target = Date.UTC(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth(),
    tomorrow.getUTCDate(),
    hours[0] - TASHKENT_UTC_OFFSET_HOURS,
    0,
    0,
  );
  return Math.max(0, target - now.getTime());
}
