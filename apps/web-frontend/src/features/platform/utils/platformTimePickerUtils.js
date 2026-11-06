/**
 * Utilities for PlatformTimePicker component.
 * Standardizes time parsing, formatting, validation, and option generation.
 */

export const DEFAULT_TIME = '09:00';
export const DEFAULT_PRESET_TIMES = ['09:00', '12:00', '15:00', '18:00', '21:00'];

export function padZero(num) {
  const n = Math.floor(Number(num) || 0);
  return n < 10 ? `0${Math.max(0, n)}` : String(n);
}

export function isValidTimeString(val) {
  if (typeof val !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(val.trim());
}

export function parseTimeString(val, fallback = DEFAULT_TIME) {
  const target = isValidTimeString(val) ? val.trim() : fallback;
  const [hStr, mStr] = target.split(':');
  const hours = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
  const minutes = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
  return { hours, minutes, formatted: `${padZero(hours)}:${padZero(minutes)}` };
}

export function formatTimeString(hours, minutes) {
  const h = Math.min(23, Math.max(0, Number(hours) || 0));
  const m = Math.min(59, Math.max(0, Number(minutes) || 0));
  return `${padZero(h)}:${padZero(m)}`;
}

export function generateHourOptions() {
  const hours = [];
  for (let i = 0; i < 24; i += 1) {
    hours.push(padZero(i));
  }
  return hours;
}

export function generateMinuteOptions(step = 5) {
  const safeStep = Math.max(1, Math.min(30, Number(step) || 5));
  const minutes = [];
  for (let i = 0; i < 60; i += safeStep) {
    minutes.push(padZero(i));
  }
  return minutes;
}

export function getCurrentTimeString(roundToStep = 5) {
  const now = new Date();
  const hours = now.getHours();
  let minutes = now.getMinutes();

  if (roundToStep > 1) {
    minutes = Math.round(minutes / roundToStep) * roundToStep;
    if (minutes >= 60) {
      return formatTimeString((hours + 1) % 24, 0);
    }
  }

  return formatTimeString(hours, minutes);
}
