/** API весов в десктоп-кассе (Electron preload). */

function desktopApi() {
  return typeof window !== 'undefined' ? window.desktopCashier : null;
}

/** Любой Aurent Desktop (есть `isDesktop`). */
export function isDesktopApp() {
  return Boolean(desktopApi()?.isDesktop);
}

/** Desktop с IPC весов (preload со scale*). */
export function isDesktopScaleBridge() {
  const api = desktopApi();
  return Boolean(api?.isDesktop && typeof api.scaleStart === 'function');
}

function safeCall(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export async function scaleIsAvailable() {
  if (!isDesktopScaleBridge()) return false;
  try {
    return Boolean(await desktopApi().scaleIsAvailable());
  } catch {
    return false;
  }
}

export async function scaleStart() {
  if (!isDesktopScaleBridge()) {
    return {
      ok: false,
      mode: isDesktopApp() ? 'desktop-outdated' : 'web',
      message: isDesktopApp()
        ? 'Обновите Aurent Cashier — в этой версии нет модуля весов'
        : 'Нужна desktop-касса',
      suggestPicker: false,
    };
  }
  try {
    const res = await desktopApi().scaleStart();
    if (res && typeof res === 'object') return res;
    return { ok: Boolean(res) };
  } catch (e) {
    return { ok: false, message: e?.message || 'Scale start failed', suggestPicker: true };
  }
}

export async function scaleStop() {
  if (!isDesktopScaleBridge()) return { ok: true };
  try {
    return await desktopApi().scaleStop();
  } catch {
    return { ok: true };
  }
}

export async function scaleCapture() {
  if (!isDesktopScaleBridge()) return null;
  return safeCall(() => desktopApi().scaleCapture(), null);
}

export async function openScalePicker() {
  if (!isDesktopScaleBridge()) {
    return { ok: false, message: 'Нужна desktop-касса с модулем весов' };
  }
  try {
    const saved = await desktopApi().openScalePicker();
    return { ok: true, saved };
  } catch (e) {
    return { ok: false, message: e?.message || 'Не удалось открыть настройку весов' };
  }
}

export async function scaleAutoDetect(options = {}) {
  if (!isDesktopScaleBridge()) {
    return { ok: false, message: 'Нужна desktop-касса с модулем весов' };
  }
  try {
    return await desktopApi().scaleAutoDetect(options);
  } catch (e) {
    return { ok: false, message: e?.message || 'Auto-detect failed' };
  }
}

export function subscribeScaleWeight(callback) {
  if (!isDesktopScaleBridge() || typeof desktopApi().onScaleWeight !== 'function') {
    return () => {};
  }
  try {
    return desktopApi().onScaleWeight((payload) => {
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

export async function scaleListAdapters() {
  if (!isDesktopScaleBridge() || typeof desktopApi().scaleListAdapters !== 'function') {
    return [];
  }
  try {
    const list = await desktopApi().scaleListAdapters();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function scaleGetActiveAdapter() {
  if (!isDesktopScaleBridge() || typeof desktopApi().scaleGetActiveAdapter !== 'function') {
    return null;
  }
  try {
    return await desktopApi().scaleGetActiveAdapter();
  } catch {
    return null;
  }
}

export async function scaleSetActiveAdapter(adapterId) {
  if (!isDesktopScaleBridge() || typeof desktopApi().scaleSetActiveAdapter !== 'function') {
    return null;
  }
  try {
    return await desktopApi().scaleSetActiveAdapter(adapterId);
  } catch {
    return null;
  }
}

export async function scalePushPlu(items) {
  if (!isDesktopScaleBridge() || typeof desktopApi().scalePushPlu !== 'function') {
    return { ok: false, message: 'Desktop bridge missing' };
  }
  try {
    return await desktopApi().scalePushPlu(items);
  } catch (e) {
    return { ok: false, message: e?.message || 'PLU push failed' };
  }
}
