/** Keep opener so Electron can attach a same-origin guest window (not system browser). */
const FEATURES = 'popup=yes,width=1600,height=900';

/**
 * Open kitchen TV board on a second monitor / new window (same app origin).
 * @returns {{ ok: boolean, blocked?: boolean, win?: Window|null }}
 */
export function openReadyDisplayWindow() {
  const url = `${window.location.origin}/rst/ready-display`;
  let win = null;
  try {
    win = window.open(url, 'rst-ready-display', FEATURES);
  } catch {
    win = null;
  }
  if (!win) {
    try {
      win = window.open(url, 'rst-ready-display');
    } catch {
      win = null;
    }
  }
  if (!win) {
    return { ok: false, blocked: true, win: null };
  }
  try {
    win.focus();
  } catch {
    /* ignore */
  }
  return { ok: true, win };
}
