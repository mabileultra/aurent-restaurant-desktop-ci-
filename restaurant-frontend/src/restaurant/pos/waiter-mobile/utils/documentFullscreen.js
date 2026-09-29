/** Thin adapter over the Fullscreen API — no UI, no prefs. */

export function isFullscreenSupported() {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement;
  return Boolean(
    el.requestFullscreen
    || el.webkitRequestFullscreen
    || el.webkitRequestFullScreen,
  );
}

export function isDocumentFullscreen() {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement
    || document.webkitFullscreenElement,
  );
}

/** @returns {Promise<boolean>} true if entered or already active */
export async function enterDocumentFullscreen() {
  if (typeof document === 'undefined') return false;
  if (isDocumentFullscreen()) return true;
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
    if (el.webkitRequestFullScreen) {
      el.webkitRequestFullScreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** @returns {Promise<boolean>} true if exited or already inactive */
export async function exitDocumentFullscreen() {
  if (typeof document === 'undefined') return true;
  if (!isDocumentFullscreen()) return true;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    }
    if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * @param {(active: boolean) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeDocumentFullscreen(listener) {
  if (typeof document === 'undefined') return () => {};

  const notify = () => listener(isDocumentFullscreen());
  document.addEventListener('fullscreenchange', notify);
  document.addEventListener('webkitfullscreenchange', notify);
  return () => {
    document.removeEventListener('fullscreenchange', notify);
    document.removeEventListener('webkitfullscreenchange', notify);
  };
}
