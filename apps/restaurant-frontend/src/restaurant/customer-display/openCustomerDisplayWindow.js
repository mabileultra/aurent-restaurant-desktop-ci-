/** Keep opener so Electron can attach a same-origin guest window (not system browser). */
const FEATURES = 'popup=yes,width=1280,height=800';

/** Open guest display on a second monitor / new window (same app origin). */
export function openCustomerDisplayWindow() {
  const url = `${window.location.origin}/rst/customer-display`;
  const win = window.open(url, 'rst-customer-display', FEATURES);
  if (win) {
    try {
      win.focus();
    } catch {
      /* ignore */
    }
  }
  return win;
}
