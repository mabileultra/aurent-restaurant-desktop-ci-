/** API весов в десктоп-кассе (Electron preload). Модель не важна — вес нормализуется в кг. */

function safeCall(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function isDesktopScaleBridge() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.scaleStart);
}

export async function scaleIsAvailable() {
  if (!isDesktopScaleBridge()) return false;
  try {
    return Boolean(await window.desktopCashier.scaleIsAvailable());
  } catch {
    return false;
  }
}

export async function scaleStart() {
  if (!isDesktopScaleBridge()) return { ok: false, mode: 'web', message: 'Desktop bridge missing' };
  try {
    const res = await window.desktopCashier.scaleStart();
    if (res && typeof res === 'object') return res;
    return { ok: Boolean(res) };
  } catch (e) {
    return { ok: false, message: e?.message || 'Scale start failed', suggestPicker: true };
  }
}

export async function scaleStop() {
  if (!isDesktopScaleBridge()) return { ok: true };
  try {
    return await window.desktopCashier.scaleStop();
  } catch {
    return { ok: true };
  }
}

export async function scaleCapture() {
  if (!isDesktopScaleBridge()) return null;
  return safeCall(() => window.desktopCashier.scaleCapture(), null);
}

export async function openScalePicker() {
  if (!isDesktopScaleBridge()) return null;
  try {
    return await window.desktopCashier.openScalePicker();
  } catch {
    return null;
  }
}

export async function scaleAutoDetect(options = {}) {
  if (!isDesktopScaleBridge()) return { ok: false };
  try {
    return await window.desktopCashier.scaleAutoDetect(options);
  } catch (e) {
    return { ok: false, message: e?.message || 'Auto-detect failed' };
  }
}

export function subscribeScaleWeight(callback) {
  if (!isDesktopScaleBridge() || typeof window.desktopCashier.onScaleWeight !== 'function') {
    return () => {};
  }
  try {
    return window.desktopCashier.onScaleWeight((payload) => {
      if (!payload || typeof callback !== 'function') return;
      const kg = Number(payload.kg);
      callback({
        kg: Number.isFinite(kg) ? kg : null,
        stable: Boolean(payload.stable),
        raw: payload.raw,
        at: payload.at,
      });
    });
  } catch {
    return () => {};
  }
}
